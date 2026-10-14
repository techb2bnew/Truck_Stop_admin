import { TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEntityForms } from '../lib/entityForms'
import { ResourcePage } from '../components/ResourcePage'
import { Badge } from '../components/ui'
import { fmtDate, money, num } from '../lib/format'
import { brokerName } from '../lib/lookup'
import { db, useCollection } from '../services/store'
import type { Load } from '../types'

const equipmentOptions = ['Van', 'Reefer', 'Flatbed'].map((v) => ({ value: v, label: v }))

export default function Loads() {
  const form = useEntityForms().load
  const brokers = useCollection(db.brokers)
  return (
    <ResourcePage<Load>
      title="Load Board"
      subtitle="Sample loads students will see on their load board. Leave the rate blank for a no-rate load."
      singular="Load"
      collection={db.loads}
      wide
      defaults={form.defaults as never}
      emptyHint="Add sample loads. Students will see them on their load board."
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
      fields={form.fields}
      validate={form.validate}
      onCreated={form.onCreated as never}
      beforeDelete={(l) => {
        const used = db.scenarios.snapshot().some((s) => s.loadIds.includes(l.id))
        return used ? 'This load is used in a scenario. Remove it there first' : null
      }}
    />
  )
}
