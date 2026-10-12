import { useSyncExternalStore } from 'react'
import * as seed from '../data/seed'

// In-memory collections persisted to localStorage.
// Every function is async so the Supabase swap later only touches this file.

const VERSION = 'v2'
const prefix = `truckstop:${VERSION}:`

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
  replaceAll: (items: T[]) => void
  reset: () => void
}

export function uid(p: string) {
  return `${p}${Math.random().toString(36).slice(2, 9)}`
}

function load<T>(name: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(prefix + name)
    if (raw) return JSON.parse(raw) as T[]
  } catch {
    /* ignore */
  }
  return structuredClone(fallback)
}

function createCollection<T extends { id: string }>(name: string, seedData: T[], idPrefix: string): Collection<T> {
  let items = load<T>(name, seedData)
  const listeners = new Set<Listener>()
  const emit = () => {
    try {
      localStorage.setItem(prefix + name, JSON.stringify(items))
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l())
  }
  return {
    name,
    snapshot: () => items,
    subscribe: (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    list: async () => items,
    get: async (id) => items.find((i) => i.id === id),
    create: async (item) => {
      const created = { ...item, id: item.id ?? uid(idPrefix) } as T
      items = [...items, created]
      emit()
      return created
    },
    update: async (id, patch) => {
      let updated: T | undefined
      items = items.map((i) => {
        if (i.id !== id) return i
        updated = { ...i, ...patch }
        return updated
      })
      emit()
      if (!updated) throw new Error('Not found')
      return updated
    },
    remove: async (id) => {
      items = items.filter((i) => i.id !== id)
      emit()
    },
    replaceAll: (next) => {
      items = next
      emit()
    },
    reset: () => {
      items = structuredClone(seedData)
      emit()
    },
  }
}

export const db = {
  trainers: createCollection(`trainers`, seed.trainers, 'tr'),
  batches: createCollection('batches', seed.batches, 'b'),
  students: createCollection('students', seed.students, 's'),
  courses: createCollection('courses', seed.courses, 'c'),
  lessons: createCollection('lessons', seed.lessons, 'l'),
  scenarios: createCollection('scenarios', seed.scenarios, 'sc'),
  loads: createCollection('loads', seed.loads, 'ld'),
  rateEstimates: createCollection('rateEstimates', seed.rateEstimates, 're'),
  rateTrends: createCollection('rateTrends', seed.rateTrends, 'rt'),
  trucks: createCollection('trucks', seed.trucks, 'tk'),
  drivers: createCollection('drivers', seed.drivers, 'dr'),
  brokers: createCollection('brokers', seed.brokers, 'br'),
  shippers: createCollection('shippers', seed.shippers, 'sh'),
  shipperRequests: createCollection('shipperRequests', seed.shipperRequests, 'rq'),
  negotiationRules: createCollection('negotiationRules', seed.negotiationRules, 'nr'),
  documents: createCollection('documents', seed.documents, 'dc'),
  scoringProfiles: createCollection('scoringProfiles', seed.scoringProfiles, 'sp'),
  assignments: createCollection('assignments', seed.assignments, 'as'),
  attempts: createCollection('attempts', seed.attempts, 'at'),
  feedbacks: createCollection('feedbacks', seed.feedbacks, 'fb'),
  notifications: createCollection('notifications', seed.notifications, 'n'),
  settings: createCollection('settings', seed.settings, 'st'),
}

export function useCollection<T extends { id: string }>(c: Collection<T>): T[] {
  return useSyncExternalStore(c.subscribe, c.snapshot)
}

export function resetDemoData() {
  Object.values(db).forEach((c) => c.reset())
}
