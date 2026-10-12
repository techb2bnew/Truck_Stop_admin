import { useState } from 'react'
import { Badge, Button, Card, EmptyState, FormField, Modal, PageHeader, StatusBadge, Tabs, useToast } from '../components/ui'
import { TODAY, fmtDateTime } from '../lib/format'
import { byId, scenarioTitle, studentName } from '../lib/lookup'
import { db, useCollection } from '../services/store'
import type { Attempt } from '../types'

type Tab = 'pending_review' | 'done' | 'all'

export default function Reviews() {
  const attempts = useCollection(db.attempts)
  const students = useCollection(db.students)
  const scenarios = useCollection(db.scenarios)
  const [tab, setTab] = useState<Tab>('pending_review')
  const [open, setOpen] = useState<Attempt | null>(null)

  const list = attempts
    .filter((a) => (tab === 'all' ? true : tab === 'pending_review' ? a.status === 'pending_review' : a.status !== 'pending_review'))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const pending = attempts.filter((a) => a.status === 'pending_review').length

  return (
    <div>
      <PageHeader title="Review & Retry" subtitle="Check submitted attempts, adjust the score, give feedback and approve or send back for retry." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[{ value: 'pending_review', label: 'Waiting for review', count: pending }, { value: 'done', label: 'Reviewed' }, { value: 'all', label: 'All attempts', count: attempts.length }]}
      />
      <Card className="overflow-x-auto">
        {list.length === 0 ? <EmptyState title="Nothing here" hint="Submitted attempts will appear in this list." /> : (
          <>
          <div className="divide-y divide-slate-100 md:hidden">
            {list.map((a) => (
              <div key={a.id} className="flex items-center gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{studentName(students, a.studentId)}</div>
                  <div className="truncate text-xs text-slate-500">{scenarioTitle(scenarios, a.scenarioId)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <StatusBadge value={a.status} />
                    <span>#{a.attemptNo}</span>
                    <span>Auto {a.autoScore}%{a.trainerScore != null ? ` · Trainer ${a.trainerScore}%` : ''}</span>
                  </div>
                </div>
                <Button size="sm" variant={a.status === 'pending_review' ? 'primary' : 'secondary'} onClick={() => setOpen(a)}>{a.status === 'pending_review' ? 'Review' : 'View'}</Button>
              </div>
            ))}
          </div>
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2.5">Student</th><th className="px-4 py-2.5">Scenario</th><th className="px-4 py-2.5">Attempt</th><th className="px-4 py-2.5">Submitted</th><th className="px-4 py-2.5">Auto</th><th className="px-4 py-2.5">Trainer</th><th className="px-4 py-2.5">Status</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-slate-900">{studentName(students, a.studentId)}</td>
                  <td className="px-4 py-3">{scenarioTitle(scenarios, a.scenarioId)}</td>
                  <td className="px-4 py-3">#{a.attemptNo}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtDateTime(a.submittedAt)}</td>
                  <td className="px-4 py-3">{a.autoScore}%</td>
                  <td className="px-4 py-3">{a.trainerScore != null ? `${a.trainerScore}%` : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge value={a.status} /></td>
                  <td className="px-4 py-3 text-right"><Button size="sm" variant={a.status === 'pending_review' ? 'primary' : 'secondary'} onClick={() => setOpen(a)}>{a.status === 'pending_review' ? 'Review' : 'View'}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </Card>
      {open && <ReviewModal attempt={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function ReviewModal({ attempt, onClose }: { attempt: Attempt; onClose: () => void }) {
  const students = useCollection(db.students)
  const scenarios = useCollection(db.scenarios)
  const profiles = useCollection(db.scoringProfiles)
  const feedbacks = useCollection(db.feedbacks)
  const assignments = useCollection(db.assignments)
  const toast = useToast()

  const scenario = byId(scenarios, attempt.scenarioId)
  const profile = byId(profiles, scenario?.scoringProfileId)
  const assignment = byId(assignments, attempt.assignmentId)
  const previous = feedbacks.find((f) => f.attemptId === attempt.id)
  const readOnly = attempt.status !== 'pending_review'

  const [score, setScore] = useState(String(attempt.trainerScore ?? attempt.autoScore))
  const [comment, setComment] = useState(previous?.comment ?? '')
  const canRetry = (assignment?.attemptsUsed ?? 0) < (scenario?.maxAttempts ?? 0)

  const finish = async (decision: 'approved' | 'retry') => {
    const value = Number(score)
    if (Number.isNaN(value) || value < 0 || value > 100) return toast('Score must be between 0 and 100')
    if (!comment.trim()) return toast('Write a short comment for the student')
    await db.attempts.update(attempt.id, { trainerScore: value, status: decision })
    await db.feedbacks.create({ attemptId: attempt.id, trainerId: 'tr1', comment: comment.trim(), decision, createdAt: `${TODAY}T10:00:00` })
    if (assignment) await db.assignments.update(assignment.id, { status: decision === 'approved' ? 'reviewed' : 'retry' })
    await db.notifications.create({ kind: 'feedback', title: decision === 'approved' ? 'Practice reviewed' : 'Please try again', body: comment.trim(), target: 'student', targetId: attempt.studentId, createdAt: `${TODAY}T10:00:00` })
    toast(decision === 'approved' ? 'Attempt approved' : 'Sent back for retry')
    onClose()
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={`${studentName(students, attempt.studentId)} · attempt #${attempt.attemptNo}`}
      footer={
        readOnly ? <Button variant="secondary" onClick={onClose}>Close</Button> : (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="danger" disabled={!canRetry} title={canRetry ? '' : 'No attempts left'} onClick={() => finish('retry')}>Send back for retry</Button>
            <Button onClick={() => finish('approved')}>Approve</Button>
          </>
        )
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="font-medium text-slate-900">{scenario?.title}</span>
        <Badge>{attempt.timeSpentMin} min used</Badge>
        {scenario && attempt.timeSpentMin > scenario.timeLimitMin && <Badge tone="red">over the {scenario.timeLimitMin} min limit</Badge>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="label">Auto score breakdown ({attempt.autoScore}%)</div>
          <div className="space-y-2.5">
            {attempt.breakdown.map((b) => {
              const c = profile?.criteria.find((x) => x.key === b.key)
              const max = c?.weight ?? 20
              return (
                <div key={b.key}>
                  <div className="mb-1 flex justify-between text-xs text-slate-600"><span>{c?.label ?? b.key}</span><span>{b.score} / {max}</span></div>
                  <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, (b.score / max) * 100)}%` }} /></div>
                </div>
              )
            })}
          </div>
          {profile && <p className="mt-3 text-xs text-slate-500">Pass mark: {profile.passMark}%</p>}
        </div>
        <div>
          <div className="label">Mistakes found</div>
          {attempt.mistakes.length === 0 ? <p className="text-sm text-emerald-700">No mistakes found.</p> : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{attempt.mistakes.map((m) => <li key={m}>{m}</li>)}</ul>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <FormField label="Trainer score (%)"><input className="input" type="number" min={0} max={100} value={score} disabled={readOnly} onChange={(e) => setScore(e.target.value)} /></FormField>
        <FormField label="Feedback for the student" className="sm:col-span-3"><textarea className="input min-h-20" value={comment} disabled={readOnly} onChange={(e) => setComment(e.target.value)} placeholder="What went well, what to fix next time" /></FormField>
      </div>
      {!readOnly && !canRetry && <p className="mt-3 text-xs text-amber-700">No attempts left for this scenario, so retry is disabled.</p>}
    </Modal>
  )
}
