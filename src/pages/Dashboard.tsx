import { CheckCircle2, ClipboardCheck, Clock, GraduationCap, Trophy, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Card, EmptyState, PageHeader, Stat, StatusBadge } from '../components/ui'
import { fmtDate, isOverdue } from '../lib/format'
import { byId, scenarioTitle, studentName } from '../lib/lookup'
import { db, useCollection } from '../services/store'

const statusColors: Record<string, string> = {
  assigned: '#38bdf8', in_progress: '#f59e0b', submitted: '#8b5cf6', reviewed: '#10b981', retry: '#ef4444',
}

export default function Dashboard() {
  const students = useCollection(db.students)
  const assignments = useCollection(db.assignments)
  const attempts = useCollection(db.attempts)
  const scenarios = useCollection(db.scenarios)
  const batches = useCollection(db.batches)

  const stats = useMemo(() => {
    const pending = assignments.filter((a) => a.status === 'assigned' || a.status === 'in_progress' || a.status === 'retry').length
    const completed = assignments.filter((a) => a.status === 'reviewed').length
    const awaiting = attempts.filter((a) => a.status === 'pending_review').length
    const scored = attempts.filter((a) => a.trainerScore != null || a.status === 'approved')
    const avg = scored.length ? Math.round(scored.reduce((n, a) => n + (a.trainerScore ?? a.autoScore), 0) / scored.length) : 0
    return { pending, completed, awaiting, avg, active: students.filter((s) => s.status === 'active').length }
  }, [assignments, attempts, students])

  const statusData = useMemo(() => {
    const keys = ['assigned', 'in_progress', 'submitted', 'reviewed', 'retry']
    return keys.map((k) => ({ name: k.replace('_', ' '), key: k, value: assignments.filter((a) => a.status === k).length })).filter((d) => d.value > 0)
  }, [assignments])

  const batchData = useMemo(
    () =>
      batches.map((b) => {
        const ids = students.filter((s) => s.batchId === b.id).map((s) => s.id)
        const list = attempts.filter((a) => ids.includes(a.studentId))
        const avg = list.length ? Math.round(list.reduce((n, a) => n + (a.trainerScore ?? a.autoScore), 0) / list.length) : 0
        return { name: b.name.replace('2026 – ', ''), avg }
      }),
    [batches, students, attempts],
  )

  const awaiting = attempts.filter((a) => a.status === 'pending_review')
  const overdue = assignments.filter((a) => (a.status === 'assigned' || a.status === 'in_progress') && isOverdue(a.dueDate))

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="A quick view of students, practice and performance." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Total students" value={students.length} hint={`${stats.active} active`} icon={<Users size={18} />} />
        <Stat label="Pending practices" value={stats.pending} hint="Assigned, in progress or retry" icon={<Clock size={18} />} />
        <Stat label="Completed practices" value={stats.completed} hint="Reviewed by trainer" icon={<CheckCircle2 size={18} />} />
        <Stat label="Awaiting review" value={stats.awaiting} hint="Submitted attempts" icon={<ClipboardCheck size={18} />} />
        <Stat label="Average score" value={`${stats.avg}%`} hint="Across reviewed attempts" icon={<Trophy size={18} />} />
        <Stat label="Published scenarios" value={scenarios.filter((s) => s.status === 'published').length} hint={`${scenarios.length} total`} icon={<GraduationCap size={18} />} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900">Practice status</h2>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusData.map((d) => (
                    <Cell key={d.key} fill={statusColors[d.key]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-600">
            {statusData.map((d) => (
              <span key={d.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColors[d.key] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900">Average score by batch</h2>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="avg" name="Avg score" fill="#f58a07" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Waiting for your review</h2>
            <Link to="/reviews" className="text-xs font-medium text-brand-600 hover:underline">Open reviews</Link>
          </div>
          {awaiting.length === 0 ? (
            <EmptyState title="Nothing to review" hint="New submissions show up here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {awaiting.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-slate-800">{studentName(students, a.studentId)}</div>
                    <div className="text-xs text-slate-500">{scenarioTitle(scenarios, a.scenarioId)}</div>
                  </div>
                  <Badge tone="violet">Auto score {a.autoScore}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Overdue practices</h2>
            <Link to="/assignments" className="text-xs font-medium text-brand-600 hover:underline">All assignments</Link>
          </div>
          {overdue.length === 0 ? (
            <EmptyState title="No overdue practice" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {overdue.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-slate-800">{byId(students, a.studentId)?.name}</div>
                    <div className="text-xs text-slate-500">{scenarioTitle(scenarios, a.scenarioId)} · due {fmtDate(a.dueDate)}</div>
                  </div>
                  <StatusBadge value={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
