import type { Broker, Load, Shipper, Student, Batch, Scenario } from '../types'

export const loadLabel = (l: Load) => `${l.originCity}, ${l.originState} → ${l.destCity}, ${l.destState}`
export const byId = <T extends { id: string }>(list: T[], id: string | null | undefined) => (id ? list.find((x) => x.id === id) : undefined)
export const brokerName = (list: Broker[], id: string | null) => byId(list, id)?.company ?? '—'
export const shipperName = (list: Shipper[], id: string | null) => byId(list, id)?.company ?? '—'
export const studentName = (list: Student[], id: string) => byId(list, id)?.name ?? 'Unknown'
export const batchName = (list: Batch[], id: string | null) => byId(list, id)?.name ?? 'No batch'
export const scenarioTitle = (list: Scenario[], id: string) => byId(list, id)?.title ?? 'Unknown'
export const roleLabel = (r: string) => (r === 'dispatcher' ? 'Dispatcher' : r === 'broker' ? 'Freight Broker' : 'Both')
