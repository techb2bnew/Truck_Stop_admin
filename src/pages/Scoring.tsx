import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, PageHeader, useToast } from '../components/ui'
import { db, useCollection } from '../services/store'
import type { ScoringProfile } from '../types'

export default function Scoring() {
  const profiles = useCollection(db.scoringProfiles)
  const toast = useToast()
  const create = async () => {
    await db.scoringProfiles.create({ name: 'New scoring profile', passMark: 70, criteria: [{ key: 'c1', label: 'Criterion 1', weight: 100 }] })
    toast('Profile added')
  }
  return (
    <div>
      <PageHeader
        title="Scoring Rules"
        subtitle="Decide how an attempt is scored. Weights must add up to 100."
        actions={<Button onClick={create}><Plus size={16} /> New profile</Button>}
      />
      <div className="space-y-4">
        {profiles.map((p) => <ProfileCard key={p.id} profile={p} />)}
      </div>
    </div>
  )
}

function ProfileCard({ profile }: { profile: ScoringProfile }) {
  const toast = useToast()
  const [draft, setDraft] = useState(profile)
  const total = draft.criteria.reduce((n, c) => n + (Number(c.weight) || 0), 0)
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile)
  const used = db.scenarios.snapshot().filter((s) => s.scoringProfileId === profile.id).length

  const setCrit = (i: number, patch: Partial<ScoringProfile['criteria'][number]>) =>
    setDraft({ ...draft, criteria: draft.criteria.map((c, k) => (k === i ? { ...c, ...patch } : c)) })

  const save = async () => {
    if (total !== 100) return toast('Weights must add up to exactly 100')
    if (!draft.name.trim()) return toast('Give the profile a name')
    await db.scoringProfiles.update(profile.id, { ...draft, criteria: draft.criteria.map((c, i) => ({ ...c, key: c.key || `c${i + 1}` })) })
    toast('Scoring profile saved')
  }
  const remove = async () => {
    if (used) return toast(`Used by ${used} scenario(s). Change them first`)
    await db.scoringProfiles.remove(profile.id)
    toast('Profile deleted')
  }

  return (
    <Card className="p-5">
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
            <input className="input flex-1" value={c.label} onChange={(e) => setCrit(i, { label: e.target.value })} aria-label="Criterion name" />
            <div className="flex w-32 items-center gap-1.5">
              <input className="input" type="number" min={0} max={100} value={c.weight} onChange={(e) => setCrit(i, { weight: Number(e.target.value) })} aria-label="Weight" />
              <span className="text-sm text-slate-500">%</span>
            </div>
            <button onClick={() => setDraft({ ...draft, criteria: draft.criteria.filter((_, k) => k !== i) })} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove criterion"><Trash2 size={16} /></button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setDraft({ ...draft, criteria: [...draft.criteria, { key: `c${draft.criteria.length + 1}`, label: '', weight: 0 }] })}><Plus size={14} /> Add criterion</Button>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className={`text-sm font-medium ${total === 100 ? 'text-emerald-600' : 'text-red-600'}`}>Total weight: {total} / 100</div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={remove}>Delete</Button>
          {dirty && <Button variant="secondary" onClick={() => setDraft(profile)}>Discard</Button>}
          <Button disabled={!dirty} onClick={save}>Save changes</Button>
        </div>
      </div>
    </Card>
  )
}
