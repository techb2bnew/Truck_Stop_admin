import { useEntityForms } from '../lib/entityForms'
import { ResourcePage } from '../components/ResourcePage'
import { fmtDate } from '../lib/format'
import { db, useCollection } from '../services/store'
import type { Batch } from '../types'

export default function Batches() {
  const form = useEntityForms().batch
  const trainers = useCollection(db.trainers)
  const students = useCollection(db.students)
  return (
    <ResourcePage<Batch>
      title="Batches"
      subtitle="Group students so courses and practice can be assigned together."
      singular="Batch"
      collection={db.batches}
      defaults={form.defaults as never}
      emptyHint="A batch groups students so you can give them courses and practice together."
      searchText={(b) => `${b.name} ${b.description}`}
      columns={[
        { header: 'Batch', sortValue: (b) => b.name, render: (b) => <span className="font-medium text-slate-900">{b.name}</span> },
        { header: 'Trainer', mobile: true, render: (b) => trainers.find((t) => t.id === b.trainerId)?.name ?? '—' },
        { header: 'Students', mobile: true, mobileLabel: 'Students', render: (b) => students.filter((s) => s.batchId === b.id).length },
        { header: 'Start date', sortValue: (b) => b.startDate, render: (b) => fmtDate(b.startDate) },
        { header: 'Description', render: (b) => <span className="text-slate-500">{b.description}</span> },
      ]}
      fields={form.fields}
      validate={form.validate}
      beforeDelete={(b) => (students.some((s) => s.batchId === b.id) ? 'Move the students out of this batch first' : null)}
    />
  )
}
