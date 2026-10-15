import { useEntityForms } from '../lib/entityForms'
import { ResourcePage } from '../components/ResourcePage'
import { StatusBadge } from '../components/ui'
import { num } from '../lib/format'
import { db, useCollection } from '../services/store'
import type { Truck } from '../types'

export default function Trucks() {
  const form = useEntityForms().truck
  const drivers = useCollection(db.drivers)
  return (
    <ResourcePage<Truck>
      title="Trucks"
      subtitle="Sample trucks students can pick for a load."
      singular="Truck"
      collection={db.trucks}
      defaults={form.defaults as never}
      searchText={(t) => `${t.unitNumber} ${t.make} ${t.plate} ${t.locationCity}`}
      filters={[
        { label: 'Equipment', options: ['Van', 'Reefer', 'Flatbed'].map((v) => ({ value: v, label: v })), match: (t, v) => t.equipment === v },
        { label: 'Status', options: [{ value: 'available', label: 'Available' }, { value: 'in_use', label: 'In use' }, { value: 'maintenance', label: 'Maintenance' }], match: (t, v) => t.status === v },
      ]}
      columns={[
        { header: 'Unit', sortValue: (t) => t.unitNumber, render: (t) => <div><div className="font-medium text-slate-900">{t.unitNumber}</div><div className="text-xs text-slate-500">{t.make} · {t.year}</div></div> },
        { header: 'Equipment', mobile: true, render: (t) => t.equipment },
        { header: 'Capacity', render: (t) => `${num(t.capacityLbs)} lb · ${t.lengthFt} ft` },
        { header: 'MPG', render: (t) => t.mpg },
        { header: 'Location', render: (t) => `${t.locationCity}, ${t.locationState}` },
        { header: 'Driver', render: (t) => drivers.find((d) => d.truckId === t.id)?.name ?? <span className="text-slate-400">Unassigned</span> },
        { header: 'Status', mobile: true, sortValue: (t) => t.status, render: (t) => <StatusBadge value={t.status} /> },
      ]}
      fields={form.fields}
      validate={form.validate}
      beforeDelete={(t) => (db.scenarios.snapshot().some((s) => s.truckIds.includes(t.id)) ? 'This truck is used in a scenario' : null)}
    />
  )
}
