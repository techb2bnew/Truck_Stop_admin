import { useSyncExternalStore } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type {
  AppNotification, AppSettings, Assignment, Attempt, Batch, Broker, Course, DocTemplate, Driver, Feedback, Lesson,
  Load, NegotiationRule, RateEstimate, RateTrend, Scenario, ScoringProfile, Shipper, ShipperRequest, Student,
  Trainer, Truck,
} from '../types'

// All admin data lives in Supabase. Rows are loaded once after login, kept in memory,
// and kept fresh by Realtime. Screens read the in-memory copy, so they stay fast.

type Row = Record<string, unknown> & { id: string | number }
type Listener = () => void

export interface Collection<T extends { id: string }> {
  name: string
  snapshot: () => T[]
  subscribe: (l: Listener) => () => void
  list: () => Promise<T[]>
  get: (id: string) => Promise<T | undefined>
  create: (item: Omit<T, 'id'> & { id?: string }) => Promise<T>
  update: (id: string, patch: Partial<T>) => Promise<T>
  remove: (id: string) => Promise<void>
}

/* ---------- raw tables (one per Supabase table) ---------- */

class RawTable {
  name: string
  rows: Row[] = []
  version = 0
  private listeners = new Set<Listener>()

  constructor(name: string) {
    this.name = name
  }
  subscribe = (l: Listener) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }
  private bump() {
    this.version += 1
    this.listeners.forEach((l) => l())
  }
  set(rows: Row[]) {
    this.rows = rows
    this.bump()
  }
  upsert(row: Row) {
    const i = this.rows.findIndex((r) => String(r.id) === String(row.id))
    this.rows = i === -1 ? [...this.rows, row] : this.rows.map((r, k) => (k === i ? row : r))
    this.bump()
  }
  drop(id: string | number) {
    this.rows = this.rows.filter((r) => String(r.id) !== String(id))
    this.bump()
  }
  async fetch() {
    // app_settings is a single row and has no created_at column.
    const query = supabase.from(this.name).select('*')
    const { data, error } = await (this.name === 'app_settings' ? query : query.order('created_at', { ascending: true }))
    if (error) throw new Error(`${this.name}: ${error.message}`)
    this.set((data ?? []) as Row[])
  }
}

const tables = {
  profiles: new RawTable('profiles'),
  batches: new RawTable('batches'),
  courses: new RawTable('courses'),
  lessons: new RawTable('lessons'),
  companies: new RawTable('companies'),
  negotiation_rules: new RawTable('negotiation_rules'),
  scoring_profiles: new RawTable('scoring_profiles'),
  loads: new RawTable('loads'),
  rate_insights: new RawTable('rate_insights'),
  trucks: new RawTable('trucks'),
  drivers: new RawTable('drivers'),
  shipper_requests: new RawTable('shipper_requests'),
  document_templates: new RawTable('document_templates'),
  scenarios: new RawTable('scenarios'),
  assignments: new RawTable('assignments'),
  attempts: new RawTable('attempts'),
  notifications: new RawTable('notifications'),
  app_settings: new RawTable('app_settings'),
}

/* ---------- name conversion ---------- */

const snake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
const camel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message)
}

interface Spec {
  name: string
  table: RawTable
  /** Which rows of the table belong to this collection. */
  where?: (row: Row) => boolean
  /** Database columns the admin may write. Anything else in a patch is ignored. */
  columns: string[]
  /** App field name to database column name, where they are not just snake_case of each other. */
  rename?: Record<string, string>
  /** Columns added to every insert, e.g. type = 'broker'. */
  insertDefaults?: Record<string, unknown>
  /** Final touch on the app object built from a row. */
  finish?: (row: Row, app: Record<string, unknown>) => void
  create?: (item: Record<string, unknown>) => Promise<Row>
  remove?: (id: string) => Promise<void>
}

function collection<T extends { id: string }>(spec: Spec): Collection<T> {
  const rename = spec.rename ?? {}
  const reverse = Object.fromEntries(Object.entries(rename).map(([a, d]) => [d, a]))

  const toApp = (row: Row): T => {
    const app: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(row)) app[reverse[k] ?? camel(k)] = v
    app.id = String(row.id)
    spec.finish?.(row, app)
    return app as T
  }
  const toDb = (patch: Record<string, unknown>) => {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(patch)) {
      const col = rename[k] ?? snake(k)
      if (spec.columns.includes(col)) out[col] = v
    }
    return out
  }

  let cache: { version: number; items: T[] } = { version: -1, items: [] }
  const snapshot = () => {
    if (cache.version !== spec.table.version) {
      const rows = spec.where ? spec.table.rows.filter(spec.where) : spec.table.rows
      cache = { version: spec.table.version, items: rows.map(toApp) }
    }
    return cache.items
  }

  return {
    name: spec.name,
    snapshot,
    subscribe: spec.table.subscribe,
    list: async () => snapshot(),
    get: async (id) => snapshot().find((i) => i.id === id),
    create: async (item) => {
      const payload = { ...spec.insertDefaults, ...toDb(item as Record<string, unknown>) }
      let row: Row
      if (spec.create) {
        row = await spec.create(item as Record<string, unknown>)
      } else {
        const { data, error } = await supabase.from(spec.table.name).insert(payload).select().single()
        fail(error)
        row = data as Row
      }
      spec.table.upsert(row)
      return toApp(row)
    },
    update: async (id, patch) => {
      const { data, error } = await supabase.from(spec.table.name).update(toDb(patch as Record<string, unknown>)).eq('id', id).select().single()
      fail(error)
      spec.table.upsert(data as Row)
      return toApp(data as Row)
    },
    remove: async (id) => {
      if (spec.remove) {
        await spec.remove(id)
      } else {
        const { error } = await supabase.from(spec.table.name).delete().eq('id', id)
        fail(error)
      }
      spec.table.drop(id)
    },
  }
}

/* ---------- Edge Function (student accounts) ---------- */

async function callStudentFunction(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('manage-student', { body })
  if (error) {
    const notSetUp =
      'Student service is not set up yet. In Supabase open Edge Functions and deploy the function named manage-student, then try again.'
    // The browser could not reach the function at all: it is not deployed (or is named differently).
    if (error.name === 'FunctionsFetchError' || /failed to send a request/i.test(error.message)) throw new Error(notSetUp)

    let message = error.message
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const detail = await ctx.json()
        if (detail?.code === 'NOT_FOUND') throw new Error(notSetUp)
        if (detail?.error) message = String(detail.error)
      } catch (e) {
        if (e instanceof Error && e.message === notSetUp) throw e
        /* keep the generic message */
      }
    }
    throw new Error(message)
  }
  return data as { profile?: Row; ok?: boolean; password?: string; email?: string }
}

/** Emails a student their login details (needs the SMTP secrets on the manage-student function). */
export const emailStudentCredentials = async (email: string, password: string) => {
  await callStudentFunction({ action: 'email_credentials', email, password })
}

// The generated password is shown once, right after the student is created, and never stored.
let lastStudentPassword = ''
export const takeStudentPassword = () => {
  const p = lastStudentPassword
  lastStudentPassword = ''
  return p
}

export const resetStudentPassword = async (id: string) => {
  const res = await callStudentFunction({ action: 'reset_password', id })
  return { email: String(res.email ?? ''), password: String(res.password ?? '') }
}

// Email based invite, used once SMTP is set up.
export const resendInvite = async (email: string) => {
  await callStudentFunction({ action: 'resend', email })
}

/* ---------- collections the admin screens use ---------- */

const isStudent = (r: Row) => r.role === 'student'
const isStaff = (r: Row) => r.role === 'super_admin' || r.role === 'trainer'

const base = {
  trainers: collection<Trainer>({
    name: 'trainers', table: tables.profiles, where: isStaff, columns: [], rename: { name: 'full_name' },
  }),
  students: collection<Student>({
    name: 'students',
    table: tables.profiles,
    where: isStudent,
    columns: ['full_name', 'email', 'phone', 'roles', 'batch_id', 'status', 'app_access', 'invite_status'],
    rename: { name: 'full_name' },
    finish: (row, app) => {
      app.joinedAt = String(row.created_at ?? '').slice(0, 10)
    },
    // New students are invited by email through the Edge Function (needs the service-role key).
    create: async (item) => {
      const res = await callStudentFunction({ action: 'create', student: item })
      if (!res.profile) throw new Error('The server did not return the new student.')
      lastStudentPassword = res.password ?? ''
      return res.profile
    },
    remove: async (id) => {
      await callStudentFunction({ action: 'delete', id })
    },
  }),
  batches: collection<Batch>({
    name: 'batches', table: tables.batches, columns: ['name', 'trainer_id', 'description', 'start_date'],
  }),
  courses: collection<Course>({
    name: 'courses', table: tables.courses, columns: ['title', 'description', 'audience', 'status'],
  }),
  lessons: collection<Lesson>({
    name: 'lessons', table: tables.lessons, columns: ['course_id', 'title', 'type', 'duration_min', 'sort_order', 'content'],
    rename: { order: 'sort_order' },
  }),
  scenarios: collection<Scenario>({
    name: 'scenarios', table: tables.scenarios,
    columns: [
      'title', 'role', 'difficulty', 'background', 'instructions', 'time_limit_min', 'max_attempts', 'load_ids', 'truck_ids',
      'driver_ids', 'document_ids', 'broker_id', 'shipper_id', 'negotiation_rule_id', 'scoring_profile_id', 'events', 'status',
    ],
  }),
  loads: collection<Load>({
    name: 'loads', table: tables.loads,
    columns: [
      'origin_city', 'origin_state', 'dest_city', 'dest_state', 'pickup_date', 'delivery_date', 'equipment', 'size', 'weight_lbs',
      'length_ft', 'commodity', 'loaded_miles', 'deadhead_miles', 'posted_rate', 'broker_id', 'posted_at', 'notes',
    ],
  }),
  trucks: collection<Truck>({
    name: 'trucks', table: tables.trucks,
    columns: ['unit_number', 'equipment', 'make', 'year', 'plate', 'capacity_lbs', 'length_ft', 'mpg', 'location_city', 'location_state', 'status'],
  }),
  drivers: collection<Driver>({
    name: 'drivers', table: tables.drivers,
    columns: ['name', 'phone', 'license_no', 'experience_years', 'home_city', 'pay_per_mile', 'truck_id', 'availability'],
  }),
  // Brokers and shippers share the companies table; "type" tells them apart.
  brokers: collection<Broker>({
    name: 'brokers', table: tables.companies, where: (r) => r.type === 'broker',
    columns: ['company', 'contact_name', 'email', 'phone', 'address', 'mc_number', 'credit_rating', 'days_to_pay'],
    insertDefaults: { type: 'broker' },
  }),
  shippers: collection<Shipper>({
    name: 'shippers', table: tables.companies, where: (r) => r.type === 'shipper',
    columns: ['company', 'contact_name', 'email', 'phone', 'city', 'state', 'industry'],
    insertDefaults: { type: 'shipper' },
  }),
  shipperRequests: collection<ShipperRequest>({
    name: 'shipperRequests', table: tables.shipper_requests,
    columns: ['shipper_id', 'origin_city', 'origin_state', 'dest_city', 'dest_state', 'pickup_date', 'equipment', 'weight_lbs', 'commodity', 'offered_rate', 'notes'],
  }),
  negotiationRules: collection<NegotiationRule>({
    name: 'negotiationRules', table: tables.negotiation_rules,
    columns: ['name', 'opening_offer', 'target_rate', 'min_rate', 'max_rate', 'max_rounds', 'step_percent', 'accept_message', 'counter_message', 'reject_message'],
  }),
  documents: collection<DocTemplate>({
    name: 'documents', table: tables.document_templates, columns: ['name', 'type', 'description', 'file_name', 'fields'],
  }),
  scoringProfiles: collection<ScoringProfile>({
    name: 'scoringProfiles', table: tables.scoring_profiles, columns: ['name', 'pass_mark', 'criteria'],
  }),
  assignments: collection<Assignment>({
    name: 'assignments', table: tables.assignments, columns: ['scenario_id', 'student_id', 'assigned_at', 'due_date', 'status', 'attempts_used'],
  }),
  attempts: collection<Attempt>({
    // A practice a student is still working on is not a result yet, so it stays out of reviews, reports and averages.
    name: 'attempts', table: tables.attempts, where: r => r.status !== 'in_progress',
    columns: [
      'assignment_id', 'student_id', 'scenario_id', 'attempt_no', 'submitted_at', 'auto_score', 'trainer_score', 'time_spent_min',
      'mistakes', 'breakdown', 'status', 'trainer_comment', 'decision', 'reviewed_by', 'reviewed_at',
    ],
  }),
  notifications: collection<AppNotification>({
    name: 'notifications', table: tables.notifications, columns: ['kind', 'title', 'body', 'target', 'target_id'],
  }),
  settings: collection<AppSettings>({
    name: 'settings', table: tables.app_settings,
    columns: ['fuel_cost_per_mile', 'driver_pay_per_mile', 'deadhead_rate_per_mile', 'default_max_attempts', 'default_pass_mark', 'organisation'],
  }),
} as const

/* ---------- virtual collections: the rate insight row is shown as an estimate AND as weekly trends ---------- */

interface TrendPoint { weekStart: string; avgRate: number }
const trendOf = (row: Row) => ((row.trend as TrendPoint[] | null) ?? [])

const insights = tables.rate_insights

function virtual<T extends { id: string }>(
  name: string,
  build: () => T[],
  ops: Pick<Collection<T>, 'create' | 'update' | 'remove'>,
): Collection<T> {
  let cache: { version: number; items: T[] } = { version: -1, items: [] }
  const snapshot = () => {
    if (cache.version !== insights.version) cache = { version: insights.version, items: build() }
    return cache.items
  }
  return { name, snapshot, subscribe: insights.subscribe, list: async () => snapshot(), get: async (id) => snapshot().find((i) => i.id === id), ...ops }
}

const asEstimate = (r: Row): RateEstimate => ({
  id: String(r.id), loadId: String(r.load_id), low: Number(r.low), booked: Number(r.booked), high: Number(r.high),
  confidence: r.confidence as RateEstimate['confidence'],
})

export const rateEstimates: Collection<RateEstimate> = virtual<RateEstimate>(
  'rateEstimates',
  () => insights.rows.map(asEstimate),
  {
    create: async (item) => {
      const { data, error } = await supabase.from('rate_insights')
        .insert({ load_id: item.loadId, low: item.low, booked: item.booked, high: item.high, confidence: item.confidence, trend: [] })
        .select().single()
      fail(error)
      insights.upsert(data as Row)
      return asEstimate(data as Row)
    },
    update: async (id, patch) => {
      const body: Record<string, unknown> = {}
      for (const k of ['low', 'booked', 'high', 'confidence'] as const) if (patch[k] !== undefined) body[k] = patch[k]
      const { data, error } = await supabase.from('rate_insights').update(body).eq('id', id).select().single()
      fail(error)
      insights.upsert(data as Row)
      return asEstimate(data as Row)
    },
    remove: async (id) => {
      const { error } = await supabase.from('rate_insights').delete().eq('id', id)
      fail(error)
      insights.drop(id)
    },
  },
)

const asTrend = (r: Row, p: TrendPoint, i: number): RateTrend => ({ id: `${r.id}|${i}`, loadId: String(r.load_id), weekStart: p.weekStart, avgRate: p.avgRate })

async function saveTrend(row: Row, trend: TrendPoint[]) {
  const { data, error } = await supabase.from('rate_insights').update({ trend }).eq('id', row.id).select().single()
  fail(error)
  insights.upsert(data as Row)
  return data as Row
}

export const rateTrends: Collection<RateTrend> = virtual<RateTrend>(
  'rateTrends',
  () => insights.rows.flatMap((r) => trendOf(r).map((p, i) => asTrend(r, p, i))),
  {
    create: async (item) => {
      let row = insights.rows.find((r) => r.load_id === item.loadId)
      if (!row) {
        const created = await rateEstimates.create({ loadId: item.loadId, low: 0, booked: 0, high: 0, confidence: 'Medium' })
        row = insights.rows.find((r) => r.id === created.id)!
      }
      const next = [...trendOf(row), { weekStart: item.weekStart, avgRate: item.avgRate }]
      const saved = await saveTrend(row, next)
      return asTrend(saved, next[next.length - 1], next.length - 1)
    },
    update: async (id, patch) => {
      const [rowId, index] = id.split('|')
      const row = insights.rows.find((r) => String(r.id) === rowId)
      if (!row) throw new Error('Trend not found')
      const next = trendOf(row).map((p, i) => (i === Number(index) ? { ...p, ...(patch.weekStart !== undefined ? { weekStart: patch.weekStart } : {}), ...(patch.avgRate !== undefined ? { avgRate: patch.avgRate } : {}) } : p))
      const saved = await saveTrend(row, next)
      return asTrend(saved, next[Number(index)], Number(index))
    },
    remove: async (id) => {
      const [rowId, index] = id.split('|')
      const row = insights.rows.find((r) => String(r.id) === rowId)
      if (!row) return
      await saveTrend(row, trendOf(row).filter((_, i) => i !== Number(index)))
    },
  },
)

/* ---------- the trainer's review is stored on the attempt row, and shown as feedback ---------- */

const attemptsTable = tables.attempts
const asFeedback = (r: Row): Feedback => ({
  id: String(r.id), attemptId: String(r.id), trainerId: String(r.reviewed_by ?? ''),
  comment: String(r.trainer_comment ?? ''), decision: r.decision as Feedback['decision'], createdAt: String(r.reviewed_at ?? ''),
})

let feedbackCache: { version: number; items: Feedback[] } = { version: -1, items: [] }
export const feedbacks: Collection<Feedback> = {
  name: 'feedbacks',
  snapshot: () => {
    if (feedbackCache.version !== attemptsTable.version) {
      feedbackCache = { version: attemptsTable.version, items: attemptsTable.rows.filter((r) => r.decision).map(asFeedback) }
    }
    return feedbackCache.items
  },
  subscribe: attemptsTable.subscribe,
  list: async () => feedbacks.snapshot(),
  get: async (id) => feedbacks.snapshot().find((f) => f.id === id),
  create: async (item) => {
    const { data, error } = await supabase.from('attempts')
      .update({ trainer_comment: item.comment, decision: item.decision, reviewed_by: item.trainerId || null, reviewed_at: new Date().toISOString() })
      .eq('id', item.attemptId).select().single()
    fail(error)
    attemptsTable.upsert(data as Row)
    return asFeedback(data as Row)
  },
  update: async (id, patch) => {
    const { data, error } = await supabase.from('attempts').update({ trainer_comment: patch.comment }).eq('id', id).select().single()
    fail(error)
    attemptsTable.upsert(data as Row)
    return asFeedback(data as Row)
  },
  remove: async (id) => {
    const { data, error } = await supabase.from('attempts').update({ trainer_comment: null, decision: null, reviewed_by: null, reviewed_at: null }).eq('id', id).select().single()
    fail(error)
    attemptsTable.upsert(data as Row)
  },
}

export const db = { ...base, rateEstimates, rateTrends, feedbacks }

/* ---------- loading and realtime ---------- */

interface Status { phase: 'idle' | 'loading' | 'ready' | 'error'; message: string }
let status: Status = { phase: 'idle', message: '' }
const statusListeners = new Set<Listener>()
const setStatus = (s: Status) => {
  status = s
  statusListeners.forEach((l) => l())
}

let channel: RealtimeChannel | null = null
let channelSeq = 0

function stopRealtime() {
  if (channel) void supabase.removeChannel(channel)
  channel = null
}

// supabase-js hands back the SAME channel for the same name, and a subscribed channel cannot take new
// listeners. So every start gets a fresh name and the old channel is removed first.
function startRealtime() {
  stopRealtime()
  try {
    let ch = supabase.channel(`admin-sync-${++channelSeq}`)
    for (const t of Object.values(tables)) {
      ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: t.name }, (payload) => {
        if (payload.eventType === 'DELETE') t.drop((payload.old as Row).id)
        else t.upsert(payload.new as Row)
      })
    }
    channel = ch.subscribe()
  } catch (e) {
    // Live updates are a bonus: the data itself is already loaded, so the app keeps working.
    console.warn('Realtime is not available:', e)
  }
}

export const store = {
  async load() {
    if (status.phase === 'loading' || status.phase === 'ready') return
    setStatus({ phase: 'loading', message: '' })
    try {
      await Promise.all(Object.values(tables).map((t) => t.fetch()))
      startRealtime()
      setStatus({ phase: 'ready', message: '' })
    } catch (e) {
      setStatus({ phase: 'error', message: e instanceof Error ? e.message : 'Could not load data.' })
    }
  },
  reset() {
    stopRealtime()
    Object.values(tables).forEach((t) => t.set([]))
    setStatus({ phase: 'idle', message: '' })
  },
  retry() {
    setStatus({ phase: 'idle', message: '' })
    return store.load()
  },
}

export function useStoreStatus(): Status {
  return useSyncExternalStore(
    (l) => {
      statusListeners.add(l)
      return () => statusListeners.delete(l)
    },
    () => status,
  )
}

export function useCollection<T extends { id: string }>(c: Collection<T>): T[] {
  return useSyncExternalStore(c.subscribe, c.snapshot)
}
