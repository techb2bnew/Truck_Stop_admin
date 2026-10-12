import { ResourcePage } from '../components/ResourcePage'
import { fmtDate } from '../lib/format'
import { db, useCollection } from '../services/store'
import type { Batch } from '../types'

export default function Batches() {
  const trainers = useCollection(db.trainers)
  const students = useCollection(db.students)
  return (
    <ResourcePage<Batch>
      title="Batches"
      subtitle="Group students so courses and practice can be assigned together."
      singular="Batch"
      collection={db.batches}
      defaults={{ name: '', trainerId: 'tr1', description: '', startDate: '2026-10-12' }}
      searchText={(b) => `${b.name} ${b.description}`}
      columns={[
        { header: 'Batch', sortValue: (b) => b.name, render: (b) => <span className="font-medium text-slate-900">{b.name}</span> },
        { header: 'Trainer', render: (b) => trainers.find((t) => t.id === b.trainerId)?.name ?? '—' },
        { header: 'Students', render: (b) => students.filter((s) => s.batchId === b.id).length },
        { header: 'Start date', sortValue: (b) => b.startDate, render: (b) => fmtDate(b.startDate) },
        { header: 'Description', render: (b) => <span className="text-slate-500">{b.description}</span> },
      ]}
      fields={[
        { name: 'name', label: 'Batch name', type: 'text', required: true, span: 2 },
        { name: 'trainerId', label: 'Trainer', type: 'select', required: true, options: trainers.map((t) => ({ value: t.id, label: t.name })) },
        { name: 'startDate', label: 'Start date', type: 'date', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      beforeDelete={(b) => (students.some((s) => s.batchId === b.id) ? 'Move the students out of this batch first' : null)}
    />
  )
}
