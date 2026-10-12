import { useState } from 'react'
import { ResourcePage } from '../components/ResourcePage'
import { Badge, Button, Card, FormField, Modal } from '../components/ui'
import { money } from '../lib/format'
import { respond, type NegotiationReply } from '../logic/negotiation'
import { db } from '../services/store'
import type { NegotiationRule } from '../types'
import { MessageSquare } from 'lucide-react'

export default function Negotiation() {
  const [testing, setTesting] = useState<NegotiationRule | null>(null)
  return (
    <>
      <ResourcePage<NegotiationRule>
        title="Negotiation Rules"
        subtitle="How the simulated broker or shipper behaves. Test any rule with the simulator before using it in a scenario."
        singular="Rule"
        collection={db.negotiationRules}
        wide
        defaults={{ name: '', openingOffer: 0, targetRate: 0, minRate: 0, maxRate: 0, maxRounds: 3, stepPercent: 3, acceptMessage: 'Deal. Send the rate confirmation.', counterMessage: 'This is the best I can do.', rejectMessage: 'That is too high for this lane.' }}
        searchText={(r) => r.name}
        columns={[
          { header: 'Rule', sortValue: (r) => r.name, render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
          { header: 'Opening', render: (r) => money(r.openingOffer) },
          { header: 'Target', render: (r) => money(r.targetRate) },
          { header: 'Range', render: (r) => `${money(r.minRate)} – ${money(r.maxRate)}` },
          { header: 'Rounds', render: (r) => <Badge>{r.maxRounds} rounds</Badge> },
          { header: 'Step', render: (r) => `${r.stepPercent}%` },
        ]}
        extraRowActions={(r) => (
          <button onClick={() => setTesting(r)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600" title="Test in simulator" aria-label="Test in simulator"><MessageSquare size={16} /></button>
        )}
        fields={[
          { name: 'name', label: 'Rule name', type: 'text', required: true, span: 2 },
          { name: 'openingOffer', label: 'Opening offer ($)', type: 'number', required: true },
          { name: 'targetRate', label: 'Target rate ($)', type: 'number', required: true, hint: 'Offers at or below this are accepted straight away.' },
          { name: 'minRate', label: 'Minimum rate ($)', type: 'number', required: true },
          { name: 'maxRate', label: 'Maximum rate ($)', type: 'number', required: true, hint: 'The other side never goes above this.' },
          { name: 'maxRounds', label: 'Max rounds', type: 'number', required: true },
          { name: 'stepPercent', label: 'Move per round (%)', type: 'number', step: '0.5', required: true },
          { name: 'acceptMessage', label: 'Accept message', type: 'text' },
          { name: 'counterMessage', label: 'Counter message', type: 'text' },
          { name: 'rejectMessage', label: 'Reject message', type: 'text' },
        ]}
        validate={(v) => {
          const { minRate, targetRate, maxRate } = v as Record<string, number | string>
          if (!(Number(minRate) <= Number(targetRate) && Number(targetRate) <= Number(maxRate))) return 'Order must be: minimum ≤ target ≤ maximum'
          return null
        }}
        beforeDelete={(r) => (db.scenarios.snapshot().some((s) => s.negotiationRuleId === r.id) ? 'This rule is used in a scenario' : null)}
      />
      {testing && <Simulator rule={testing} onClose={() => setTesting(null)} />}
    </>
  )
}

interface Turn { round: number; offer: number; reply: NegotiationReply }

function Simulator({ rule, onClose }: { rule: NegotiationRule; onClose: () => void }) {
  const [offer, setOffer] = useState(String(rule.targetRate + 100))
  const [turns, setTurns] = useState<Turn[]>([])
  const ended = turns.at(-1)?.reply.ended ?? false

  const send = () => {
    const value = Number(offer)
    if (!value || ended) return
    const round = turns.length + 1
    const reply = respond(rule, value, round)
    setTurns([...turns, { round, offer: value, reply }])
    if (reply.counter) setOffer(String(reply.counter))
  }

  return (
    <Modal open onClose={onClose} title={`Simulator: ${rule.name}`} footer={<><Button variant="secondary" onClick={() => setTurns([])}>Restart</Button><Button variant="secondary" onClick={onClose}>Close</Button></>}>
      <p className="mb-3 text-sm text-slate-500">You play the student. The broker opens at {money(rule.openingOffer)} and allows {rule.maxRounds} rounds.</p>
      <Card className="mb-3 space-y-2 bg-slate-50 p-3">
        <div className="max-w-[85%] rounded-lg bg-white px-3 py-2 text-sm shadow-sm">I can pay {money(rule.openingOffer)} for this load.</div>
        {turns.map((t) => (
          <div key={t.round} className="space-y-2">
            <div className="ml-auto max-w-[85%] rounded-lg bg-brand-500 px-3 py-2 text-sm text-white">I need {money(t.offer)}.</div>
            <div className="max-w-[85%] rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              {t.reply.status === 'counter' && <b>{money(t.reply.counter ?? 0)}. </b>}
              {t.reply.message}
              <div className="mt-1"><Badge tone={t.reply.status === 'accepted' ? 'green' : t.reply.status === 'rejected' ? 'red' : 'amber'}>{t.reply.status}</Badge></div>
            </div>
          </div>
        ))}
      </Card>
      <div className="flex items-end gap-2">
        <FormField label="Your offer ($)" className="flex-1"><input className="input" type="number" value={offer} disabled={ended} onChange={(e) => setOffer(e.target.value)} /></FormField>
        <Button onClick={send} disabled={ended}>Send offer</Button>
      </div>
      {ended && <p className="mt-3 text-sm text-slate-500">Negotiation finished. Press Restart to try again.</p>}
    </Modal>
  )
}
