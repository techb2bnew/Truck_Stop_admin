import { useEntityForms } from '../lib/entityForms'
import { ResourcePage } from '../components/ResourcePage'
import { StatusBadge } from '../components/ui'
import { db } from '../services/store'
import type { Broker } from '../types'

export default function Brokers() {
  const form = useEntityForms().broker
  return (
    <ResourcePage<Broker>
      title="Brokers"
      subtitle="Sample brokers students negotiate with."
      singular="Broker"
      collection={db.brokers}
      defaults={form.defaults as never}
      searchText={(b) => `${b.company} ${b.contactName} ${b.mcNumber}`}
      columns={[
        { header: 'Company', sortValue: (b) => b.company, render: (b) => <div><div className="font-medium text-slate-900">{b.company}</div><div className="text-xs text-slate-500">{b.mcNumber} · {b.address}</div></div> },
        { header: 'Contact', render: (b) => <div><div>{b.contactName}</div><div className="text-xs text-slate-500">{b.phone}</div></div> },
        { header: 'Credit', mobile: true, mobileLabel: 'Credit', sortValue: (b) => b.creditRating, render: (b) => <StatusBadge value={b.creditRating} /> },
        { header: 'Days to pay', mobile: true, sortValue: (b) => b.daysToPay, render: (b) => `${b.daysToPay} days` },
      ]}
      fields={form.fields}
      beforeDelete={(b) => (db.loads.snapshot().some((l) => l.brokerId === b.id) ? 'This broker has loads on the board' : null)}
    />
  )
}
