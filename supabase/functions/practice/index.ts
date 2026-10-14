// Edge Function: practice
// The practice engine for the dispatcher and freight broker roles. Every step a student takes in a practice goes through here, so the rules
// (what the broker answers, whether a step is allowed, how the work is scored) are decided on the server
// and cannot be faked from the phone. Students can read their attempts, but only this function writes them.
//
// Deploy: Supabase > Edge Functions > Deploy a new function (name it exactly: practice), paste this file.
// Run supabase/practice-flow.sql first.
//
// Body: { action, ... }
//   state          { assignmentId }                       the practice in progress, or null
//   start          { assignmentId }                       begin (or resume) an attempt
//   select_load    { attemptId, loadId }
//   select_crew    { attemptId, truckId, driverId }
//   negotiate      { attemptId, ask }                     the student's counter-offer
//   accept         { attemptId, from: 'opening' | 'counter' }
//   book           { attemptId }
//   set_status     { attemptId, status }                  picked_up | in_transit | delayed | delivered
//   send_message   { attemptId, text, quick? }
//   resolve_issue  { attemptId, issueId, optionId }
//   submit_document{ attemptId, docId, values }
//   submit         { attemptId }                          score it and hand it to the trainer
//
// The pure logic comes first (and is exported so it can be tested without a database).
// The server part is at the bottom and only starts when it runs inside Supabase.

/* ------------------------------------------------------------------ types */

export interface Rule {
  opening_offer: number
  target_rate: number
  min_rate: number
  max_rate: number
  max_rounds: number
  step_percent: number
  accept_message: string
  counter_message: string
  reject_message: string
}

export interface LoadRow {
  id: string
  origin_city: string
  dest_city: string
  pickup_date: string | null
  delivery_date: string | null
  equipment: string
  weight_lbs: number
  length_ft: number
  commodity: string
  loaded_miles: number
  deadhead_miles: number
  posted_rate: number | null
}

export interface TruckRow {
  id: string
  unit_number: string
  equipment: string
  capacity_lbs: number
  length_ft: number
  location_city: string
  status: string
}

export interface DriverRow {
  id: string
  name: string
  availability: string
  truck_id: string | null
  pay_per_mile: number
}

export interface RequestRow {
  id: string
  shipper_id: string
  origin_city: string
  origin_state: string
  dest_city: string
  dest_state: string
  pickup_date: string | null
  equipment: string
  weight_lbs: number
  commodity: string
  offered_rate: number
  notes: string
}

export interface RequestView {
  id: string
  /** What the carrier is paid: a fixed share of what the shipper first offered. */
  carrierRate: number
  origin: string
  dest: string
  pickupDate: string | null
  equipment: string
  weightLbs: number
  commodity: string
  offeredRate: number
  notes: string
}

export interface DocRow {
  id: string
  name: string
  type: string
  fields: string[]
}

export interface ScenarioEvent {
  id: string
  atMinute: number
  type: string
  description: string
}

export interface ScenarioRow {
  id: string
  role: string
  shipper_id?: string | null
  load_ids: string[]
  truck_ids: string[]
  driver_ids: string[]
  document_ids: string[]
  events: ScenarioEvent[]
  time_limit_min: number
  max_attempts: number
  negotiation_rule_id: string | null
  scoring_profile_id: string | null
}

export interface Settings {
  fuel_cost_per_mile: number
  driver_pay_per_mile: number
  deadhead_rate_per_mile: number
}

export interface EventRow {
  type: 'action' | 'message' | 'document' | 'bid' | 'rate_feedback'
  payload: Record<string, unknown>
  created_at: string
}

export type DispatchStatus = 'assigned' | 'picked_up' | 'in_transit' | 'delayed' | 'delivered'
export type Stage = 'pick_load' | 'crew' | 'negotiate' | 'book' | 'dispatch' | 'ready_to_submit'

export interface Bid {
  round: number
  ask: number
  status: 'accepted' | 'counter' | 'rejected'
  counter: number | null
  message: string
}

export interface IssueView {
  id: string
  type: string
  description: string
  atMinute: number
  resolved: boolean
  options: { id: string; label: string }[]
}

export interface DocumentView {
  id: string
  name: string
  type: string
  fields: string[]
  available: boolean
  submitted: boolean
  values: Record<string, string>
}

export interface PracticeState {
  role: 'dispatcher' | 'broker'
  /** Broker practice only: the shipper request that was picked (its id is also `loadId`). */
  request: RequestView | null
  attemptId: string
  assignmentId: string
  startedAt: string
  elapsedMin: number
  timeLimitMin: number
  stage: Stage
  loadId: string | null
  truckId: string | null
  driverId: string | null
  negotiation: {
    openingOffer: number
    maxRounds: number
    bids: Bid[]
    agreedRate: number | null
    lastCounter: number | null
    ended: boolean
    canAcceptOpening: boolean
    canAcceptCounter: boolean
    canCounter: boolean
  }
  booking: { rate: number; reference: string } | null
  dispatchStatus: DispatchStatus | null
  statusLog: { status: DispatchStatus; at: string }[]
  documents: DocumentView[]
  issues: IssueView[]
  messages: { from: 'student' | 'broker'; text: string; at: string }[]
  missingToSubmit: string[]
  canSubmit: boolean
}

/** A shipper request seen as a load, so the paperwork and scoring code can treat both roles alike. */
export const requestAsLoad = (r: RequestRow): LoadRow => ({
  id: r.id,
  origin_city: r.origin_city,
  dest_city: r.dest_city,
  pickup_date: r.pickup_date,
  delivery_date: null,
  equipment: r.equipment,
  weight_lbs: r.weight_lbs,
  length_ft: 53,
  commodity: r.commodity,
  loaded_miles: 0,
  deadhead_miles: 0,
  posted_rate: r.offered_rate,
})

/** The carrier takes this share of the shipper's first offer; the broker's margin is what is left of the agreed price. */
export const CARRIER_SHARE = 0.88
export const carrierRateFor = (r: Pick<RequestRow, 'offered_rate'>): number => Math.round(Number(r.offered_rate) * CARRIER_SHARE)

const requestView = (r: RequestRow): RequestView => ({
  id: r.id,
  carrierRate: carrierRateFor(r),
  origin: `${r.origin_city}, ${r.origin_state}`,
  dest: `${r.dest_city}, ${r.dest_state}`,
  pickupDate: r.pickup_date,
  equipment: r.equipment,
  weightLbs: num(r.weight_lbs),
  commodity: r.commodity,
  offeredRate: num(r.offered_rate),
  notes: r.notes,
})

export class UserError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

/* ------------------------------------------------------------------ negotiation */

const num = (v: unknown): number => Number(v)

/** What the broker will pay at most in this round: it creeps up from the target by `step_percent` a round. */
export function ceilingFor(rule: Rule, round: number): number {
  return Math.min(num(rule.max_rate), Math.round(num(rule.target_rate) * (1 + (num(rule.step_percent) / 100) * round)))
}

export interface Reply {
  status: 'accepted' | 'counter' | 'rejected'
  counter: number | null
  message: string
  ended: boolean
}

/** The broker's answer to the student's ask in this round (rounds start at 1). */
export function respond(rule: Rule, ask: number, round: number): Reply {
  if (ask <= num(rule.target_rate)) return { status: 'accepted', counter: null, message: rule.accept_message, ended: true }
  const ceiling = ceilingFor(rule, round)
  if (ask <= ceiling) return { status: 'accepted', counter: null, message: rule.accept_message, ended: true }
  // Out of rounds: the broker walks away, but leaves its last number on the table.
  if (round >= num(rule.max_rounds)) return { status: 'rejected', counter: ceiling, message: rule.reject_message, ended: true }
  return { status: 'counter', counter: ceiling, message: rule.counter_message, ended: false }
}

/* ------------------------------------------------------------------ dispatch status */

const MAIN_ORDER: DispatchStatus[] = ['assigned', 'picked_up', 'in_transit', 'delivered']

/** Which statuses a load may move to next. "Delayed" can be set at any point before delivery and resumed after. */
export function allowedNextStatuses(log: { status: DispatchStatus }[]): DispatchStatus[] {
  if (log.length === 0) return []
  const current = log[log.length - 1].status
  if (current === 'delivered') return []
  const lastMain = [...log].reverse().find(entry => entry.status !== 'delayed')?.status ?? 'assigned'
  const index = MAIN_ORDER.indexOf(lastMain)
  const forward = MAIN_ORDER.slice(index + 1)
  // After a delay the load resumes at the very next step, it cannot skip ahead.
  if (current === 'delayed') return forward.slice(0, 1)
  return [...forward.slice(0, 1), 'delayed']
}

/* ------------------------------------------------------------------ issues */

interface IssueOption {
  id: string
  label: string
  correct?: boolean
}

// The best answer is marked here on the server and never sent to the phone.
const ISSUE_OPTIONS: Record<string, IssueOption[]> = {
  pickup_delay: [
    { id: 'wait', label: 'Wait quietly and hope the dock is ready soon' },
    { id: 'notify', label: 'Tell the broker about the delay and agree a new pickup time', correct: true },
    { id: 'cancel', label: 'Cancel the load' },
  ],
  driver_unavailable: [
    { id: 'replace', label: 'Assign another available driver and tell the broker', correct: true },
    { id: 'wait', label: 'Wait until the driver is free again' },
    { id: 'cancel', label: 'Tell the broker the load is cancelled' },
  ],
  rate_dispute: [
    { id: 'accept', label: 'Accept the lower rate to keep the peace' },
    { id: 'refuse', label: 'Refuse to deliver the load' },
    { id: 'show', label: 'Send the signed rate confirmation and ask the broker to honour it', correct: true },
  ],
  breakdown: [
    { id: 'drive', label: 'Tell the driver to keep going' },
    { id: 'replace', label: 'Call the broker, send another truck and driver, and mark the load Delayed', correct: true },
    { id: 'nothing', label: 'Do nothing until the truck is repaired' },
  ],
  carrier_cancel: [
    { id: 'replace', label: 'Find another carrier right away and keep everyone informed', correct: true },
    { id: 'wait', label: 'Wait and see if the carrier changes its mind' },
    { id: 'drop', label: 'Drop the load' },
  ],
}

const FALLBACK_OPTIONS: IssueOption[] = [
  { id: 'handle', label: 'Deal with it calmly and keep the broker informed', correct: true },
  { id: 'ignore', label: 'Ignore it and carry on' },
]

// The same problems seen from the broker's chair.
const BROKER_ISSUE_OPTIONS: Record<string, IssueOption[]> = {
  pickup_delay: [
    { id: 'wait', label: 'Say nothing and hope the carrier arrives soon' },
    { id: 'notify', label: 'Tell the shipper about the delay and agree a new pickup time with the carrier', correct: true },
    { id: 'cancel', label: 'Cancel the carrier straight away' },
  ],
  driver_unavailable: [
    { id: 'replace', label: 'Ask the carrier for another driver and update the shipper', correct: true },
    { id: 'wait', label: 'Wait until the driver is free again' },
    { id: 'cancel', label: 'Tell the shipper the load is cancelled' },
  ],
  rate_dispute: [
    { id: 'accept', label: 'Pay the higher rate the carrier now wants' },
    { id: 'refuse', label: 'Refuse to pay the carrier at all' },
    { id: 'show', label: 'Send the signed rate confirmation and ask the carrier to honour it', correct: true },
  ],
  breakdown: [
    { id: 'drive', label: 'Tell the carrier to keep going' },
    { id: 'replace', label: 'Ask the carrier for a replacement truck, tell the shipper, and mark the load Delayed', correct: true },
    { id: 'nothing', label: 'Do nothing until the truck is repaired' },
  ],
  carrier_cancel: [
    { id: 'replace', label: 'Find another carrier right away and keep the shipper informed', correct: true },
    { id: 'wait', label: 'Wait and see if the carrier changes its mind' },
    { id: 'drop', label: 'Drop the load' },
  ],
}

const optionsFor = (type: string, role = 'dispatcher'): IssueOption[] =>
  (role === 'broker' ? BROKER_ISSUE_OPTIONS[type] : ISSUE_OPTIONS[type]) ?? FALLBACK_OPTIONS

export const issueAnswerIsCorrect = (type: string, optionId: string, role = 'dispatcher'): boolean | null => {
  const option = optionsFor(type, role).find(o => o.id === optionId)
  return option ? Boolean(option.correct) : null
}

/* ------------------------------------------------------------------ broker chat */

export function brokerReply(quick: string | null, text: string, state: { agreedRate: number | null; status: DispatchStatus | null }): string {
  const rate = state.agreedRate != null ? `$${Math.round(state.agreedRate).toLocaleString('en-US')}` : null
  switch (quick) {
    case 'pickup_time':
      return 'Pickup is between 8 AM and 12 PM. Have the driver check in at the dock office.'
    case 'confirm_rate':
      return rate ? `We agreed ${rate}. The rate confirmation is on its way. Sign it and send it back.` : 'We have not agreed a rate yet. Let us settle the price first.'
    case 'delay_notice':
      return 'Thanks for telling me early. I will inform the shipper and note the new time.'
    case 'detention':
      return 'Detention starts after 2 hours at the dock. Send me the arrival and departure times.'
    case 'eta':
      return state.status ? `Thanks. I have the load marked as ${state.status.replace('_', ' ')}. Keep me posted.` : 'Let me know once the driver is rolling.'
    default:
      return /delay|late|breakdown|broke/i.test(text)
        ? 'Thanks for telling me. I will inform the shipper and note the new time.'
        : 'Got it. I will look into it and get back to you.'
  }
}

/** What the carrier answers the broker. */
export function carrierReply(quick: string | null, text: string, state: { agreedRate: number | null; status: DispatchStatus | null }): string {
  const rate = state.agreedRate != null ? `$${Math.round(state.agreedRate).toLocaleString('en-US')}` : null
  switch (quick) {
    case 'confirm_rate':
      return rate ? `Yes, we agreed ${rate}. Send the rate confirmation and I will sign it.` : 'We have not agreed a rate yet. Let us settle the price first.'
    case 'pickup_time':
      return 'We can be at the dock between 8 AM and 12 PM. Please send the shipper contact.'
    case 'check_call':
      return state.status ? `The load is ${state.status.replace('_', ' ')}. The driver will call again at the next stop.` : 'The truck is getting ready. I will call you when it rolls.'
    case 'insurance':
      return 'I will email our insurance certificate and authority papers now.'
    case 'delay_notice':
      return 'Thanks for letting me know early. I will give you a new arrival time shortly.'
    default:
      return /delay|late|breakdown|broke/i.test(text) ? 'Understood. I will send you a new arrival time as soon as I have one.' : 'Noted. I will get back to you shortly.'
  }
}

/** True when the student told the broker about a delay, with the quick button or in their own words. */
export const toldBrokerAboutDelay = (messages: { from: string; text: string }[], quickKinds: string[]): boolean =>
  quickKinds.includes('delay_notice') || messages.some(m => m.from === 'student' && /delay|late|breakdown|broke|behind/i.test(m.text))

/* ------------------------------------------------------------------ documents */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** Accepts 2026-10-15, Oct 15, 2026 and 10/15/2026 for the date 2026-10-15. */
export function sameDate(input: string, iso: string | null): boolean {
  if (!iso) return false
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const text = input.trim().toLowerCase()
  if (!text) return false
  const dashed = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (dashed) return Number(dashed[1]) === y && Number(dashed[2]) === m && Number(dashed[3]) === d
  const slashed = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashed) return Number(slashed[1]) === m && Number(slashed[2]) === d && Number(slashed[3]) === y
  const worded = text.match(/^([a-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/)
  if (worded) return MONTHS.indexOf(worded[1].slice(0, 3)) + 1 === m && Number(worded[2]) === d && Number(worded[3]) === y
  return false
}

const digits = (value: string): number => Number(value.replace(/[^0-9.]/g, ''))

export interface DocContext {
  agreedRate: number | null
  reference: string | null
  load: LoadRow
}

/** Is this value right for this field? Fields that are only free text just have to be filled in. */
export function fieldIsCorrect(field: string, value: string, ctx: DocContext): boolean {
  const v = (value ?? '').trim()
  if (!v) return false
  const f = field.toLowerCase()
  if (f.includes('rate')) return ctx.agreedRate != null && Math.abs(digits(v) - ctx.agreedRate) < 0.5
  if (f.includes('load number') || f.includes('reference')) return ctx.reference != null && v.toLowerCase() === ctx.reference.toLowerCase()
  if (f.includes('pickup date')) return sameDate(v, ctx.load.pickup_date)
  if (f.includes('delivery date')) return ctx.load.delivery_date ? sameDate(v, ctx.load.delivery_date) : true
  if (f.includes('commodity')) return v.toLowerCase().includes(ctx.load.commodity.toLowerCase()) || ctx.load.commodity.toLowerCase().includes(v.toLowerCase())
  if (f.includes('weight')) return digits(v) === num(ctx.load.weight_lbs)
  return true
}

/* ------------------------------------------------------------------ state */

export interface StateInput {
  attemptId: string
  assignmentId: string
  startedAt: string
  nowMs: number
  scenario: ScenarioRow
  rule: Rule
  docs: DocRow[]
  events: EventRow[]
  /** Broker practice: the shipper requests this practice offers. */
  requests?: RequestRow[]
}

const reachedPickup = (log: { status: DispatchStatus }[]) => log.some(e => e.status === 'picked_up' || e.status === 'in_transit' || e.status === 'delivered')

/** Builds everything the phone needs to draw the practice from the list of things the student has done. */
export function buildState(input: StateInput): PracticeState {
  const { scenario, rule, docs, events } = input
  let loadId: string | null = null
  let truckId: string | null = null
  let driverId: string | null = null
  const bids: Bid[] = []
  let agreedRate: number | null = null
  let lastCounter: number | null = null
  let ended = false
  let booking: PracticeState['booking'] = null
  const statusLog: PracticeState['statusLog'] = []
  const documentValues: Record<string, Record<string, string>> = {}
  const resolved = new Set<string>()
  const messages: PracticeState['messages'] = []

  for (const event of events) {
    const p = event.payload
    if (event.type === 'action') {
      switch (p.kind) {
        case 'select_load':
          loadId = String(p.loadId)
          truckId = null
          driverId = null
          break
        case 'select_crew':
          truckId = String(p.truckId)
          driverId = String(p.driverId)
          break
        case 'accept':
          agreedRate = num(p.rate)
          ended = true
          break
        case 'book':
          booking = { rate: num(p.rate), reference: String(p.reference) }
          statusLog.push({ status: 'assigned', at: event.created_at })
          break
        case 'status':
          statusLog.push({ status: p.status as DispatchStatus, at: event.created_at })
          break
        case 'issue_resolved':
          resolved.add(String(p.issueId))
          break
      }
    } else if (event.type === 'bid') {
      const bid: Bid = { round: num(p.round), ask: num(p.ask), status: p.status as Bid['status'], counter: p.counter == null ? null : num(p.counter), message: String(p.message ?? '') }
      bids.push(bid)
      if (bid.status === 'accepted') {
        agreedRate = bid.ask
        ended = true
      } else {
        lastCounter = bid.counter
        if (bid.status === 'rejected') ended = true
      }
    } else if (event.type === 'message') {
      messages.push({ from: p.from === 'broker' ? 'broker' : 'student', text: String(p.text ?? ''), at: event.created_at })
    } else if (event.type === 'document') {
      documentValues[String(p.docId)] = (p.values ?? {}) as Record<string, string>
    }
  }

  const elapsedMin = Math.max(0, Math.floor((input.nowMs - new Date(input.startedAt).getTime()) / 60000))
  const maxRounds = num(rule.max_rounds)
  const dispatchStatus = statusLog.length ? statusLog[statusLog.length - 1].status : null

  const documentViews: DocumentView[] = scenario.document_ids
    .map(id => docs.find(d => d.id === id))
    .filter((d): d is DocRow => Boolean(d))
    .map(doc => {
      const available =
        !booking ? false : doc.type === 'bol' ? reachedPickup(statusLog) : doc.type === 'pod' ? dispatchStatus === 'delivered' : true
      return { id: doc.id, name: doc.name, type: doc.type, fields: doc.fields, available, submitted: Boolean(documentValues[doc.id]), values: documentValues[doc.id] ?? {} }
    })

  // An issue shows up once the load is booked and its minute has come.
  const issues: IssueView[] = booking
    ? scenario.events
        .filter(e => elapsedMin >= num(e.atMinute))
        .map(e => ({
          id: e.id,
          type: e.type,
          description: e.description,
          atMinute: num(e.atMinute),
          resolved: resolved.has(e.id),
          options: optionsFor(e.type, scenario.role).map(({ id, label }) => ({ id, label })),
        }))
    : []

  const stage: Stage = !loadId ? 'pick_load' : !truckId || !driverId ? 'crew' : agreedRate == null ? 'negotiate' : !booking ? 'book' : 'dispatch'

  const missing: string[] = []
  if (stage === 'dispatch') {
    if (dispatchStatus !== 'delivered') missing.push('Deliver the load')
    for (const doc of documentViews) if (!doc.submitted) missing.push(`Submit ${doc.name}`)
    for (const issue of issues) if (!issue.resolved) missing.push('Handle the issue that came up')
  }
  const canSubmit = stage === 'dispatch' && missing.length === 0

  const picked = loadId ? (input.requests ?? []).find(r => r.id === loadId) : undefined

  return {
    role: scenario.role === 'broker' ? 'broker' : 'dispatcher',
    request: picked ? requestView(picked) : null,
    attemptId: input.attemptId,
    assignmentId: input.assignmentId,
    startedAt: input.startedAt,
    elapsedMin,
    timeLimitMin: num(scenario.time_limit_min),
    stage: canSubmit ? 'ready_to_submit' : stage,
    loadId,
    truckId,
    driverId,
    negotiation: {
      openingOffer: num(rule.opening_offer),
      maxRounds,
      bids,
      agreedRate,
      lastCounter,
      ended,
      canAcceptOpening: stage === 'negotiate' && bids.length === 0,
      canAcceptCounter: stage === 'negotiate' && lastCounter != null,
      canCounter: stage === 'negotiate' && !ended && bids.length < maxRounds,
    },
    booking,
    dispatchStatus,
    statusLog,
    documents: documentViews,
    issues,
    messages,
    missingToSubmit: missing,
    canSubmit,
  }
}

/* ------------------------------------------------------------------ scoring */

export interface ScoreInput {
  state: PracticeState
  events: EventRow[]
  load: LoadRow
  truck: TruckRow
  driver: DriverRow
  rule: Rule
  insight: { low: number; booked: number; high: number } | null
  settings: Settings
  criteria: { key: string; label: string; weight: number }[]
  scenarioEvents: ScenarioEvent[]
  /** Broker practice: what the carrier is paid. The broker keeps the rest of the agreed price. */
  carrierRate?: number
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/** Profit of the trip the student set up, with the formulas the trainer put in Settings. */
export function tripProfit(load: LoadRow, truck: TruckRow, driver: DriverRow, rate: number, settings: Settings) {
  const deadhead = truck.location_city.trim().toLowerCase() === load.origin_city.trim().toLowerCase() ? 0 : num(load.deadhead_miles)
  const loaded = num(load.loaded_miles)
  const fuel = (loaded + deadhead) * num(settings.fuel_cost_per_mile)
  const pay = loaded * num(driver.pay_per_mile ?? settings.driver_pay_per_mile)
  const deadheadCost = deadhead * num(settings.deadhead_rate_per_mile)
  const profit = rate - fuel - pay - deadheadCost
  return { deadhead, fuel, pay, deadheadCost, profit, margin: rate > 0 ? profit / rate : 0 }
}

export interface ScoreResult {
  breakdown: { key: string; score: number }[]
  mistakes: string[]
  autoScore: number
}

export function scoreAttempt(input: ScoreInput): ScoreResult {
  const { state, load, truck, driver, rule, insight, settings, criteria } = input
  const isBroker = state.role === 'broker'
  const mistakes: string[] = []
  const agreed = state.booking?.rate ?? state.negotiation.agreedRate ?? 0

  // Rate: where the agreed price sits between the least and the most the other side would pay.
  const span = num(rule.max_rate) - num(rule.min_rate)
  const rateRatio = span > 0 ? clamp01((agreed - num(rule.min_rate)) / span) : agreed >= num(rule.target_rate) ? 1 : 0
  const firstBidAccepted = state.negotiation.bids.length === 0
  if (firstBidAccepted) mistakes.push(isBroker ? 'Accepted the shipper\'s first offer without negotiating' : 'Accepted the broker\'s first offer without negotiating')
  if (!isBroker) {
    if (state.negotiation.bids.some(b => b.status !== 'accepted' && insight && b.ask > num(insight.high))) mistakes.push('Asked for more than the highest rate in the rate insights')
    if (insight && agreed < num(insight.low)) mistakes.push('Agreed a rate below the lowest rate in the rate insights')
  }

  // Equipment: right trailer, enough capacity, truck and driver free, and the driver belongs to that truck.
  const equipmentOk = truck.equipment === load.equipment
  const capacityOk = num(truck.capacity_lbs) >= num(load.weight_lbs) && num(truck.length_ft) >= num(load.length_ft)
  const truckFree = truck.status === 'available'
  const driverFree = driver.availability === 'available'
  const paired = driver.truck_id === truck.id
  const equipmentRatio = (equipmentOk ? 0.4 : 0) + (capacityOk ? 0.2 : 0) + (truckFree ? 0.1 : 0) + (driverFree ? 0.2 : 0) + (paired ? 0.1 : 0)
  if (!equipmentOk) mistakes.push(isBroker ? `Booked a ${truck.equipment} carrier truck for a ${load.equipment} shipment` : `Chose a ${truck.equipment} truck for a ${load.equipment} load`)
  if (!capacityOk) mistakes.push('The truck cannot carry this weight or length')
  if (!truckFree) mistakes.push('Chose a truck that is not available')
  if (!driverFree) mistakes.push(isBroker ? 'Booked a carrier driver who is not available' : 'Chose a driver who is not available')
  if (!paired) mistakes.push('The driver is not the one assigned to that truck')

  // Deadhead and profit, half each. Profit: a trip that keeps 30 percent of the rate or more earns the full half.
  // Deadhead: no empty miles earns the full half, falling to nothing when a fifth of all miles are empty.
  let profitRatio: number
  if (isBroker) {
    // Broker: the margin between the agreed price and the carrier's pay. Fifteen percent or more earns full marks.
    const margin = agreed > 0 ? (agreed - num(input.carrierRate ?? 0)) / agreed : 0
    profitRatio = clamp01(margin / 0.15)
    if (margin <= 0) mistakes.push('The carrier is paid as much as the shipper, so there is no margin')
    else if (margin < 0.08) mistakes.push('The margin is very thin')
  } else {
    const trip = tripProfit(load, truck, driver, agreed, settings)
    const totalMiles = num(load.loaded_miles) + trip.deadhead
    const deadheadShare = totalMiles > 0 ? trip.deadhead / totalMiles : 0
    profitRatio = 0.5 * clamp01(trip.margin / 0.3) + 0.5 * clamp01(1 - deadheadShare / 0.2)
    if (trip.profit < 0) mistakes.push('The trip loses money after fuel, driver pay and deadhead')
    if (trip.deadhead > 0) mistakes.push(`Deadhead miles (${trip.deadhead}) cut into the profit`)
  }

  // Documents: share of fields that are right, over every document of the practice.
  const docCtx: DocContext = { agreedRate: isBroker ? num(input.carrierRate ?? agreed) : agreed, reference: state.booking?.reference ?? null, load }
  let fieldsTotal = 0
  let fieldsRight = 0
  for (const doc of state.documents) {
    if (!doc.submitted) {
      mistakes.push(`${doc.name} was not submitted`)
      fieldsTotal += doc.fields.length
      continue
    }
    const wrong: string[] = []
    for (const field of doc.fields) {
      fieldsTotal += 1
      if (fieldIsCorrect(field, doc.values[field] ?? '', docCtx)) fieldsRight += 1
      else wrong.push(field)
    }
    if (wrong.length) mistakes.push(`${doc.name}: check ${wrong.join(', ')}`)
  }
  const documentsRatio = fieldsTotal > 0 ? fieldsRight / fieldsTotal : 1

  // Time: full marks within the limit, then it falls away.
  const limit = Math.max(1, state.timeLimitMin)
  const over = Math.max(0, state.elapsedMin - limit)
  const timeRatio = clamp01(1 - over / limit)
  if (over > 0) mistakes.push(`Went ${over} minutes over the time limit`)

  // Problems: share of the issues answered the best way, plus telling the broker and marking the load Delayed.
  let problemRatio = 1
  const wrongIssues: string[] = []
  const resolutions = input.events.filter(e => e.type === 'action' && e.payload.kind === 'issue_resolved')
  if (state.issues.length > 0) {
    let good = 0
    for (const issue of state.issues) {
      const hit = resolutions.find(r => r.payload.issueId === issue.id)
      if (hit && hit.payload.correct === true) good += 1
      else wrongIssues.push(issue.type.replace('_', ' '))
    }
    problemRatio = good / state.issues.length
    if (wrongIssues.length) mistakes.push(`Handled badly: ${wrongIssues.join(', ')}`)
    const delayIssue = state.issues.some(i => i.type === 'pickup_delay' || i.type === 'breakdown')
    if (delayIssue) {
      const everDelayed = state.statusLog.some(s => s.status === 'delayed')
      const quickKinds = input.events.filter(e => e.type === 'message' && e.payload.from === 'student' && e.payload.quick).map(e => String(e.payload.quick))
      if (!everDelayed) mistakes.push('Did not mark the load as Delayed')
      if (!toldBrokerAboutDelay(state.messages, quickKinds)) mistakes.push(isBroker ? 'Did not tell the carrier about the delay' : 'Did not tell the broker about the delay')
    }
  }

  const ratios: Record<string, number> = {
    rate: rateRatio,
    equipment: equipmentRatio,
    deadhead: profitRatio,
    carrier: equipmentRatio,
    margin: profitRatio,
    negotiation: rateRatio,
    documents: documentsRatio,
    time: timeRatio,
    problem: problemRatio,
  }

  const breakdown: { key: string; score: number }[] = []
  const unscored: string[] = []
  for (const c of criteria) {
    const ratio = ratios[c.key]
    if (ratio === undefined) {
      breakdown.push({ key: c.key, score: 0 })
      unscored.push(c.label)
    } else {
      breakdown.push({ key: c.key, score: Math.round(num(c.weight) * ratio) })
    }
  }
  if (unscored.length) mistakes.push(`Your trainer will score: ${unscored.join(', ')}`)

  return { breakdown, mistakes, autoScore: breakdown.reduce((sum, b) => sum + b.score, 0) }
}

/* ------------------------------------------------------------------ server */

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// deno-lint-ignore no-explicit-any
type Db = any

async function must<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>, message: string): Promise<T> {
  const { data, error } = await query
  if (error || data == null) throw new UserError(error?.message ?? message, error ? 500 : 404)
  return data
}

async function loadAttempt(db: Db, studentId: string, attemptId: string) {
  const attempt = await must<{ id: string; assignment_id: string; scenario_id: string; status: string; created_at: string }>(
    db.from('attempts').select('id, assignment_id, scenario_id, status, created_at').eq('id', attemptId).eq('student_id', studentId).maybeSingle(),
    'Attempt not found.',
  )
  if (attempt.status !== 'in_progress') throw new UserError('This practice is already submitted.', 409)
  const scenario = await must<ScenarioRow>(db.from('scenarios').select('*').eq('id', attempt.scenario_id).maybeSingle(), 'Scenario not found.')
  if (!scenario.negotiation_rule_id) throw new UserError('This practice has no negotiation rule yet. Tell your trainer.', 409)
  const rule = await must<Rule>(db.from('negotiation_rules').select('*').eq('id', scenario.negotiation_rule_id).maybeSingle(), 'Negotiation rule not found.')
  const docs = (await must<DocRow[]>(db.from('document_templates').select('id, name, type, fields').in('id', scenario.document_ids.length ? scenario.document_ids : ['00000000-0000-0000-0000-000000000000']), 'Documents not found.')) ?? []
  const events = (await must<EventRow[]>(db.from('attempt_events').select('type, payload, created_at').eq('attempt_id', attemptId).order('created_at', { ascending: true }), 'Events not found.')) ?? []
  const requests = scenario.role === 'broker' ? await requestsFor(db, scenario) : []
  return { attempt, scenario, rule, docs, events, requests }
}

/** The shipper requests a broker practice offers: the scenario's shipper's, or all of them when no shipper was set. */
async function requestsFor(db: Db, scenario: ScenarioRow): Promise<RequestRow[]> {
  let query = db.from('shipper_requests').select('*')
  if (scenario.shipper_id) query = query.eq('shipper_id', scenario.shipper_id)
  const { data, error } = await query
  if (error) throw new UserError(error.message, 500)
  return (data ?? []) as RequestRow[]
}

const stateOf = (c: Awaited<ReturnType<typeof loadAttempt>>): PracticeState =>
  buildState({ attemptId: c.attempt.id, assignmentId: c.attempt.assignment_id, startedAt: c.attempt.created_at, nowMs: Date.now(), scenario: c.scenario, rule: c.rule, docs: c.docs, events: c.events, requests: c.requests })

async function record(db: Db, studentId: string, attemptId: string, type: EventRow['type'], payload: Record<string, unknown>) {
  const { error } = await db.from('attempt_events').insert({ attempt_id: attemptId, student_id: studentId, type, payload })
  if (error) throw new UserError(error.message, 500)
}

export async function handle(db: Db, userId: string, body: Record<string, unknown>) {
  const action = String(body.action ?? '')

  // Look up the student's practice (read only) or start one.
  if (action === 'state' || action === 'start') {
    const assignmentId = String(body.assignmentId ?? '')
    const assignment = await must<{ id: string; scenario_id: string; student_id: string; status: string; attempts_used: number }>(
      db.from('assignments').select('id, scenario_id, student_id, status, attempts_used').eq('id', assignmentId).eq('student_id', userId).maybeSingle(),
      'Practice not found.',
    )
    const { data: active } = await db.from('attempts').select('id').eq('assignment_id', assignmentId).eq('student_id', userId).eq('status', 'in_progress').maybeSingle()
    if (active) return { state: stateOf(await loadAttempt(db, userId, active.id)) }
    if (action === 'state') return { state: null }

    const scenario = await must<ScenarioRow & { status: string }>(db.from('scenarios').select('*').eq('id', assignment.scenario_id).maybeSingle(), 'Scenario not found.')
    if (scenario.status !== 'published') throw new UserError('This practice is not available.', 409)
    if (!['assigned', 'in_progress', 'retry'].includes(assignment.status)) throw new UserError('This practice is already finished.', 409)
    if (assignment.attempts_used >= scenario.max_attempts) throw new UserError('You have used all your attempts.', 409)

    const attempt = await must<{ id: string }>(
      db.from('attempts').insert({ assignment_id: assignmentId, student_id: userId, scenario_id: scenario.id, attempt_no: assignment.attempts_used + 1, status: 'in_progress' }).select('id').single(),
      'Could not start.',
    )
    await db.from('assignments').update({ status: 'in_progress', attempts_used: assignment.attempts_used + 1 }).eq('id', assignmentId)
    await record(db, userId, attempt.id, 'action', { kind: 'start' })
    return { state: stateOf(await loadAttempt(db, userId, attempt.id)) }
  }

  const attemptId = String(body.attemptId ?? '')
  const ctx = await loadAttempt(db, userId, attemptId)
  const state = stateOf(ctx)
  const scenario = ctx.scenario

  switch (action) {
    case 'select_load': {
      const loadId = String(body.loadId ?? '')
      if (scenario.role === 'broker') {
        if (!ctx.requests.some(r => r.id === loadId)) throw new UserError('That request is not on your list.')
      } else if (!scenario.load_ids.includes(loadId)) {
        throw new UserError('That load is not on this board.')
      }
      if (state.stage !== 'pick_load' && state.stage !== 'crew') throw new UserError('The load can no longer be changed.', 409)
      await record(db, userId, attemptId, 'action', { kind: 'select_load', loadId })
      break
    }
    case 'select_crew': {
      const truckId = String(body.truckId ?? '')
      const driverId = String(body.driverId ?? '')
      if (!state.loadId) throw new UserError('Choose a load first.', 409)
      if (state.stage !== 'crew') throw new UserError('The truck and driver can no longer be changed.', 409)
      if (!scenario.truck_ids.includes(truckId) || !scenario.driver_ids.includes(driverId)) throw new UserError('That truck or driver is not part of this practice.')
      await record(db, userId, attemptId, 'action', { kind: 'select_crew', truckId, driverId })
      break
    }
    case 'negotiate': {
      const ask = Math.round(Number(body.ask))
      if (!Number.isFinite(ask) || ask <= 0) throw new UserError('Enter the rate you want.')
      if (!state.negotiation.canCounter) throw new UserError('You cannot make another offer now.', 409)
      const round = state.negotiation.bids.length + 1
      const reply = respond(ctx.rule, ask, round)
      await record(db, userId, attemptId, 'bid', { round, ask, status: reply.status, counter: reply.counter, message: reply.message })
      break
    }
    case 'accept': {
      const from = String(body.from ?? '')
      if (from === 'opening') {
        if (!state.negotiation.canAcceptOpening) throw new UserError('The opening offer is no longer on the table.', 409)
        await record(db, userId, attemptId, 'action', { kind: 'accept', from, rate: state.negotiation.openingOffer })
      } else if (from === 'counter') {
        if (!state.negotiation.canAcceptCounter || state.negotiation.lastCounter == null) throw new UserError('There is no counter-offer to accept.', 409)
        await record(db, userId, attemptId, 'action', { kind: 'accept', from, rate: state.negotiation.lastCounter })
      } else {
        throw new UserError('Unknown offer.')
      }
      break
    }
    case 'book': {
      if (state.stage !== 'book' || state.negotiation.agreedRate == null) throw new UserError('Agree a rate with the broker first.', 409)
      const reference = `RC-${attemptId.replace(/-/g, '').slice(0, 6).toUpperCase()}`
      await record(db, userId, attemptId, 'action', { kind: 'book', rate: state.negotiation.agreedRate, reference })
      break
    }
    case 'set_status': {
      const next = String(body.status ?? '') as DispatchStatus
      if (!allowedNextStatuses(state.statusLog).includes(next)) throw new UserError('That status does not come next.', 409)
      await record(db, userId, attemptId, 'action', { kind: 'status', status: next })
      break
    }
    case 'send_message': {
      const text = String(body.text ?? '').trim().slice(0, 500)
      const quick = body.quick ? String(body.quick) : null
      if (!text) throw new UserError('Write a message first.')
      if (!state.booking && !state.loadId) throw new UserError('Pick a load before you call the broker.', 409)
      await record(db, userId, attemptId, 'message', { from: 'student', text, quick })
      await record(db, userId, attemptId, 'message', { from: 'broker', text: (scenario.role === 'broker' ? carrierReply : brokerReply)(quick, text, { agreedRate: state.negotiation.agreedRate, status: state.dispatchStatus }) })
      break
    }
    case 'resolve_issue': {
      const issueId = String(body.issueId ?? '')
      const optionId = String(body.optionId ?? '')
      const issue = state.issues.find(i => i.id === issueId)
      if (!issue) throw new UserError('That issue is not open.', 409)
      if (issue.resolved) throw new UserError('That issue is already handled.', 409)
      const correct = issueAnswerIsCorrect(issue.type, optionId, scenario.role)
      if (correct === null) throw new UserError('Unknown choice.')
      await record(db, userId, attemptId, 'action', { kind: 'issue_resolved', issueId, optionId, correct })
      break
    }
    case 'submit_document': {
      const docId = String(body.docId ?? '')
      const doc = state.documents.find(d => d.id === docId)
      if (!doc) throw new UserError('That document is not part of this practice.')
      if (!doc.available) throw new UserError('This document is not ready yet.', 409)
      const raw = (body.values ?? {}) as Record<string, unknown>
      const values: Record<string, string> = {}
      for (const field of doc.fields) values[field] = String(raw[field] ?? '').trim().slice(0, 200)
      if (doc.fields.some(f => !values[f])) throw new UserError('Fill in every field before you submit.')
      await record(db, userId, attemptId, 'document', { docId, values })
      break
    }
    case 'submit': {
      if (!state.canSubmit) throw new UserError(`Not ready to submit: ${state.missingToSubmit.join(', ')}.`, 409)
      const isBroker = scenario.role === 'broker'
      const request = isBroker ? ctx.requests.find(r => r.id === state.loadId) : undefined
      if (isBroker && !request) throw new UserError('Request not found.', 404)
      const load = request ? requestAsLoad(request) : await must<LoadRow>(db.from('loads').select('*').eq('id', state.loadId).maybeSingle(), 'Load not found.')
      const truck = await must<TruckRow>(db.from('trucks').select('*').eq('id', state.truckId).maybeSingle(), 'Truck not found.')
      const driver = await must<DriverRow>(db.from('drivers').select('*').eq('id', state.driverId).maybeSingle(), 'Driver not found.')
      const settings = await must<Settings>(db.from('app_settings').select('*').eq('id', 1).maybeSingle(), 'Settings not found.')
      const { data: insight } = isBroker ? { data: null } : await db.from('rate_insights').select('low, booked, high').eq('load_id', load.id).maybeSingle()
      const profile = scenario.scoring_profile_id
        ? await must<{ criteria: { key: string; label: string; weight: number }[] }>(db.from('scoring_profiles').select('criteria').eq('id', scenario.scoring_profile_id).maybeSingle(), 'Scoring profile not found.')
        : { criteria: [] }
      const result = scoreAttempt({ state, events: ctx.events, load, truck, driver, rule: ctx.rule, insight, settings, criteria: profile.criteria, scenarioEvents: scenario.events, carrierRate: request ? carrierRateFor(request) : undefined })
      const { error } = await db
        .from('attempts')
        .update({ status: 'pending_review', auto_score: result.autoScore, breakdown: result.breakdown, mistakes: result.mistakes, time_spent_min: Math.max(1, state.elapsedMin), submitted_at: new Date().toISOString() })
        .eq('id', attemptId)
      if (error) throw new UserError(error.message, 500)
      await db.from('assignments').update({ status: 'submitted' }).eq('id', state.assignmentId)
      return { submitted: true, autoScore: result.autoScore }
    }
    default:
      throw new UserError('Unknown action.')
  }

  return { state: stateOf(await loadAttempt(db, userId, attemptId)) }
}

const deno = (globalThis as { Deno?: { serve: (h: (req: Request) => Promise<Response>) => void; env: { get: (k: string) => string | undefined } } }).Deno

if (deno) {
  deno.serve(async req => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
    try {
      const { createClient } = await import('npm:@supabase/supabase-js@2')
      const url = deno.env.get('SUPABASE_URL')!
      const caller = createClient(url, deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
      const { data: auth } = await caller.auth.getUser()
      if (!auth.user) return json({ error: 'You are not signed in.' }, 401)

      const db = createClient(url, deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      const { data: me } = await db.from('profiles').select('role, status, app_access').eq('id', auth.user.id).maybeSingle()
      if (!me || me.role !== 'student') return json({ error: 'Only students can practise.' }, 403)
      if (me.status !== 'active' || !me.app_access) return json({ error: 'Your account is not active.' }, 403)

      return json(await handle(db, auth.user.id, await req.json()))
    } catch (e) {
      if (e instanceof UserError) return json({ error: e.message }, e.status)
      return json({ error: e instanceof Error ? e.message : 'Something went wrong.' }, 500)
    }
  })
}
