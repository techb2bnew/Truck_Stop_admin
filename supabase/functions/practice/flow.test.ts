// End-to-end run of the practice handler against an in-memory stand-in for the database.
// Run: node --test supabase/functions/practice/flow.test.ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handle } from './index.ts'

type Row = Record<string, any>

/** The few query-builder calls the handler uses, over plain arrays. */
function fakeDb(tables: Record<string, Row[]>) {
  let seq = 0
  let clock = Date.now()
  const nextId = () => `id-${++seq}`
  const builder = (name: string) => {
    let op: 'select' | 'insert' | 'update' = 'select'
    let payload: Row = {}
    const filters: ((r: Row) => boolean)[] = []
    let orderBy: string | null = null
    let wantSingle: 'single' | 'maybe' | null = null
    let returning = false
    const run = () => {
      const rows = tables[name]
      if (op === 'insert') {
        const row = { id: nextId(), created_at: new Date(clock++).toISOString(), submitted_at: new Date(clock).toISOString(), ...payload }
        rows.push(row)
        return { data: returning ? (wantSingle ? row : [row]) : null, error: null }
      }
      let hit = rows.filter(r => filters.every(f => f(r)))
      if (op === 'update') {
        hit.forEach(r => Object.assign(r, payload))
        return { data: null, error: null }
      }
      if (orderBy) hit = [...hit].sort((a, b) => String(a[orderBy!]).localeCompare(String(b[orderBy!])))
      if (wantSingle) return { data: hit[0] ?? null, error: null }
      return { data: hit, error: null }
    }
    const api: any = {
      select: () => { returning = true; return api },
      insert: (p: Row) => { op = 'insert'; payload = p; returning = false; return api },
      update: (p: Row) => { op = 'update'; payload = p; return api },
      eq: (c: string, v: unknown) => { filters.push(r => r[c] === v); return api },
      in: (c: string, v: unknown[]) => { filters.push(r => v.includes(r[c])); return api },
      order: (c: string) => { orderBy = c; return api },
      maybeSingle: () => { wantSingle = 'maybe'; return api },
      single: () => { wantSingle = 'single'; return api },
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(run()).then(res, rej),
    }
    return api
  }
  return { from: builder, tables }
}

const rule = { id: 'rule1', opening_offer: 1750, target_rate: 1850, min_rate: 1800, max_rate: 2000, max_rounds: 3, step_percent: 4, accept_message: 'ok', counter_message: 'counter', reject_message: 'no' }
const docs = [
  { id: 'rc', name: 'Rate Confirmation', type: 'rate_confirmation', fields: ['Carrier name', 'Load number', 'Agreed rate', 'Pickup date', 'Delivery date'] },
  { id: 'bol', name: 'Bill of Lading', type: 'bol', fields: ['Shipper', 'Commodity', 'Weight'] },
  { id: 'pod', name: 'Proof of Delivery', type: 'pod', fields: ['Delivery date', 'Receiver name'] },
]
const criteriaDispatcher = [{ key: 'rate', label: 'Rate', weight: 40 }, { key: 'equipment', label: 'Crew', weight: 20 }, { key: 'deadhead', label: 'Profit', weight: 20 }, { key: 'documents', label: 'Docs', weight: 20 }]
const criteriaBroker = [{ key: 'margin', label: 'Margin', weight: 40 }, { key: 'carrier', label: 'Carrier', weight: 20 }, { key: 'negotiation', label: 'Negotiation', weight: 20 }, { key: 'documents', label: 'Docs', weight: 20 }]

const baseTables = (role: 'dispatcher' | 'broker'): Record<string, Row[]> => ({
  assignments: [{ id: 'as1', scenario_id: 'sc1', student_id: 'stu', status: 'assigned', attempts_used: 0 }],
  scenarios: [{ id: 'sc1', role, status: 'published', title: 'T', load_ids: ['ld1'], truck_ids: ['tr1'], driver_ids: ['dr1'], document_ids: ['rc', 'bol', 'pod'], shipper_id: 'sh1', events: [], time_limit_min: 30, max_attempts: 3, negotiation_rule_id: 'rule1', scoring_profile_id: 'sp1' }],
  negotiation_rules: [rule],
  scoring_profiles: [{ id: 'sp1', criteria: role === 'broker' ? criteriaBroker : criteriaDispatcher }],
  document_templates: docs,
  attempts: [], attempt_events: [],
  loads: [{ id: 'ld1', origin_city: 'Indianapolis', dest_city: 'Twinsburg', pickup_date: '2026-10-15', delivery_date: '2026-10-16', equipment: 'Van', weight_lbs: 41000, length_ft: 53, commodity: 'Auto parts', loaded_miles: 330, deadhead_miles: 25, posted_rate: null }],
  rate_insights: [{ load_id: 'ld1', low: 1700, booked: 1850, high: 2100 }],
  trucks: [{ id: 'tr1', unit_number: 'TS-1', equipment: 'Van', capacity_lbs: 45000, length_ft: 53, location_city: 'Indianapolis', status: 'available' }],
  drivers: [{ id: 'dr1', name: 'James', availability: 'available', truck_id: 'tr1', pay_per_mile: 0.6 }],
  app_settings: [{ id: 1, fuel_cost_per_mile: 0.55, driver_pay_per_mile: 0.62, deadhead_rate_per_mile: 0.4 }],
  shipper_requests: [{ id: 'rq1', shipper_id: 'sh1', origin_city: 'Columbus', origin_state: 'OH', dest_city: 'Newark', dest_state: 'NJ', pickup_date: '2026-10-15', equipment: 'Van', weight_lbs: 38000, commodity: 'Frozen foods', offered_rate: 1850, notes: '' }],
})

async function playThrough(role: 'dispatcher' | 'broker') {
  const db = fakeDb(baseTables(role))
  const call = (body: Record<string, unknown>) => handle(db, 'stu', body) as Promise<any>
  let r = await call({ action: 'state', assignmentId: 'as1' })
  assert.equal(r.state, null)
  r = await call({ action: 'start', assignmentId: 'as1' })
  const attemptId = r.state.attemptId
  assert.equal(r.state.role, role)
  assert.equal(r.state.stage, 'pick_load')
  assert.equal(db.tables.assignments[0].status, 'in_progress')
  assert.equal(db.tables.assignments[0].attempts_used, 1)

  // starting again resumes the same attempt
  r = await call({ action: 'start', assignmentId: 'as1' })
  assert.equal(r.state.attemptId, attemptId)
  assert.equal(db.tables.attempts.length, 1)

  const pick = role === 'broker' ? 'rq1' : 'ld1'
  await assert.rejects(call({ action: 'select_load', attemptId, loadId: 'nope' }), /not on/)
  r = await call({ action: 'select_load', attemptId, loadId: pick })
  assert.equal(r.state.stage, 'crew')
  if (role === 'broker') assert.equal(r.state.request.carrierRate, Math.round(1850 * 0.88))

  await assert.rejects(call({ action: 'negotiate', attemptId, ask: 1900 }), /cannot make another offer/)
  r = await call({ action: 'select_crew', attemptId, truckId: 'tr1', driverId: 'dr1' })
  assert.equal(r.state.stage, 'negotiate')

  r = await call({ action: 'negotiate', attemptId, ask: 2000 }) // above the round-1 ceiling (1924): a counter
  assert.equal(r.state.negotiation.bids[0].status, 'counter')
  const counter = r.state.negotiation.lastCounter
  r = await call({ action: 'accept', attemptId, from: 'counter' })
  assert.equal(r.state.negotiation.agreedRate, counter)
  assert.equal(r.state.stage, 'book')

  r = await call({ action: 'book', attemptId })
  assert.equal(r.state.stage, 'dispatch')
  const reference = r.state.booking.reference

  r = await call({ action: 'send_message', attemptId, text: 'Can you confirm the rate?', quick: 'confirm_rate' })
  assert.equal(r.state.messages.length, 2)
  assert.match(r.state.messages[1].text, /\$/)

  const rcRate = role === 'broker' ? String(Math.round(1850 * 0.88)) : String(counter)
  await assert.rejects(call({ action: 'submit_document', attemptId, docId: 'bol', values: {} }), /not ready|Fill in/)
  r = await call({ action: 'submit_document', attemptId, docId: 'rc', values: { 'Carrier name': 'X', 'Load number': reference, 'Agreed rate': rcRate, 'Pickup date': '2026-10-15', 'Delivery date': '2026-10-16' } })
  r = await call({ action: 'set_status', attemptId, status: 'picked_up' })
  r = await call({ action: 'submit_document', attemptId, docId: 'bol', values: { Shipper: 'S', Commodity: role === 'broker' ? 'Frozen foods' : 'Auto parts', Weight: role === 'broker' ? '38000' : '41000' } })
  await assert.rejects(call({ action: 'submit', attemptId }), /Not ready/)
  r = await call({ action: 'set_status', attemptId, status: 'in_transit' })
  r = await call({ action: 'set_status', attemptId, status: 'delivered' })
  r = await call({ action: 'submit_document', attemptId, docId: 'pod', values: { 'Delivery date': '2026-10-16', 'Receiver name': 'Sam' } })
  assert.equal(r.state.canSubmit, true)

  r = await call({ action: 'submit', attemptId })
  assert.equal(r.submitted, true)
  const attempt = db.tables.attempts[0]
  assert.equal(attempt.status, 'pending_review')
  assert.equal(attempt.auto_score, r.autoScore)
  assert.ok(r.autoScore > 40, `score ${r.autoScore}`)
  assert.equal(db.tables.assignments[0].status, 'submitted')
  await assert.rejects(call({ action: 'set_status', attemptId, status: 'picked_up' }), /already submitted/)
  return attempt
}

test('a dispatcher practice runs from start to submit', async () => {
  const attempt = await playThrough('dispatcher')
  assert.deepEqual(attempt.breakdown.map((b: Row) => b.key), ['rate', 'equipment', 'deadhead', 'documents'])
})

test('a freight broker practice runs from start to submit', async () => {
  const attempt = await playThrough('broker')
  assert.deepEqual(attempt.breakdown.map((b: Row) => b.key), ['margin', 'carrier', 'negotiation', 'documents'])
  assert.ok(attempt.breakdown.find((b: Row) => b.key === 'margin').score > 0)
})

test('a finished or unpublished practice cannot be started, and attempts run out', async () => {
  const t = baseTables('dispatcher')
  t.scenarios[0].status = 'draft'
  await assert.rejects(handle(fakeDb(t), 'stu', { action: 'start', assignmentId: 'as1' }), /not available/)
  const t2 = baseTables('dispatcher')
  t2.assignments[0].attempts_used = 3
  await assert.rejects(handle(fakeDb(t2), 'stu', { action: 'start', assignmentId: 'as1' }), /used all your attempts/)
  const t3 = baseTables('dispatcher')
  await assert.rejects(handle(fakeDb(t3), 'someone-else', { action: 'start', assignmentId: 'as1' }), /not found/)
})
