import { useState } from 'react'
import { Button, Card, ConfirmDialog, FormField, PageHeader, useToast } from '../components/ui'
import { useAuth } from '../lib/auth'
import { db, resetDemoData, useCollection } from '../services/store'
import type { AppSettings } from '../types'

export default function Settings() {
  const { user } = useAuth()
  const stored = useCollection(db.settings)[0]
  const toast = useToast()
  const [draft, setDraft] = useState<AppSettings>(stored)
  const [confirm, setConfirm] = useState(false)

  const set = (k: keyof AppSettings, v: string) => setDraft({ ...draft, [k]: k === 'organisation' ? v : Number(v) })
  const save = async () => {
    if (draft.defaultPassMark < 0 || draft.defaultPassMark > 100) return toast('Pass mark must be 0 to 100')
    await db.settings.update(draft.id, draft)
    toast('Settings saved')
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
        <p className="mt-3 text-xs text-slate-400">Profile editing and password change come with Supabase Auth.</p>
      </Card>

      <Card className="mb-3 p-4 sm:mb-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Profit formulas</h2>
        <p className="mt-1 text-sm text-slate-500">Used for load analysis in the student app, so profit is calculated the same way for everyone.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-3 sm:gap-4">
          <FormField label="Fuel cost per mile ($)"><input className="input" type="number" step="0.01" value={draft.fuelCostPerMile} onChange={(e) => set('fuelCostPerMile', e.target.value)} /></FormField>
          <FormField label="Driver pay per mile ($)"><input className="input" type="number" step="0.01" value={draft.driverPayPerMile} onChange={(e) => set('driverPayPerMile', e.target.value)} /></FormField>
          <FormField label="Deadhead cost per mile ($)"><input className="input" type="number" step="0.01" value={draft.deadheadRatePerMile} onChange={(e) => set('deadheadRatePerMile', e.target.value)} /></FormField>
        </div>
      </Card>

      <Card className="mb-3 p-4 sm:mb-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Application defaults</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-3 sm:gap-4">
          <FormField label="Organisation" className="col-span-2 sm:col-span-1"><input className="input" value={draft.organisation} onChange={(e) => set('organisation', e.target.value)} /></FormField>
          <FormField label="Default max attempts"><input className="input" type="number" min={1} value={draft.defaultMaxAttempts} onChange={(e) => set('defaultMaxAttempts', e.target.value)} /></FormField>
          <FormField label="Default pass mark (%)"><input className="input" type="number" min={0} max={100} value={draft.defaultPassMark} onChange={(e) => set('defaultPassMark', e.target.value)} /></FormField>
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={save}>Save settings</Button></div>
      </Card>

      <Card className="border-red-200 p-5">
        <h2 className="text-sm font-semibold text-red-700">Demo data</h2>
        <p className="mt-1 text-sm text-slate-500">All changes are saved only in this browser while we use mock data. Reset to bring back the original sample data.</p>
        <Button variant="danger" className="mt-3" onClick={() => setConfirm(true)}>Reset demo data</Button>
      </Card>

      <ConfirmDialog
        open={confirm}
        title="Reset demo data"
        message="Every change you made will be lost and the original sample data will come back."
        confirmLabel="Reset"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          resetDemoData()
          setDraft(db.settings.snapshot()[0])
          setConfirm(false)
          toast('Demo data reset')
        }}
      />
    </div>
  )
}
