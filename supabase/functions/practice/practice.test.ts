// Tests for the practice engine's pure logic. Run: node --test supabase/functions/practice/practice.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  allowedNextStatuses, brokerReply, carrierRateFor, carrierReply, requestAsLoad, buildState, ceilingFor, fieldIsCorrect, issueAnswerIsCorrect, respond, sameDate, scoreAttempt, tripProfit,
  type DocRow, type RequestRow, type DriverRow, type EventRow, type LoadRow, type Rule, type ScenarioRow, type Settings, type TruckRow,
} from './index.ts'

// The sample data from the admin panel: "No-rate load: Indianapolis to Twinsburg".
const rule: Rule = { opening_offer: 1050, target_rate: 1181, min_rate: 1100, max_rate: 1300, max_rounds: 3, step_percent: 3, accept_message: 'Okay, we can do that.', counter_message: 'Best I can do.', reject_message: 'No.' }
const load: LoadRow = { id: 'load-1', origin_city: 'Indianapolis', dest_city: 'Twinsburg', pickup_date: '2026-10-15', delivery_date: '2026-10-16', equipment: 'Van', weight_lbs: 41000, length_ft: 53, commodity: 'Auto parts', loaded_miles: 330, deadhead_miles: 25, posted_rate: null }
const truckHere: TruckRow = { id: 't1', unit_number: 'TS-101', equipment: 'Van', capacity_lbs: 45000, length_ft: 53, location_city: 'Indianapolis', status: 'available' }
const truckFar: TruckRow = { id: 't4', unit_number: 'TS-104', equipment: 'Van', capacity_lbs: 44000, length_ft: 53, location_city: 'Atlanta', status: 'available' }
const reefer: TruckRow = { id: 't2', unit_number: 'TS-102', equipment: 'Reefer', capacity_lbs: 42000, length_ft: 53, location_city: 'Dallas', status: 'available' }
const james: DriverRow = { id: 'd1', name: 'James', availability: 'available', truck_id: 't1', pay_per_mile: 0.62 }
const chris: DriverRow = { id: 'd4', name: 'Chris', availability: 'available', truck_id: 't4', pay_per_mile: 0.55 }
const settings: Settings = { fuel_cost_per_mile: 0.55, driver_pay_per_mile: 0.62, deadhead_rate_per_mile: 0.4 }
const insight = { low: 1027, booked: 1181, high: 1358 }
const criteria = [
  { key: 'rate', label: 'Rate vs target', weight: 30 },
  { key: 'equipment', label: 'Correct truck and driver', weight: 20 },
  { key: 'deadhead', label: 'Deadhead and profit', weight: 20 },
  { key: 'documents', label: 'Document accuracy', weight: 15 },
  { key: 'time', label: 'Time taken', weight: 15 },
]
const docs: DocRow[] = [
  { id: 'rc', name: 'Rate Confirmation', type: 'rate_confirmation', fields: ['Carrier name', 'Load number', 'Agreed rate', 'Pickup date', 'Delivery date'] },
  { id: 'bol', name: 'Bill of Lading', type: 'bol', fields: ['Shipper', 'Consignee', 'Commodity', 'Weight', 'Pieces', 'Signature'] },
  { id: 'pod', name: 'Proof of Delivery', type: 'pod', fields: ['Delivery date', 'Receiver name', 'Condition', 'Signature'] },
]
const scenario = (events: ScenarioRow['events'] = []): ScenarioRow => ({
  id: 's1', role: 'dispatcher', load_ids: ['load-1'], truck_ids: ['t1', 't4'], driver_ids: ['d1', 'd4'], document_ids: ['rc', 'bol', 'pod'], events,
  time_limit_min: 30, max_attempts: 3, negotiation_rule_id: 'r1', scoring_profile_id: 'sp1',
})

const T0 = new Date('2026-10-13T10:00:00Z').getTime()
let tick = 0
const ev = (type: EventRow['type'], payload: Record<string, unknown>): EventRow => ({ type, payload, created_at: new Date(T0 + tick++ * 1000).toISOString() })
const act = (kind: string, rest: Record<string, unknown> = {}) => ev('action', { kind, ...rest })
const stateAt = (events: EventRow[], minutes: number, sc = scenario()) =>
  buildState({ attemptId: 'abc123-def', assignmentId: 'as1', startedAt: new Date(T0).toISOString(), nowMs: T0 + minutes * 60000, scenario: sc, rule, docs, events })

/* ---------- negotiation ---------- */

test('the broker accepts at or below the target and creeps up round by round', () => {
  assert.equal(ceilingFor(rule, 1), 1216)
  assert.equal(ceilingFor(rule, 2), 1252)
  assert.equal(ceilingFor(rule, 3), 1287)
  assert.equal(ceilingFor(rule, 9), 1300) // never above the maximum

  assert.deepEqual(respond(rule, 1181, 1), { status: 'accepted', counter: null, message: 'Okay, we can do that.', ended: true })
})

test('an ask under the round ceiling is accepted, above it gets a counter, and the last round walks away', () => {
  assert.equal(respond(rule, 1200, 1).status, 'accepted')
  const counter = respond(rule, 1250, 1)
  assert.equal(counter.status, 'counter')
  assert.equal(counter.counter, 1216)
  assert.equal(counter.ended, false)
  assert.equal(respond(rule, 1250, 2).status, 'accepted') // ceiling rose to 1252
  const final = respond(rule, 1400, 3)
  assert.equal(final.status, 'rejected')
  assert.equal(final.counter, 1287) // the last number stays on the table
  assert.equal(final.ended, true)
})

/* ---------- dispatch status ---------- */

test('status moves forward one step at a time, and Delayed can be set and resumed', () => {
  const log = (...s: string[]) => s.map(status => ({ status })) as { status: 'assigned' | 'picked_up' | 'in_transit' | 'delayed' | 'delivered' }[]
  assert.deepEqual(allowedNextStatuses([]), [])
  assert.deepEqual(allowedNextStatuses(log('assigned')), ['picked_up', 'delayed'])
  assert.deepEqual(allowedNextStatuses(log('assigned', 'picked_up')), ['in_transit', 'delayed'])
  assert.deepEqual(allowedNextStatuses(log('assigned', 'picked_up', 'delayed')), ['in_transit'])
  assert.deepEqual(allowedNextStatuses(log('assigned', 'delayed')), ['picked_up'])
  assert.deepEqual(allowedNextStatuses(log('assigned', 'picked_up', 'in_transit')), ['delivered', 'delayed'])
  assert.deepEqual(allowedNextStatuses(log('assigned', 'picked_up', 'in_transit', 'delivered')), [])
})

/* ---------- state ---------- */

test('the practice walks through its stages in order', () => {
  const events: EventRow[] = [act('start')]
  assert.equal(stateAt(events, 1).stage, 'pick_load')

  events.push(act('select_load', { loadId: 'load-1' }))
  assert.equal(stateAt(events, 2).stage, 'crew')

  events.push(act('select_crew', { truckId: 't1', driverId: 'd1' }))
  let s = stateAt(events, 3)
  assert.equal(s.stage, 'negotiate')
  assert.equal(s.negotiation.openingOffer, 1050)
  assert.equal(s.negotiation.canAcceptOpening, true)
  assert.equal(s.negotiation.canCounter, true)

  events.push(ev('bid', { round: 1, ask: 1250, status: 'counter', counter: 1216, message: 'Best I can do.' }))
  s = stateAt(events, 4)
  assert.equal(s.negotiation.canAcceptOpening, false) // once you bargained, the opening offer is gone
  assert.equal(s.negotiation.canAcceptCounter, true)
  assert.equal(s.negotiation.lastCounter, 1216)

  events.push(act('accept', { from: 'counter', rate: 1216 }))
  s = stateAt(events, 5)
  assert.equal(s.stage, 'book')
  assert.equal(s.negotiation.agreedRate, 1216)
  assert.equal(s.negotiation.canCounter, false)

  events.push(act('book', { rate: 1216, reference: 'RC-ABC123' }))
  s = stateAt(events, 6)
  assert.equal(s.stage, 'dispatch')
  assert.equal(s.dispatchStatus, 'assigned')
  assert.equal(s.booking?.reference, 'RC-ABC123')
})

test('documents open up as the load moves, and the practice can only be submitted when everything is done', () => {
  const base: EventRow[] = [
    act('start'), act('select_load', { loadId: 'load-1' }), act('select_crew', { truckId: 't1', driverId: 'd1' }),
    act('accept', { from: 'opening', rate: 1050 }), act('book', { rate: 1050, reference: 'RC-ABC123' }),
  ]
  const open = (s: ReturnType<typeof stateAt>) => s.documents.filter(d => d.available).map(d => d.id)

  assert.deepEqual(open(stateAt(base, 5)), ['rc'])
  const picked = [...base, act('status', { status: 'picked_up' })]
  assert.deepEqual(open(stateAt(picked, 6)), ['rc', 'bol'])
  const delivered = [...picked, act('status', { status: 'in_transit' }), act('status', { status: 'delivered' })]
  const s = stateAt(delivered, 8)
  assert.deepEqual(open(s), ['rc', 'bol', 'pod'])
  assert.equal(s.canSubmit, false)
  assert.deepEqual(s.missingToSubmit, ['Submit Rate Confirmation', 'Submit Bill of Lading', 'Submit Proof of Delivery'])

  const done = [...delivered, ev('document', { docId: 'rc', values: {} }), ev('document', { docId: 'bol', values: {} }), ev('document', { docId: 'pod', values: {} })]
  const ready = stateAt(done, 9)
  assert.equal(ready.canSubmit, true)
  assert.equal(ready.stage, 'ready_to_submit')
})

test('an issue appears at its minute and has to be answered before submitting', () => {
  const sc = scenario([{ id: 'ev1', atMinute: 20, type: 'pickup_delay', description: 'The dock is late.' }])
  const events: EventRow[] = [act('start'), act('select_load', { loadId: 'load-1' }), act('select_crew', { truckId: 't1', driverId: 'd1' }), act('accept', { from: 'opening', rate: 1050 }), act('book', { rate: 1050, reference: 'RC-1' })]
  assert.equal(stateAt(events, 10, sc).issues.length, 0) // too early
  const late = stateAt(events, 25, sc)
  assert.equal(late.issues.length, 1)
  assert.equal(late.issues[0].resolved, false)
  assert.ok(late.issues[0].options.length >= 2)
  assert.ok(!JSON.stringify(late.issues[0].options).includes('correct')) // the best answer never leaves the server
  const answered = stateAt([...events, act('issue_resolved', { issueId: 'ev1', optionId: 'notify', correct: true })], 25, sc)
  assert.equal(answered.issues[0].resolved, true)
  assert.equal(issueAnswerIsCorrect('pickup_delay', 'notify'), true)
  assert.equal(issueAnswerIsCorrect('pickup_delay', 'wait'), false)
  assert.equal(issueAnswerIsCorrect('pickup_delay', 'nonsense'), null)
})

/* ---------- documents ---------- */

test('dates are accepted in the usual written forms', () => {
  assert.equal(sameDate('2026-10-15', '2026-10-15'), true)
  assert.equal(sameDate('Oct 15, 2026', '2026-10-15'), true)
  assert.equal(sameDate('October 15 2026', '2026-10-15'), true)
  assert.equal(sameDate('10/15/2026', '2026-10-15'), true)
  assert.equal(sameDate('10/16/2026', '2026-10-15'), false)
  assert.equal(sameDate('', '2026-10-15'), false)
  assert.equal(sameDate('soon', '2026-10-15'), false)
})

test('document fields are checked against the load and the booking', () => {
  const ctx = { agreedRate: 1216, reference: 'RC-ABC123', load }
  assert.equal(fieldIsCorrect('Agreed rate', '$1,216', ctx), true)
  assert.equal(fieldIsCorrect('Agreed rate', '1250', ctx), false)
  assert.equal(fieldIsCorrect('Load number', 'rc-abc123', ctx), true)
  assert.equal(fieldIsCorrect('Load number', 'RC-999', ctx), false)
  assert.equal(fieldIsCorrect('Pickup date', 'Oct 15, 2026', ctx), true)
  assert.equal(fieldIsCorrect('Delivery date', 'Oct 15, 2026', ctx), false)
  assert.equal(fieldIsCorrect('Commodity', 'auto parts', ctx), true)
  assert.equal(fieldIsCorrect('Weight', '41,000 lb', ctx), true)
  assert.equal(fieldIsCorrect('Weight', '40000', ctx), false)
  assert.equal(fieldIsCorrect('Signature', 'S. Kumar', ctx), true) // free text only has to be filled
  assert.equal(fieldIsCorrect('Signature', '   ', ctx), false)
})

/* ---------- profit ---------- */

test('profit counts fuel, driver pay and deadhead; a truck already at the pickup has none', () => {
  const near = tripProfit(load, truckHere, james, 1216, settings)
  assert.equal(near.deadhead, 0)
  assert.ok(Math.abs(near.profit - (1216 - 330 * 0.55 - 330 * 0.62)) < 0.01)

  const far = tripProfit(load, truckFar, chris, 1216, settings)
  assert.equal(far.deadhead, 25)
  assert.ok(far.profit < near.profit)
})

/* ---------- scoring ---------- */

const submittedDocs = (rate: number, wrongRate = false) => [
  ev('document', { docId: 'rc', values: { 'Carrier name': 'Midwest Haul', 'Load number': 'RC-ABC123', 'Agreed rate': String(wrongRate ? rate + 100 : rate), 'Pickup date': '2026-10-15', 'Delivery date': '2026-10-16' } }),
  ev('document', { docId: 'bol', values: { Shipper: 'Auto Co', Consignee: 'Parts Inc', Commodity: 'Auto parts', Weight: '41000', Pieces: '20', Signature: 'AB' } }),
  ev('document', { docId: 'pod', values: { 'Delivery date': '2026-10-16', 'Receiver name': 'Pat', Condition: 'Good', Signature: 'PT' } }),
]

const finishedRun = (rate: number, crew: { truckId: string; driverId: string }, opts: { negotiate?: boolean; wrongRate?: boolean; minutes?: number } = {}) => {
  const events: EventRow[] = [act('start'), act('select_load', { loadId: 'load-1' }), act('select_crew', crew)]
  if (opts.negotiate === false) {
    events.push(act('accept', { from: 'opening', rate }))
  } else {
    events.push(ev('bid', { round: 1, ask: 1250, status: 'counter', counter: 1216, message: 'x' }), act('accept', { from: 'counter', rate }))
  }
  events.push(act('book', { rate, reference: 'RC-ABC123' }), act('status', { status: 'picked_up' }), act('status', { status: 'in_transit' }), act('status', { status: 'delivered' }), ...submittedDocs(rate, opts.wrongRate))
  return { events, state: stateAt(events, opts.minutes ?? 20) }
}

test('a good run scores well and finds no mistakes', () => {
  const run = finishedRun(1216, { truckId: 't1', driverId: 'd1' })
  assert.equal(run.state.canSubmit, true)
  const result = scoreAttempt({ state: run.state, events: run.events, load, truck: truckHere, driver: james, rule, insight, settings, criteria, scenarioEvents: [] })
  const by = Object.fromEntries(result.breakdown.map(b => [b.key, b.score]))
  assert.equal(by.rate, 17) // 1216 sits 58% of the way between 1100 and 1300
  assert.equal(by.equipment, 20)
  assert.equal(by.deadhead, 20)
  assert.equal(by.documents, 15)
  assert.equal(by.time, 15)
  assert.equal(result.autoScore, 87)
  assert.deepEqual(result.mistakes, [])
})

test('mistakes cost marks and are named', () => {
  // Took the first offer, sent a truck from Atlanta, wrote the wrong rate on the rate confirmation, ran 15 minutes late.
  const run = finishedRun(1050, { truckId: 't4', driverId: 'd4' }, { negotiate: false, wrongRate: true, minutes: 45 })
  // For this lane the rate insights say 1100 is the lowest it usually pays, so 1050 is a bad deal.
  const result = scoreAttempt({ state: run.state, events: run.events, load, truck: truckFar, driver: chris, rule, insight: { low: 1100, booked: 1181, high: 1358 }, settings, criteria, scenarioEvents: [] })
  const by = Object.fromEntries(result.breakdown.map(b => [b.key, b.score]))
  assert.equal(by.rate, 0) // 1050 is under the minimum
  // 25 empty miles out of 355 is 7%, so the deadhead half is 65% and the profit half is full: 20 x 0.82 = 16
  assert.equal(by.deadhead, 16)
  assert.ok(by.documents < 15)
  assert.equal(by.time, 8) // 15 over a 30 minute limit: half the marks (rounded)
  assert.ok(result.autoScore < 70)
  const text = result.mistakes.join(' | ')
  assert.match(text, /first offer/)
  assert.match(text, /below the lowest rate/)
  assert.match(text, /Deadhead miles \(25\)/)
  assert.match(text, /Rate Confirmation: check Agreed rate/)
  assert.match(text, /15 minutes over/)
})

test('the wrong truck for the load is called out', () => {
  const events: EventRow[] = [act('start'), act('select_load', { loadId: 'load-1' }), act('select_crew', { truckId: 't2', driverId: 'd1' })]
  const state = stateAt([...events, act('accept', { from: 'opening', rate: 1050 }), act('book', { rate: 1050, reference: 'RC-ABC123' })], 5)
  const result = scoreAttempt({ state, events, load, truck: reefer, driver: james, rule, insight, settings, criteria, scenarioEvents: [] })
  const text = result.mistakes.join(' | ')
  assert.match(text, /Reefer truck for a Van load/)
  assert.match(text, /not the one assigned to that truck/)
  const equipment = result.breakdown.find(b => b.key === 'equipment')!.score
  assert.ok(equipment < 20)
})

test('delay issues expect the load to be marked Delayed and the broker to be told', () => {
  const sc = scenario([{ id: 'ev1', atMinute: 10, type: 'pickup_delay', description: 'Late dock.' }])
  const events: EventRow[] = [
    act('start'), act('select_load', { loadId: 'load-1' }), act('select_crew', { truckId: 't1', driverId: 'd1' }),
    ev('bid', { round: 1, ask: 1250, status: 'counter', counter: 1216, message: 'x' }), act('accept', { from: 'counter', rate: 1216 }),
    act('book', { rate: 1216, reference: 'RC-ABC123' }),
    act('issue_resolved', { issueId: 'ev1', optionId: 'wait', correct: false }),
    act('status', { status: 'picked_up' }), act('status', { status: 'in_transit' }), act('status', { status: 'delivered' }),
    ...submittedDocs(1216),
  ]
  const state = stateAt(events, 20, sc)
  const withProblem = [...criteria, { key: 'problem', label: 'Problem handling', weight: 10 }]
  const result = scoreAttempt({ state, events, load, truck: truckHere, driver: james, rule, insight, settings, criteria: withProblem, scenarioEvents: sc.events })
  const text = result.mistakes.join(' | ')
  assert.match(text, /Handled badly: pickup delay/)
  assert.match(text, /Did not mark the load as Delayed/)
  assert.match(text, /Did not tell the broker about the delay/)
  assert.equal(result.breakdown.find(b => b.key === 'problem')!.score, 0)
})

test('a criterion the engine cannot judge is left for the trainer', () => {
  const run = finishedRun(1216, { truckId: 't1', driverId: 'd1' })
  const result = scoreAttempt({ state: run.state, events: run.events, load, truck: truckHere, driver: james, rule, insight, settings, criteria: [...criteria, { key: 'style', label: 'Professional tone', weight: 10 }], scenarioEvents: [] })
  assert.equal(result.breakdown.find(b => b.key === 'style')!.score, 0)
  assert.match(result.mistakes.join(' | '), /Your trainer will score: Professional tone/)
})

/* ---------- broker chat ---------- */

test('the broker answers the quick questions', () => {
  assert.match(brokerReply('pickup_time', 'x', { agreedRate: null, status: null }), /8 AM/)
  assert.match(brokerReply('confirm_rate', 'x', { agreedRate: 1216, status: 'assigned' }), /\$1,216/)
  assert.match(brokerReply('confirm_rate', 'x', { agreedRate: null, status: null }), /not agreed a rate/)
  assert.match(brokerReply(null, 'the driver is running late', { agreedRate: 1216, status: 'assigned' }), /inform the shipper/)
  assert.match(brokerReply(null, 'hello', { agreedRate: null, status: null }), /get back to you/)
})

/* ---------- broker role ---------- */

const carrierRule: Rule = { opening_offer: 1400, target_rate: 1500, min_rate: 1450, max_rate: 1700, max_rounds: 3, step_percent: 4, accept_message: 'Deal.', counter_message: 'Lowest I can go.', reject_message: 'No deal.' }
const request: RequestRow = { id: 'rq1', shipper_id: 'sh1', origin_city: 'Indianapolis', origin_state: 'IN', dest_city: 'Twinsburg', dest_state: 'OH', pickup_date: '2026-10-15', equipment: 'Van', weight_lbs: 41000, commodity: 'Auto parts', offered_rate: 1500, notes: '' }
const brokerScenario: ScenarioRow = { ...scenario(), role: 'broker', shipper_id: 'sh1', load_ids: [] }

test('a broker practice picks a shipper request and shows it', () => {
  const events = [act('start'), act('select_load', { loadId: 'rq1' })]
  const st = buildState({ attemptId: 'abc123', assignmentId: 'as1', startedAt: new Date(T0).toISOString(), nowMs: T0, scenario: brokerScenario, rule: carrierRule, docs, events, requests: [request] })
  assert.equal(st.role, 'broker')
  assert.equal(st.stage, 'crew')
  assert.equal(st.request?.origin, 'Indianapolis, IN')
  assert.equal(st.request?.offeredRate, 1500)
  assert.equal(st.request?.carrierRate, 1320)
  assert.equal(carrierRateFor(request), 1320)
})

test('broker scoring rewards a good selling price and a healthy margin', () => {
  const run = (rate: number, bids: number) => {
    const events = [
      act('start'), act('select_load', { loadId: 'rq1' }), act('select_crew', { truckId: 't1', driverId: 'd1' }),
      ...Array.from({ length: bids }, (_, i) => ev('bid', { round: i + 1, ask: rate, status: i === bids - 1 ? 'accepted' : 'counter', counter: 1248, message: '' })),
      ...(bids === 0 ? [act('accept', { rate })] : []),
      act('book', { rate, reference: 'RC-ABC123' }),
      act('status', { status: 'delivered' }),
      ev('document', { docId: 'rc', values: { 'Carrier name': 'X', 'Load number': 'RC-ABC123', 'Agreed rate': '1320', 'Pickup date': '2026-10-15', 'Delivery date': 'anything' } }),
      ev('document', { docId: 'bol', values: { Shipper: 'A', Consignee: 'B', Commodity: 'Auto parts', Weight: '41000', Pieces: '10', Signature: 'x' } }),
      ev('document', { docId: 'pod', values: { 'Delivery date': 'any', 'Receiver name': 'x', Condition: 'good', Signature: 'x' } }),
    ]
    const st = buildState({ attemptId: 'abc123', assignmentId: 'as1', startedAt: new Date(T0).toISOString(), nowMs: T0 + 5 * 60000, scenario: brokerScenario, rule: carrierRule, docs, events, requests: [request] })
    return scoreAttempt({ state: st, events, load: requestAsLoad(request), truck: truckHere, driver: james, rule: carrierRule, insight: null, settings, criteria, scenarioEvents: [], carrierRate: 1320 })
  }
  const good = run(1650, 2)
  const bad = run(1320, 0)
  assert.ok(good.autoScore > bad.autoScore)
  assert.ok(bad.mistakes.some(m => m.includes('first offer')))
  assert.ok(bad.mistakes.some(m => m.includes('no margin')))
  assert.ok(!good.mistakes.some(m => m.includes('Document') || m.includes('check ')))
})

test('the carrier answers the broker', () => {
  assert.match(carrierReply('confirm_rate', '', { agreedRate: 1200, status: null }), /\$1,200/)
  assert.match(carrierReply(null, 'we have a delay', { agreedRate: null, status: null }), /arrival time/)
})
