import { ResourcePage } from '../components/ResourcePage'
import { StatusBadge } from '../components/ui'
import { db } from '../services/store'
import type { Broker } from '../types'

export default function Brokers() {
  return (
    <ResourcePage<Broker>
      title="Brokers"
      subtitle="Sample brokers students negotiate with."
      singular="Broker"
      collection={db.brokers}
      defaults={{ company: '', contactName: '', email: '', phone: '', mcNumber: '', creditRating: 'B', daysToPay: 30, address: '' }}
      searchText={(b) => `${b.company} ${b.contactName} ${b.mcNumber}`}
      columns={[
        { header: 'Company', sortValue: (b) => b.company, render: (b) => <div><div className="font-medium text-slate-900">{b.company}</div><div className="text-xs text-slate-500">{b.mcNumber} · {b.address}</div></div> },
        { header: 'Contact', render: (b) => <div><div>{b.contactName}</div><div className="text-xs text-slate-500">{b.phone}</div></div> },
        { header: 'Credit', mobile: true, mobileLabel: 'Credit', sortValue: (b) => b.creditRating, render: (b) => <StatusBadge value={b.creditRating} /> },
        { header: 'Days to pay', mobile: true, sortValue: (b) => b.daysToPay, render: (b) => `${b.daysToPay} days` },
      ]}
      fields={[
        { name: 'company', label: 'Company', type: 'text', required: true, span: 2 },
        { name: 'contactName', label: 'Contact name', type: 'text', required: true },
        { name: 'mcNumber', label: 'MC number', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'text', required: true },
        { name: 'creditRating', label: 'Credit rating', type: 'select', required: true, options: ['A', 'B', 'C', 'D'].map((v) => ({ value: v, label: v })) },
        { name: 'daysToPay', label: 'Days to pay', type: 'number', required: true },
        { name: 'address', label: 'City, state', type: 'text', span: 2 },
      ]}
      beforeDelete={(b) => (db.loads.snapshot().some((l) => l.brokerId === b.id) ? 'This broker has loads on the board' : null)}
    />
  )
}
