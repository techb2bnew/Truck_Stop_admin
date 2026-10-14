import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Scale } from 'lucide-react'
import { Badge, Button, Card, EmptyState, PageHeader, useToast } from '../components/ui'
import { useConfirm } from '../components/useConfirm'
import { db, useCollection } from '../services/store'
import type { ScoringProfile } from '../types'

// What a criterion measures. The practice engine marks these automatically; anything else is left for the trainer.
const MEASURES = [
  { key: 'rate', label: 'Rate vs target (dispatcher)' },
  { key: 'equipment', label: 'Correct truck and driver (dispatcher)' },
  { key: 'deadhead', label: 'Deadhead and profit (dispatcher)' },
  { key: 'negotiation', label: 'Negotiation result (broker)' },
  { key: 'carrier', label: 'Carrier selection (broker)' },
  { key: 'margin', label: 'Gross margin (broker)' },
  { key: 'documents', label: 'Document accuracy' },
  { key: 'time', label: 'Time taken' },
  { key: 'problem', label: 'Problem resolution' },
]

export default function Scoring() {
  const profiles = useCollection(db.scoringProfiles)
  const toast = useToast()
  const create = async () => {
    await db.scoringProfiles.create({ name: 'New scoring profile', passMark: 70, criteria: [{ key: 'rate', label: 'Rate vs target', weight: 100 }] })
    toast('Profile added')
  }
  return (
    <div>
      <PageHeader
        title="Scoring Rules"
        subtitle="Decide how an attempt is scored. Weights must add up to 100."
        actions={<Button onClick={create}><Plus size={16} /> New profile</Button>}
      />
      {profiles.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Scale size={22} />}
            title="No scoring profiles yet"
            hint="A scoring profile decides how an attempt is marked. Create one, then pick it in a scenario."
            action={<Button onClick={create}><Plus size={16} /> New profile</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {profiles.map((p) => <ProfileCard key={p.id} profile={p} />)}
        </div>
      )}
    </div>
  )
}

function ProfileCard({ profile }: { profile: ScoringProfile }) {
  const toast = useToast()
  const { ask, dialog } = useConfirm()
  const [draft, setDraft] = useState(profile)
  const total = draft.criteria.reduce((n, c) => n + (Number(c.weight) || 0), 0)
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile)
  const used = db.scenarios.snapshot().filter((s) => s.scoringProfileId === profile.id).length

  const setCrit = (i: number, patch: Partial<ScoringProfile['criteria'][number]>) =>
    setDraft({ ...draft, criteria: draft.criteria.map((c, k) => (k === i ? { ...c, ...patch } : c)) })

  const save = async () => {
    if (!draft.name.trim()) return toast('Give the profile a name')
    if (!Number.isFinite(draft.passMark) || draft.passMark < 0 || draft.passMark > 100) return toast('Pass mark must be 0 to 100')
    if (draft.criteria.some((c) => !MEASURES.some((m) => m.key === c.key))) return toast('Choose what each criterion measures')
    if (new Set(draft.criteria.map((c) => c.key)).size !== draft.criteria.length) return toast('Each criterion must measure something different')
    if (draft.criteria.some((c) => !c.label.trim())) return toast('Every criterion needs a name')
    if (draft.criteria.some((c) => !Number.isInteger(c.weight) || c.weight < 0 || c.weight > 100)) return toast('Each weight must be a whole number from 0 to 100')
    if (total !== 100) return toast('Weights must add up to exactly 100')
    await db.scoringProfiles.update(profile.id, { ...draft, criteria: draft.criteria })
    toast('Scoring profile saved')
  }
  const remove = () => {
    if (used) return toast(`Used by ${used} scenario(s). Change them first`)
    ask({
      title: 'Delete this scoring profile?',
      message: `"${profile.name}" will be removed for good.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        await db.scoringProfiles.remove(profile.id)
        toast('Profile deleted')
      },
    })
  }

  return (
    <Card className="p-3 sm:p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <label className="label">Profile name</label>
          <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div className="w-32">
          <label className="label">Pass mark (%)</label>
          <input className="input" type="number" min={0} max={100} value={draft.passMark} onChange={(e) => setDraft({ ...draft, passMark: Number(e.target.value) })} />
        </div>
        <Badge tone={used ? 'blue' : 'slate'}>{used} scenario(s)</Badge>
      </div>

      <div className="mt-4 space-y-2">
        {draft.criteria.map((c, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <input className="input" value={c.label} onChange={(e) => setCrit(i, { label: e.target.value })} aria-label="Criterion name" />
              <select className="input" value={MEASURES.some((m) => m.key === c.key) ? c.key : ''} onChange={(e) => setCrit(i, { key: e.target.value })} aria-label="What it measures">
                <option value="">Measures… (choose)</option>
                {MEASURES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex w-20 shrink-0 items-center gap-1 sm:w-32 sm:gap-1.5">
              <input className="input" type="number" min={0} max={100} value={c.weight} onChange={(e) => setCrit(i, { weight: Number(e.target.value) })} aria-label="Weight" />
              <span className="text-sm text-slate-500">%</span>
            </div>
            <button onClick={() => setDraft({ ...draft, criteria: draft.criteria.filter((_, k) => k !== i) })} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove criterion"><Trash2 size={16} /></button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setDraft({ ...draft, criteria: [...draft.criteria, { key: '', label: '', weight: 0 }] })}><Plus size={14} /> Add criterion</Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:pt-4">
        <div className={`whitespace-nowrap text-sm font-medium ${total === 100 ? 'text-emerald-600' : 'text-red-600'}`}>Total weight: {total} / 100</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="whitespace-nowrap" onClick={remove}>Delete</Button>
          {dirty && <Button variant="secondary" onClick={() => setDraft(profile)}>Discard</Button>}
          <Button className="whitespace-nowrap" disabled={!dirty} onClick={save}>Save changes</Button>
        </div>
      </div>
    {dialog}
    </Card>
  )
}
