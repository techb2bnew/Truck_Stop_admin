import { ResourcePage } from '../components/ResourcePage'
import { StatusBadge } from '../components/ui'
import { num } from '../lib/format'
import { db, useCollection } from '../services/store'
import type { Truck } from '../types'

export default function Trucks() {
  const drivers = useCollection(db.drivers)
  return (
    <ResourcePage<Truck>
      title="Trucks"
      subtitle="Sample trucks students can pick for a load."
      singular="Truck"
      collection={db.trucks}
      defaults={{ unitNumber: '', equipment: 'Van', make: '', year: 2022, plate: '', capacityLbs: 45000, lengthFt: 53, mpg: 7, locationCity: '', locationState: '', status: 'available' }}
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
      fields={[
        { name: 'unitNumber', label: 'Unit number', type: 'text', required: true, placeholder: 'TS-109' },
        { name: 'equipment', label: 'Equipment', type: 'select', required: true, options: ['Van', 'Reefer', 'Flatbed'].map((v) => ({ value: v, label: v })) },
        { name: 'make', label: 'Make and model', type: 'text', required: true },
        { name: 'year', label: 'Year', type: 'number', required: true },
        { name: 'plate', label: 'Plate', type: 'text', required: true },
        { name: 'capacityLbs', label: 'Capacity (lb)', type: 'number', required: true },
        { name: 'lengthFt', label: 'Length (ft)', type: 'number', required: true },
        { name: 'mpg', label: 'MPG', type: 'number', step: '0.1', required: true },
        { name: 'locationCity', label: 'Current city', type: 'text', required: true },
        { name: 'locationState', label: 'Current state', type: 'text', required: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'available', label: 'Available' }, { value: 'in_use', label: 'In use' }, { value: 'maintenance', label: 'Maintenance' }] },
      ]}
      beforeDelete={(t) => (db.scenarios.snapshot().some((s) => s.truckIds.includes(t.id)) ? 'This truck is used in a scenario' : null)}
    />
  )
}
