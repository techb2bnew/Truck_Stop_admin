import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link, useParams } from 'react-router-dom'
import { Badge, Card, EmptyState, StatusBadge } from '../components/ui'
import { fmtDate, fmtDateTime } from '../lib/format'
import { batchName, roleLabel, scenarioTitle } from '../lib/lookup'
import { db, useCollection } from '../services/store'

export default function StudentDetail() {
  const { id } = useParams()
  const students = useCollection(db.students)
  const batches = useCollection(db.batches)
  const assignments = useCollection(db.assignments)
  const attempts = useCollection(db.attempts)
  const scenarios = useCollection(db.scenarios)
  const student = students.find((s) => s.id === id)

  if (!student) return <EmptyState title="Student not found" hint="It may have been deleted." />

  const mine = assignments.filter((a) => a.studentId === student.id)
  const myAttempts = attempts.filter((a) => a.studentId === student.id).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  const scored = myAttempts.map((a) => a.trainerScore ?? a.autoScore)
  const avg = scored.length ? Math.round(scored.reduce((n, v) => n + v, 0) / scored.length) : null
  const best = scored.length ? Math.max(...scored) : null
  const chart = myAttempts.map((a, i) => ({ name: `#${i + 1}`, score: a.trainerScore ?? a.autoScore }))

  return (
    <div>
      <Link to="/students" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={16} /> Back to students</Link>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">{student.name[0]}</div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{student.name}</h1>
              <StatusBadge value={student.status} />
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600"><Mail size={16} className="text-slate-400" />{student.email}</div>
            <div className="flex items-center gap-2 text-slate-600"><Phone size={16} className="text-slate-400" />{student.phone}</div>
            <div className="flex justify-between"><dt className="text-slate-500">Batch</dt><dd className="font-medium">{batchName(batches, student.batchId)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Joined</dt><dd className="font-medium">{fmtDate(student.joinedAt)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">App access</dt><dd>{student.appAccess ? <Badge tone="green">Enabled</Badge> : <Badge>Blocked</Badge>}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-slate-500">Role</dt><dd className="flex gap-1">{student.roles.length ? student.roles.map((r) => <Badge key={r} tone="blue">{roleLabel(r)}</Badge>) : <span className="text-slate-400">Not assigned</span>}</dd></div>
          </dl>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4"><div className="text-xs font-semibold uppercase text-slate-500">Attempts</div><div className="mt-1 text-2xl font-bold">{myAttempts.length}</div></Card>
            <Card className="p-4"><div className="text-xs font-semibold uppercase text-slate-500">Average</div><div className="mt-1 text-2xl font-bold">{avg ?? '—'}{avg != null && '%'}</div></Card>
            <Card className="p-4"><div className="text-xs font-semibold uppercase text-slate-500">Best score</div><div className="mt-1 text-2xl font-bold">{best ?? '—'}{best != null && '%'}</div></Card>
          </div>
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-900">Score progress</h2>
            {chart.length < 2 ? (
              <p className="py-10 text-center text-sm text-slate-500">At least two attempts are needed to show progress.</p>
            ) : (
              <div className="mt-2 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#f58a07" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">Practice and attempts</h2></div>
        {mine.length === 0 ? (
          <EmptyState title="No practice assigned yet" hint="Assign one from the Assignments page." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2.5">Scenario</th><th className="px-4 py-2.5">Due</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Attempts</th><th className="px-4 py-2.5">Last score</th><th className="px-4 py-2.5">Mistakes</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mine.map((a) => {
                const last = myAttempts.filter((x) => x.assignmentId === a.id).at(-1)
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{scenarioTitle(scenarios, a.scenarioId)}</td>
                    <td className="px-4 py-3">{fmtDate(a.dueDate)}</td>
                    <td className="px-4 py-3"><StatusBadge value={a.status} /></td>
                    <td className="px-4 py-3">{a.attemptsUsed}</td>
                    <td className="px-4 py-3">{last ? <span title={fmtDateTime(last.submittedAt)}>{last.trainerScore ?? last.autoScore}%</span> : '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{last?.mistakes.length ? last.mistakes.join(' · ') : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
