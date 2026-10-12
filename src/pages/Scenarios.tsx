import { Zap, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ResourcePage } from '../components/ResourcePage'
import { Badge, Button, Modal, StatusBadge, useToast } from '../components/ui'
import { loadLabel, roleLabel } from '../lib/lookup'
import { db, uid, useCollection } from '../services/store'
import type { Scenario, ScenarioEvent } from '../types'

const eventTypes: { value: ScenarioEvent['type']; label: string }[] = [
  { value: 'driver_unavailable', label: 'Driver unavailable' },
  { value: 'pickup_delay', label: 'Pickup delay' },
  { value: 'rate_dispute', label: 'Rate dispute' },
  { value: 'carrier_cancel', label: 'Carrier cancels' },
  { value: 'breakdown', label: 'Truck breakdown' },
]

export default function Scenarios() {
  const loads = useCollection(db.loads)
  const trucks = useCollection(db.trucks)
  const drivers = useCollection(db.drivers)
  const brokers = useCollection(db.brokers)
  const shippers = useCollection(db.shippers)
  const documents = useCollection(db.documents)
  const rules = useCollection(db.negotiationRules)
  const profiles = useCollection(db.scoringProfiles)
  const scenarios = useCollection(db.scenarios)
  const assignments = useCollection(db.assignments)
  const settings = useCollection(db.settings)[0]
  const [eventsFor, setEventsFor] = useState<string | null>(null)

  return (
    <>
      <ResourcePage<Scenario>
        title="Practice Scenarios"
        subtitle="Build real-life situations. Link the loads, trucks, drivers, documents, negotiation rule and scoring each scenario uses."
        singular="Scenario"
        collection={db.scenarios}
        wide
        defaults={{
          title: '', role: 'dispatcher', difficulty: 'easy', background: '', instructions: '', timeLimitMin: 30,
          maxAttempts: settings?.defaultMaxAttempts ?? 3, loadIds: [], truckIds: [], driverIds: [], brokerId: null, shipperId: null,
          documentIds: [], negotiationRuleId: null, scoringProfileId: null, events: [], status: 'draft',
        }}
        searchText={(s) => `${s.title} ${s.background}`}
        filters={[
          { label: 'Role', options: [{ value: 'dispatcher', label: 'Dispatcher' }, { value: 'broker', label: 'Freight Broker' }], match: (s, v) => s.role === v },
          { label: 'Difficulty', options: ['easy', 'medium', 'hard'].map((v) => ({ value: v, label: v })), match: (s, v) => s.difficulty === v },
          { label: 'Status', options: [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }], match: (s, v) => s.status === v },
        ]}
        columns={[
          { header: 'Scenario', sortValue: (s) => s.title, render: (s) => <div><div className="font-medium text-slate-900">{s.title}</div><div className="text-xs text-slate-500">{s.loadIds.map((id) => { const l = loads.find((x) => x.id === id); return l ? loadLabel(l) : '' }).join(' | ')}</div></div> },
          { header: 'Role', mobile: true, render: (s) => <Badge tone={s.role === 'dispatcher' ? 'blue' : 'violet'}>{roleLabel(s.role)}</Badge> },
          { header: 'Level', mobile: true, sortValue: (s) => s.difficulty, render: (s) => <StatusBadge value={s.difficulty} /> },
          { header: 'Limits', render: (s) => <span className="text-slate-600">{s.timeLimitMin} min · {s.maxAttempts} tries</span> },
          { header: 'Events', render: (s) => s.events.length },
          { header: 'Assigned', render: (s) => assignments.filter((a) => a.scenarioId === s.id).length },
          { header: 'Status', mobile: true, render: (s) => <StatusBadge value={s.status} /> },
        ]}
        extraRowActions={(s) => (
          <button onClick={() => setEventsFor(s.id)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600" title="Scenario events" aria-label="Scenario events">
            <Zap size={16} />
          </button>
        )}
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true, span: 2 },
          { name: 'role', label: 'For role', type: 'select', required: true, options: [{ value: 'dispatcher', label: 'Dispatcher' }, { value: 'broker', label: 'Freight Broker' }] },
          { name: 'difficulty', label: 'Difficulty', type: 'select', required: true, options: ['easy', 'medium', 'hard'].map((v) => ({ value: v, label: v })) },
          { name: 'background', label: 'Background story', type: 'textarea', required: true },
          { name: 'instructions', label: 'Task instructions', type: 'textarea', required: true },
          { name: 'timeLimitMin', label: 'Time limit (minutes)', type: 'number', required: true },
          { name: 'maxAttempts', label: 'Max attempts', type: 'number', required: true },
          { name: 'loadIds', label: 'Loads on the board', type: 'multiselect', options: loads.map((l) => ({ value: l.id, label: loadLabel(l) })) },
          { name: 'truckIds', label: 'Trucks available', type: 'multiselect', options: trucks.map((t) => ({ value: t.id, label: `${t.unitNumber} · ${t.equipment} · ${t.locationCity}` })) },
          { name: 'driverIds', label: 'Drivers available', type: 'multiselect', options: drivers.map((d) => ({ value: d.id, label: `${d.name} · ${d.homeCity}` })) },
          { name: 'brokerId', label: 'Broker (dispatcher scenarios)', type: 'select', nullable: true, options: brokers.map((b) => ({ value: b.id, label: b.company })) },
          { name: 'shipperId', label: 'Shipper (broker scenarios)', type: 'select', nullable: true, options: shippers.map((s) => ({ value: s.id, label: s.company })) },
          { name: 'documentIds', label: 'Documents', type: 'multiselect', options: documents.map((d) => ({ value: d.id, label: d.name })) },
          { name: 'negotiationRuleId', label: 'Negotiation rule', type: 'select', nullable: true, options: rules.map((r) => ({ value: r.id, label: r.name })) },
          { name: 'scoringProfileId', label: 'Scoring profile', type: 'select', nullable: true, options: profiles.map((p) => ({ value: p.id, label: p.name })) },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }], hint: 'Only published scenarios can be assigned.' },
        ]}
        validate={(v) => {
          if (v.status === 'published') {
            if (!(v.loadIds as string[]).length) return 'A published scenario needs at least one load'
            if (!v.negotiationRuleId) return 'Pick a negotiation rule before publishing'
            if (!v.scoringProfileId) return 'Pick a scoring profile before publishing'
          }
          return null
        }}
        beforeDelete={(s) => (assignments.some((a) => a.scenarioId === s.id) ? 'This scenario is already assigned to students' : null)}
      />
      <EventsModal scenario={scenarios.find((s) => s.id === eventsFor) ?? null} onClose={() => setEventsFor(null)} />
    </>
  )
}

function EventsModal({ scenario, onClose }: { scenario: Scenario | null; onClose: () => void }) {
  const toast = useToast()
  const [type, setType] = useState<ScenarioEvent['type']>('pickup_delay')
  const [atMinute, setAtMinute] = useState('15')
  const [description, setDescription] = useState('')
  if (!scenario) return null

  const add = async () => {
    if (!description.trim()) return
    const ev: ScenarioEvent = { id: uid('ev'), atMinute: Number(atMinute) || 0, type, description: description.trim() }
    await db.scenarios.update(scenario.id, { events: [...scenario.events, ev].sort((a, b) => a.atMinute - b.atMinute) })
    setDescription('')
    toast('Event added')
  }
  const remove = async (id: string) => {
    await db.scenarios.update(scenario.id, { events: scenario.events.filter((e) => e.id !== id) })
    toast('Event removed')
  }

  return (
    <Modal open onClose={onClose} title={`Events: ${scenario.title}`} footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      <p className="mb-3 text-sm text-slate-500">Twists that appear during practice, like a delay or a breakdown. The student must handle them.</p>
      <ul className="mb-4 space-y-2">
        {scenario.events.length === 0 && <li className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">No events yet.</li>}
        {scenario.events.map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <Badge tone="amber">at {e.atMinute} min</Badge>
                {eventTypes.find((t) => t.value === e.type)?.label}
              </div>
              <div className="mt-1 text-sm text-slate-600">{e.description}</div>
            </div>
            <button onClick={() => remove(e.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove event"><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3">
        <div className="col-span-2">
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as ScenarioEvent['type'])}>
            {eventTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">At minute</label>
          <input className="input" type="number" min="0" value={atMinute} onChange={(e) => setAtMinute(e.target.value)} />
        </div>
        <div className="col-span-3">
          <label className="label">What happens</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Shipper says the dock is delayed by 3 hours" />
        </div>
        <div className="col-span-3 text-right"><Button size="sm" onClick={add}>Add event</Button></div>
      </div>
    </Modal>
  )
}
