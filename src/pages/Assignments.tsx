import { UsersRound } from 'lucide-react'
import { useState } from 'react'
import { ResourcePage } from '../components/ResourcePage'
import { Button, FormField, Modal, StatusBadge, useToast } from '../components/ui'
import { TODAY, fmtDate, isOverdue } from '../lib/format'
import { batchName, scenarioTitle, studentName } from '../lib/lookup'
import { useConfirm } from '../components/useConfirm'
import { db, useCollection } from '../services/store'
import type { Assignment } from '../types'

export default function Assignments() {
  const students = useCollection(db.students)
  const scenarios = useCollection(db.scenarios)
  const batches = useCollection(db.batches)
  const assignments = useCollection(db.assignments)
  const published = scenarios.filter((s) => s.status === 'published')
  const [bulk, setBulk] = useState(false)

  return (
    <>
      <ResourcePage<Assignment>
        title="Practice Assignments"
        subtitle="Assign scenarios to students, set deadlines and track status."
        singular="Assignment"
        collection={db.assignments}
        defaults={{ scenarioId: '', studentId: '', assignedAt: TODAY, dueDate: '2026-10-20', status: 'assigned', attemptsUsed: 0 }}
        emptyHint="You need at least one student and one published scenario before you can assign practice."
        searchText={(a) => `${studentName(students, a.studentId)} ${scenarioTitle(scenarios, a.scenarioId)}`}
        headerActions={<Button variant="secondary" onClick={() => setBulk(true)}><UsersRound size={16} /> Assign to batch</Button>}
        filters={[
          { label: 'Status', options: ['assigned', 'in_progress', 'submitted', 'reviewed', 'retry'].map((v) => ({ value: v, label: v.replace('_', ' ') })), match: (a, v) => a.status === v },
          { label: 'Batch', options: batches.map((b) => ({ value: b.id, label: b.name })), match: (a, v) => students.find((s) => s.id === a.studentId)?.batchId === v },
        ]}
        columns={[
          { header: 'Student', sortValue: (a) => studentName(students, a.studentId), render: (a) => <div><div className="font-medium text-slate-900">{studentName(students, a.studentId)}</div><div className="text-xs text-slate-500">{batchName(batches, students.find((s) => s.id === a.studentId)?.batchId ?? null)}</div></div> },
          { header: 'Scenario', mobile: true, render: (a) => scenarioTitle(scenarios, a.scenarioId) },
          { header: 'Assigned', sortValue: (a) => a.assignedAt, render: (a) => fmtDate(a.assignedAt) },
          { header: 'Due', mobile: true, mobileLabel: 'Due', sortValue: (a) => a.dueDate, render: (a) => <span className={(a.status === 'assigned' || a.status === 'in_progress') && isOverdue(a.dueDate) ? 'font-medium text-red-600' : ''}>{fmtDate(a.dueDate)}</span> },
          { header: 'Attempts', render: (a) => `${a.attemptsUsed} / ${scenarios.find((s) => s.id === a.scenarioId)?.maxAttempts ?? '—'}` },
          { header: 'Status', mobile: true, sortValue: (a) => a.status, render: (a) => <StatusBadge value={a.status} /> },
        ]}
        fields={[
          { name: 'studentId', label: 'Student', type: 'select', required: true, options: students.filter((s) => s.status === 'active').map((s) => ({ value: s.id, label: s.name })), addNew: { href: '/students', label: 'Add new student (opens Students)' } },
          { name: 'scenarioId', label: 'Scenario', type: 'select', required: true, options: published.map((s) => ({ value: s.id, label: `${s.title} (${s.role})` })), hint: 'Only published scenarios are listed.', addNew: { href: '/scenarios', label: 'Create a scenario (opens Scenarios)' } },
          { name: 'dueDate', label: 'Deadline', type: 'date', required: true },
          { name: 'status', label: 'Status', type: 'select', required: true, options: ['assigned', 'in_progress', 'submitted', 'reviewed', 'retry'].map((v) => ({ value: v, label: v.replace('_', ' ') })) },
        ]}
        validate={(v) => {
          const student = students.find((s) => s.id === v.studentId)
          const scenario = scenarios.find((s) => s.id === v.scenarioId)
          if (student && scenario && !student.roles.includes(scenario.role)) {
            return `${student.name} is not a ${scenario.role === 'dispatcher' ? 'Dispatcher' : 'Freight Broker'}. Change the role first.`
          }
          if (String(v.dueDate) < String(v.assignedAt ?? TODAY) && !('id' in v)) return 'The deadline cannot be in the past'
          return null
        }}
        onCreated={async (a) => {
          const sc = scenarios.find((s) => s.id === a.scenarioId)
          await db.notifications.create({ kind: 'assignment', title: 'New practice assigned', body: `${sc?.title ?? 'A scenario'} is due ${fmtDate(a.dueDate)}.`, target: 'student', targetId: a.studentId, createdAt: `${TODAY}T09:00:00` })
        }}
      />
      {bulk && <BulkModal onClose={() => setBulk(false)} existing={assignments} />}
    </>
  )
}

function BulkModal({ onClose, existing }: { onClose: () => void; existing: Assignment[] }) {
  const batches = useCollection(db.batches)
  const students = useCollection(db.students)
  const scenarios = useCollection(db.scenarios).filter((s) => s.status === 'published')
  const toast = useToast()
  const [batchId, setBatchId] = useState('')
  const [scenarioId, setScenarioId] = useState('')
  const [dueDate, setDueDate] = useState('2026-10-20')
  const scenario = scenarios.find((s) => s.id === scenarioId)

  const eligible = students.filter((s) => s.batchId === batchId && s.status === 'active' && scenario && s.roles.includes(scenario.role) && !existing.some((a) => a.studentId === s.id && a.scenarioId === scenarioId))
  const inBatch = students.filter((s) => s.batchId === batchId).length

  const { ask, dialog } = useConfirm()
  const confirmRun = () =>
    ask({
      title: 'Assign this practice?',
      message: `${eligible.length} student(s) will get "${scenario?.title}", due ${fmtDate(dueDate)}, and the batch is notified.`,
      confirmLabel: 'Assign',
      onConfirm: run,
    })

  const run = async () => {
    for (const s of eligible) {
      await db.assignments.create({ scenarioId, studentId: s.id, assignedAt: TODAY, dueDate, status: 'assigned', attemptsUsed: 0 })
    }
    await db.notifications.create({ kind: 'assignment', title: 'New practice assigned', body: `${scenario?.title} is due ${fmtDate(dueDate)}.`, target: 'batch', targetId: batchId, createdAt: `${TODAY}T09:00:00` })
    toast(`Assigned to ${eligible.length} students`)
    onClose()
  }

  return (
    <>
    <Modal open onClose={onClose} title="Assign to a whole batch" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!batchId || !scenarioId || eligible.length === 0} onClick={confirmRun}>Assign to {eligible.length} students</Button></>}>
      <div className="space-y-4">
        <FormField required label="Batch"><select className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)}><option value="">Select batch…</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></FormField>
        <FormField required label="Scenario"><select className="input" value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}><option value="">Select scenario…</option>{scenarios.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.role})</option>)}</select></FormField>
        <FormField required label="Deadline"><input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></FormField>
        {batchId && scenarioId && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {eligible.length} of {inBatch} students will get this practice. Students without the matching role, inactive students and those who already have it are skipped.
          </p>
        )}
      </div>
    </Modal>
    {dialog}
    </>
  )
}
