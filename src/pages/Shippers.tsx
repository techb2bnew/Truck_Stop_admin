import { useState } from 'react'
import { useEntityForms } from '../lib/entityForms'
import { ResourcePage } from '../components/ResourcePage'
import { Badge, Tabs } from '../components/ui'
import { fmtDate, money, num } from '../lib/format'
import { db, useCollection } from '../services/store'
import type { Shipper, ShipperRequest } from '../types'

const equipment = ['Van', 'Reefer', 'Flatbed'].map((v) => ({ value: v, label: v }))

export default function Shippers() {
  const forms = useEntityForms()
  const [tab, setTab] = useState<'shippers' | 'requests'>('shippers')
  const shippers = useCollection(db.shippers)
  const requests = useCollection(db.shipperRequests)
  return (
    <div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[{ value: 'shippers', label: 'Shippers', count: shippers.length }, { value: 'requests', label: 'Shipment requests', count: requests.length }]}
      />
      {tab === 'shippers' ? (
        <ResourcePage<Shipper>
          title="Shippers"
          subtitle="Sample shippers that send shipment requests to freight broker students."
          singular="Shipper"
          collection={db.shippers}
          defaults={forms.shipper.defaults as never}
          searchText={(s) => `${s.company} ${s.contactName} ${s.industry}`}
          columns={[
            { header: 'Company', sortValue: (s) => s.company, render: (s) => <span className="font-medium text-slate-900">{s.company}</span> },
            { header: 'Contact', render: (s) => <div><div>{s.contactName}</div><div className="text-xs text-slate-500">{s.phone}</div></div> },
            { header: 'Location', mobile: true, render: (s) => `${s.city}, ${s.state}` },
            { header: 'Industry', mobile: true, render: (s) => <Badge>{s.industry}</Badge> },
          ]}
          fields={forms.shipper.fields}
          beforeDelete={(s) => (requests.some((r) => r.shipperId === s.id) ? 'Delete this shipper’s requests first' : null)}
        />
      ) : (
        <ResourcePage<ShipperRequest>
          title="Shipment requests"
          subtitle="Requests a freight broker student receives from a shipper."
          singular="Request"
          collection={db.shipperRequests}
          wide
          defaults={{ shipperId: '', originCity: '', originState: '', destCity: '', destState: '', pickupDate: '2026-10-15', equipment: 'Van', weightLbs: 30000, commodity: '', offeredRate: 0, notes: '' }}
          searchText={(r) => `${r.originCity} ${r.destCity} ${r.commodity} ${shippers.find((s) => s.id === r.shipperId)?.company ?? ''}`}
          columns={[
            { header: 'Shipper', render: (r) => <span className="font-medium text-slate-900">{shippers.find((s) => s.id === r.shipperId)?.company ?? '—'}</span> },
            { header: 'Route', mobile: true, render: (r) => `${r.originCity}, ${r.originState} → ${r.destCity}, ${r.destState}` },
            { header: 'Freight', render: (r) => <div><div>{r.commodity}</div><div className="text-xs text-slate-500">{r.equipment} · {num(r.weightLbs)} lb</div></div> },
            { header: 'Pickup', sortValue: (r) => r.pickupDate, render: (r) => fmtDate(r.pickupDate) },
            { header: 'Offered rate', mobile: true, sortValue: (r) => r.offeredRate, render: (r) => <span className="font-medium">{money(r.offeredRate)}</span> },
          ]}
          fields={[
            { name: 'shipperId', label: 'Shipper', type: 'select', required: true, options: shippers.map((s) => ({ value: s.id, label: s.company })), addNew: { kind: 'shipper', label: 'Add new shipper' } },
            { name: 'commodity', label: 'Commodity', type: 'text', required: true },
            { name: 'originCity', label: 'Origin city', type: 'text', required: true },
            { name: 'originState', label: 'Origin state', type: 'state', required: true, placeholder: 'OH' },
            { name: 'destCity', label: 'Destination city', type: 'text', required: true },
            { name: 'destState', label: 'Destination state', type: 'state', required: true, placeholder: 'NJ' },
            { name: 'pickupDate', label: 'Pickup date', type: 'date', required: true },
            { name: 'equipment', label: 'Equipment', type: 'select', required: true, options: equipment },
            { name: 'weightLbs', label: 'Weight (lb)', type: 'number', required: true, min: 1, max: 100000, integer: true },
            { name: 'offeredRate', label: 'Offered rate ($)', type: 'number', required: true, min: 1, max: 100000 },
            { name: 'notes', label: 'Notes', type: 'textarea' },
          ]}
        />
      )}
    </div>
  )
}
