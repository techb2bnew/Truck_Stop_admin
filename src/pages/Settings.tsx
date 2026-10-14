import { useState } from 'react'
import { Button, Card, EmptyState, FormField, PageHeader, useToast } from '../components/ui'
import { useAuth } from '../lib/auth'
import { db, useCollection } from '../services/store'
import type { AppSettings } from '../types'

export default function Settings() {
  const { user } = useAuth()
  const stored = useCollection(db.settings)[0]
  const toast = useToast()
  const [draft, setDraft] = useState<AppSettings | undefined>(stored)

  const set = (k: keyof AppSettings, v: string) => draft && setDraft({ ...draft, [k]: k === 'organisation' ? v : Number(v) })
  const save = async () => {
    if (!draft) return
    const next = {
      ...draft,
      organisation: draft.organisation.trim(),
      fuelCostPerMile: Number(draft.fuelCostPerMile),
      driverPayPerMile: Number(draft.driverPayPerMile),
      deadheadRatePerMile: Number(draft.deadheadRatePerMile),
      defaultMaxAttempts: Number(draft.defaultMaxAttempts),
      defaultPassMark: Number(draft.defaultPassMark),
    }
    if (!next.organisation) return toast('Organisation cannot be empty')
    for (const [label, value] of [['Fuel cost', next.fuelCostPerMile], ['Driver pay', next.driverPayPerMile], ['Deadhead cost', next.deadheadRatePerMile]] as const) {
      if (!Number.isFinite(value) || value < 0 || value > 20) return toast(`${label} per mile must be between 0 and 20`)
    }
    if (!Number.isInteger(next.defaultMaxAttempts) || next.defaultMaxAttempts < 1 || next.defaultMaxAttempts > 10) return toast('Max attempts must be a whole number from 1 to 10')
    if (!Number.isFinite(next.defaultPassMark) || next.defaultPassMark < 0 || next.defaultPassMark > 100) return toast('Pass mark must be 0 to 100')
    await db.settings.update(draft.id, next)
    toast('Settings saved')
  }

  if (!draft) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="Settings" subtitle="Admin profile, profit formulas and application defaults." />
        <Card><EmptyState title="Settings row not found" hint="Run supabase/schema.sql in the Supabase SQL Editor. It creates the default settings row." /></Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Admin profile, profit formulas and application defaults." />

      <Card className="mb-3 p-4 sm:mb-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Admin profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Name"><input className="input" value={user?.name ?? ''} disabled /></FormField>
          <FormField label="Email"><input className="input" value={user?.email ?? ''} disabled /></FormField>
          <FormField label="Permission"><input className="input" value={user?.role === 'super_admin' ? 'Super Admin: sees all students' : 'Trainer: sees own batches'} disabled /></FormField>
        </div>
        <p className="mt-3 text-xs text-slate-400">To change the admin password, use the Supabase dashboard (Authentication, Users).</p>
      </Card>

      <Card className="mb-3 p-4 sm:mb-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Profit formulas</h2>
        <p className="mt-1 text-sm text-slate-500">Used for load analysis in the student app, so profit is calculated the same way for everyone.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-3 sm:gap-4">
          <FormField required label="Fuel cost per mile ($)"><input className="input" type="number" min="0" step="0.01" value={draft.fuelCostPerMile} onChange={(e) => set('fuelCostPerMile', e.target.value)} /></FormField>
          <FormField required label="Driver pay per mile ($)"><input className="input" type="number" min="0" step="0.01" value={draft.driverPayPerMile} onChange={(e) => set('driverPayPerMile', e.target.value)} /></FormField>
          <FormField required label="Deadhead cost per mile ($)"><input className="input" type="number" min="0" step="0.01" value={draft.deadheadRatePerMile} onChange={(e) => set('deadheadRatePerMile', e.target.value)} /></FormField>
        </div>
      </Card>

      <Card className="mb-3 p-4 sm:mb-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Application defaults</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-3 sm:gap-4">
          <FormField required label="Organisation" className="col-span-2 sm:col-span-1"><input className="input" value={draft.organisation} onChange={(e) => set('organisation', e.target.value)} /></FormField>
          <FormField required label="Default max attempts"><input className="input" type="number" min={1} value={draft.defaultMaxAttempts} onChange={(e) => set('defaultMaxAttempts', e.target.value)} /></FormField>
          <FormField required label="Default pass mark (%)"><input className="input" type="number" min={0} max={100} value={draft.defaultPassMark} onChange={(e) => set('defaultPassMark', e.target.value)} /></FormField>
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={save}>Save settings</Button></div>
      </Card>


    </div>
  )
}
