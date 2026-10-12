import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'
import { batchName, roleLabel } from '../lib/lookup'
import { db, useCollection } from '../services/store'

export default function Reports() {
  const students = useCollection(db.students)
  const assignments = useCollection(db.assignments)
  const attempts = useCollection(db.attempts)
  const batches = useCollection(db.batches)
  const [batchId, setBatchId] = useState('')

  const rows = useMemo(
    () =>
      students
        .filter((s) => !batchId || s.batchId === batchId)
        .map((s) => {
          const mine = assignments.filter((a) => a.studentId === s.id)
          const att = attempts.filter((a) => a.studentId === s.id)
          const scores = att.map((a) => a.trainerScore ?? a.autoScore)
          return {
            student: s,
            assigned: mine.length,
            completed: mine.filter((a) => a.status === 'reviewed').length,
            attempts: att.length,
            avg: scores.length ? Math.round(scores.reduce((n, v) => n + v, 0) / scores.length) : null,
            best: scores.length ? Math.max(...scores) : null,
            mistakes: att.reduce((n, a) => n + a.mistakes.length, 0),
          }
        }),
    [students, assignments, attempts, batchId],
  )

  const commonMistakes = useMemo(() => {
    const counts = new Map<string, number>()
    attempts.forEach((a) => a.mistakes.forEach((m) => counts.set(m, (counts.get(m) ?? 0) + 1)))
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [attempts])

  const exportCsv = () => {
    const header = ['Student', 'Email', 'Batch', 'Role', 'Assigned', 'Completed', 'Attempts', 'Average', 'Best', 'Mistakes']
    const lines = rows.map((r) => [r.student.name, r.student.email, batchName(batches, r.student.batchId), r.student.roles.map(roleLabel).join('/'), r.assigned, r.completed, r.attempts, r.avg ?? '', r.best ?? '', r.mistakes])
    const csv = [header, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'student-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="Student Performance Reports"
        subtitle="Scores, completed tasks, mistakes and attempts for every student."
        actions={
          <>
            <select className="input w-auto" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              <option value="">All batches</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <Button variant="secondary" onClick={exportCsv}><Download size={16} /> Export CSV</Button>
          </>
        }
      />
      <Card className="overflow-x-auto">
        {rows.length === 0 ? <EmptyState title="No students in this batch" /> : (
          <>
          <div className="divide-y divide-slate-100 md:hidden">
            {rows.map((r) => (
              <div key={r.student.id} className="flex items-center gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <Link className="block truncate text-sm font-medium text-slate-900" to={`/students/${r.student.id}`}>{r.student.name}</Link>
                  <div className="truncate text-xs text-slate-500">{batchName(batches, r.student.batchId)}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {r.completed}/{r.assigned} done · {r.attempts} {r.attempts === 1 ? 'attempt' : 'attempts'} · best {r.best != null ? `${r.best}%` : '—'} · {r.mistakes} {r.mistakes === 1 ? 'mistake' : 'mistakes'}
                  </div>
                </div>
                {r.avg != null ? <Badge tone={r.avg >= 70 ? 'green' : 'red'}>{r.avg}%</Badge> : <span className="text-xs text-slate-400">—</span>}
              </div>
            ))}
          </div>
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2.5">Student</th><th className="px-4 py-2.5">Batch</th><th className="px-4 py-2.5">Role</th><th className="px-4 py-2.5">Assigned</th><th className="px-4 py-2.5">Completed</th><th className="px-4 py-2.5">Attempts</th><th className="px-4 py-2.5">Average</th><th className="px-4 py-2.5">Best</th><th className="px-4 py-2.5">Mistakes</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.student.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3"><Link className="font-medium text-slate-900 hover:text-brand-600" to={`/students/${r.student.id}`}>{r.student.name}</Link></td>
                  <td className="px-4 py-3 text-slate-600">{batchName(batches, r.student.batchId)}</td>
                  <td className="px-4 py-3">{r.student.roles.map((x) => <Badge key={x} tone="blue">{roleLabel(x)}</Badge>)}</td>
                  <td className="px-4 py-3">{r.assigned}</td>
                  <td className="px-4 py-3">{r.completed}</td>
                  <td className="px-4 py-3">{r.attempts}</td>
                  <td className="px-4 py-3">{r.avg != null ? <Badge tone={r.avg >= 70 ? 'green' : 'red'}>{r.avg}%</Badge> : '—'}</td>
                  <td className="px-4 py-3">{r.best != null ? `${r.best}%` : '—'}</td>
                  <td className="px-4 py-3">{r.mistakes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold text-slate-900">Most common mistakes</h2>
        {commonMistakes.length === 0 ? <p className="mt-2 text-sm text-slate-500">No mistakes recorded yet.</p> : (
          <ul className="mt-3 space-y-2.5">
            {commonMistakes.map(([m, n]) => (
              <li key={m}>
                <div className="mb-1 flex justify-between text-sm text-slate-700"><span>{m}</span><span className="text-slate-500">{n}×</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${(n / commonMistakes[0][1]) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
