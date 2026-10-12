import { TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ResourcePage } from '../components/ResourcePage'
import { Badge } from '../components/ui'
import { fmtDate, money, num } from '../lib/format'
import { brokerName } from '../lib/lookup'
import { db, useCollection } from '../services/store'
import type { Load } from '../types'

const equipmentOptions = ['Van', 'Reefer', 'Flatbed'].map((v) => ({ value: v, label: v }))

export default function Loads() {
  const brokers = useCollection(db.brokers)
  return (
    <ResourcePage<Load>
      title="Load Board"
      subtitle="Sample loads students will see on their load board. Leave the rate blank for a no-rate load."
      singular="Load"
      collection={db.loads}
      wide
      defaults={{
        originCity: '', originState: '', destCity: '', destState: '', pickupDate: '2026-10-14', deliveryDate: '2026-10-15',
        equipment: 'Van', size: 'Full', weightLbs: 40000, lengthFt: 53, commodity: '', loadedMiles: 0, deadheadMiles: 0,
        postedRate: null, brokerId: null, postedAt: '2026-10-12T09:00:00', notes: '',
      }}
      searchText={(l) => `${l.originCity} ${l.originState} ${l.destCity} ${l.destState} ${l.commodity}`}
      filters={[
        { label: 'Equipment', options: equipmentOptions, match: (l, v) => l.equipment === v },
        { label: 'Rate', options: [{ value: 'posted', label: 'Posted' }, { value: 'none', label: 'No rate posted' }], match: (l, v) => (v === 'none' ? l.postedRate == null : l.postedRate != null) },
      ]}
      columns={[
        {
          header: 'Route',
          sortValue: (l) => l.originCity,
          render: (l) => (
            <div>
              <div className="font-medium text-slate-900">{l.originCity}, {l.originState} → {l.destCity}, {l.destState}</div>
              <div className="text-xs text-slate-500">{l.commodity} · {num(l.weightLbs)} lb</div>
            </div>
          ),
        },
        { header: 'Equipment', mobile: true, render: (l) => <Badge tone="blue">{l.equipment} · {l.size}</Badge> },
        { header: 'Pickup', sortValue: (l) => l.pickupDate, render: (l) => fmtDate(l.pickupDate) },
        { header: 'Miles', mobile: true, sortValue: (l) => l.loadedMiles, render: (l) => <span>{num(l.loadedMiles)} <span className="text-xs text-slate-400">+{l.deadheadMiles} DH</span></span> },
        { header: 'Posted rate', mobile: true, sortValue: (l) => l.postedRate ?? 0, render: (l) => (l.postedRate == null ? <Badge tone="amber">No rate posted</Badge> : <span className="font-medium">{money(l.postedRate)}</span>) },
        { header: 'Broker', render: (l) => <span className="text-slate-600">{brokerName(brokers, l.brokerId)}</span> },
      ]}
      extraRowActions={(l) => (
        <Link to={`/rate-insights?load=${l.id}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600" title="Rate insights" aria-label="Rate insights">
          <TrendingUp size={16} />
        </Link>
      )}
      fields={[
        { name: 'originCity', label: 'Origin city', type: 'text', required: true },
        { name: 'originState', label: 'Origin state', type: 'text', required: true, placeholder: 'IN' },
        { name: 'destCity', label: 'Destination city', type: 'text', required: true },
        { name: 'destState', label: 'Destination state', type: 'text', required: true, placeholder: 'OH' },
        { name: 'pickupDate', label: 'Pickup date', type: 'date', required: true },
        { name: 'deliveryDate', label: 'Delivery date', type: 'date', required: true },
        { name: 'equipment', label: 'Equipment', type: 'select', required: true, options: equipmentOptions },
        { name: 'size', label: 'Load size', type: 'select', required: true, options: [{ value: 'Full', label: 'Full' }, { value: 'Partial', label: 'Partial' }] },
        { name: 'weightLbs', label: 'Weight (lb)', type: 'number', required: true },
        { name: 'lengthFt', label: 'Length (ft)', type: 'number', required: true },
        { name: 'commodity', label: 'Commodity', type: 'text', required: true },
        { name: 'brokerId', label: 'Broker', type: 'select', nullable: true, options: brokers.map((b) => ({ value: b.id, label: b.company })) },
        { name: 'loadedMiles', label: 'Loaded miles', type: 'number', required: true },
        { name: 'deadheadMiles', label: 'Deadhead miles', type: 'number', required: true },
        { name: 'postedRate', label: 'Posted rate ($)', type: 'number', nullable: true, hint: 'Leave blank for "No rate posted".' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      validate={(v) => (Number(v.loadedMiles) <= 0 ? 'Loaded miles must be more than 0' : null)}
      onCreated={async (l) => {
        // Give every new load a starter estimate so Rate Insights is never empty.
        const miles = l.loadedMiles || 1
        const booked = Math.round(miles * 3)
        await db.rateEstimates.create({ loadId: l.id, low: Math.round(booked * 0.87), booked, high: Math.round(booked * 1.15), confidence: 'Medium' })
        for (const [i, w] of ['2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12'].entries()) {
          await db.rateTrends.create({ loadId: l.id, weekStart: w, avgRate: Math.round(booked * [0.94, 0.97, 1.02, 1][i]) })
        }
      }}
      beforeDelete={(l) => {
        const used = db.scenarios.snapshot().some((s) => s.loadIds.includes(l.id))
        return used ? 'This load is used in a scenario. Remove it there first' : null
      }}
    />
  )
}
