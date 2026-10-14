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

export const TODAY = new Date().toISOString().slice(0, 10)

/** Monday dates of the last four weeks, oldest first, for the rate trend of a new load. */
export function lastWeekStarts(count = 4): string[] {
  const d = new Date(`${TODAY}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return Array.from({ length: count }, (_, i) => {
    const w = new Date(d)
    w.setUTCDate(d.getUTCDate() - 7 * (count - 1 - i))
    return w.toISOString().slice(0, 10)
  })
}

export const isOverdue = (due: string) => due < TODAY
