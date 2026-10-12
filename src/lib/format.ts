export const money = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export const money2 = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

export const num = (n: number) => n.toLocaleString('en-US')

export function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const date = new Date(d.length === 10 ? `${d}T00:00:00` : d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtDateTime(d: string) {
  const date = new Date(d)
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export const TODAY = '2026-10-12'

export const isOverdue = (due: string) => due < TODAY
