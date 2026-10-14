import { useEntityForms } from '../lib/entityForms'
import { ResourcePage } from '../components/ResourcePage'
import { StatusBadge } from '../components/ui'
import { money2 } from '../lib/format'
import { db, useCollection } from '../services/store'
import type { Driver } from '../types'

export default function Drivers() {
  const form = useEntityForms().driver
  const trucks = useCollection(db.trucks)
  return (
    <ResourcePage<Driver>
      title="Drivers"
      subtitle="Sample driver profiles and availability."
      singular="Driver"
      collection={db.drivers}
      defaults={form.defaults as never}
      searchText={(d) => `${d.name} ${d.phone} ${d.homeCity} ${d.licenseNo}`}
      filters={[{ label: 'Availability', options: [{ value: 'available', label: 'Available' }, { value: 'on_trip', label: 'On trip' }, { value: 'off_duty', label: 'Off duty' }], match: (d, v) => d.availability === v }]}
      columns={[
        { header: 'Driver', sortValue: (d) => d.name, render: (d) => <div><div className="font-medium text-slate-900">{d.name}</div><div className="text-xs text-slate-500">{d.phone}</div></div> },
        { header: 'License', render: (d) => d.licenseNo },
        { header: 'Experience', mobile: true, sortValue: (d) => d.experienceYears, render: (d) => `${d.experienceYears} yrs` },
        { header: 'Home', render: (d) => d.homeCity },
        { header: 'Pay / mile', sortValue: (d) => d.payPerMile, render: (d) => money2(d.payPerMile) },
        { header: 'Truck', render: (d) => trucks.find((t) => t.id === d.truckId)?.unitNumber ?? <span className="text-slate-400">None</span> },
        { header: 'Availability', mobile: true, render: (d) => <StatusBadge value={d.availability} /> },
      ]}
      fields={form.fields}
      beforeDelete={(d) => (db.scenarios.snapshot().some((s) => s.driverIds.includes(d.id)) ? 'This driver is used in a scenario' : null)}
    />
  )
}
