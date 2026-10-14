import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, FormField, PageHeader, StatusBadge, useToast } from '../components/ui'
import { fmtDate, lastWeekStarts, money } from '../lib/format'
import { loadLabel } from '../lib/lookup'
import { db, useCollection } from '../services/store'
import type { Confidence } from '../types'

export default function RateInsights() {
  const loads = useCollection(db.loads)
  const estimates = useCollection(db.rateEstimates)
  const trends = useCollection(db.rateTrends)
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const loadId = params.get('load') ?? loads[0]?.id ?? ''
  const load = loads.find((l) => l.id === loadId)
  const estimate = estimates.find((e) => e.loadId === loadId)
  const weeks = useMemo(() => trends.filter((t) => t.loadId === loadId).sort((a, b) => a.weekStart.localeCompare(b.weekStart)), [trends, loadId])

  const [draft, setDraft] = useState<{ low: string; booked: string; high: string; confidence: Confidence } | null>(null)
  const form = draft ?? (estimate
    ? { low: String(estimate.low), booked: String(estimate.booked), high: String(estimate.high), confidence: estimate.confidence }
    : { low: '', booked: '', high: '', confidence: 'Medium' as Confidence })

  const pick = (id: string) => {
    setDraft(null)
    setParams({ load: id })
  }

  const saveEstimate = async () => {
    if (!form || !load) return
    const low = Number(form.low), booked = Number(form.booked), high = Number(form.high)
    if (![low, booked, high].every((n) => Number.isFinite(n) && n > 0)) {
      toast('Low, booked and high must be more than 0')
      return
    }
    if (!(low <= booked && booked <= high)) {
      toast('Low must be below booked, and booked below high')
      return
    }
    if (estimate) await db.rateEstimates.update(estimate.id, { low, booked, high, confidence: form.confidence })
    else await db.rateEstimates.create({ loadId: load.id, low, booked, high, confidence: form.confidence })
    setDraft(null)
    toast('Rate estimate saved')
  }

  const createTrend = async () => {
    if (!load || !estimate) return
    for (const week of lastWeekStarts()) await db.rateTrends.create({ loadId: load.id, weekStart: week, avgRate: estimate.booked })
    toast('4-week trend created')
  }

  const setTrend = async (id: string, value: string) => {
    const rate = Number(value)
    if (!Number.isFinite(rate) || rate < 0) return toast('The weekly rate cannot be negative')
    await db.rateTrends.update(id, { avgRate: rate })
  }

  if (!load) return <EmptyState title="No loads yet" hint="Add loads on the Load Board first." />

  return (
    <div>
      <PageHeader title="Rate Insights" subtitle="Set the low, booked and high estimate and the 4-week trend that students see on each load." />

      <Card className="mb-4 p-4">
        <label className="label">Load</label>
        <select className="input max-w-xl" value={loadId} onChange={(e) => pick(e.target.value)}>
          {loads.map((l) => <option key={l.id} value={l.id}>{loadLabel(l)} · {l.equipment}{l.postedRate == null ? ' · no rate posted' : ''}</option>)}
        </select>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
          <Badge tone="blue">{load.equipment}</Badge>
          <span>{load.loadedMiles} loaded mi</span>
          <span>·</span>
          <span>Pickup {fmtDate(load.pickupDate)}</span>
          <span>·</span>
          {load.postedRate == null ? <Badge tone="amber">No rate posted</Badge> : <span>Posted {money(load.postedRate)}</span>}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">Rate estimate</h2>
          {!estimate && <p className="mt-1 text-sm text-slate-500">This load has no estimate yet. Fill the three numbers and save.</p>}
          {form && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <FormField required label="Low ($)"><input className="input" type="number" value={form.low} onChange={(e) => setDraft({ ...form, low: e.target.value })} /></FormField>
              <FormField required label="Booked ($)"><input className="input" type="number" value={form.booked} onChange={(e) => setDraft({ ...form, booked: e.target.value })} /></FormField>
              <FormField required label="High ($)"><input className="input" type="number" value={form.high} onChange={(e) => setDraft({ ...form, high: e.target.value })} /></FormField>
              <FormField label="Confidence" className="col-span-3">
                <select className="input" value={form.confidence} onChange={(e) => setDraft({ ...form, confidence: e.target.value as Confidence })}>
                  {['High', 'Medium', 'Low'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </FormField>
              <div className="col-span-3 flex justify-end gap-2">
                {draft && <Button variant="secondary" onClick={() => setDraft(null)}>Reset</Button>}
                <Button onClick={saveEstimate}>Save estimate</Button>
              </div>
            </div>
          )}
          {estimate && (
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Student sees</div>
              <div className="mt-2 flex items-end justify-between">
                <div><div className="text-xs text-slate-500">Low</div><div className="text-lg font-semibold text-slate-700">{money(estimate.low)}</div></div>
                <div className="text-center"><div className="text-xs text-slate-500">Booked estimate</div><div className="text-3xl font-bold text-brand-600">{money(estimate.booked)}</div></div>
                <div className="text-right"><div className="text-xs text-slate-500">High</div><div className="text-lg font-semibold text-slate-700">{money(estimate.high)}</div></div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-600">Confidence <StatusBadge value={estimate.confidence} /></div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">4-week trend</h2>
          {weeks.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">No trend for this load yet.</p>
              {estimate ? (
                <Button className="mt-3" variant="secondary" onClick={createTrend}>Create a 4-week trend</Button>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Save the estimate first, then you can create the trend.</p>
              )}
            </div>
          )}
          <div className={weeks.length === 0 ? 'hidden' : 'mt-3 h-48'}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeks.map((w) => ({ week: fmtDate(w.weekStart).replace(/, \d{4}/, ''), avg: w.avgRate }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} padding={{ left: 24, right: 24 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => money(Number(v))} />
                {estimate && <ReferenceLine y={estimate.booked} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'booked', fontSize: 10, fill: '#64748b', position: 'insideTopRight' }} />}
                <Line type="monotone" dataKey="avg" stroke="#f58a07" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {weeks.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600">Week of {fmtDate(w.weekStart)}</span>
                <input className="input w-32" type="number" value={w.avgRate} onChange={(e) => setTrend(w.id, e.target.value)} aria-label={`Average rate for week of ${w.weekStart}`} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
