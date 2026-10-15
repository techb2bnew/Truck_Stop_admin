import { normalizePhone } from '../components/formUtils'

export interface UniqueCheck {
  /** The field on the row, for example 'email'. */
  field: string
  /** How it is named in the message, for example 'email'. */
  label: string
  /** Phone numbers are compared by their digits only. */
  kind?: 'text' | 'phone'
}

const key = (value: unknown, kind: UniqueCheck['kind']) =>
  kind === 'phone' ? normalizePhone(value) : String(value ?? '').trim().toLowerCase()

/**
 * A message when another row already has the same value, or null.
 * Case and spaces do not matter, empty values are ignored, and the row being edited does not count against itself.
 */
export function duplicateMessage(
  rows: object[],
  values: Record<string, unknown>,
  noun: string,
  checks: UniqueCheck[],
): string | null {
  const ownId = values.id as string | undefined
  for (const c of checks) {
    const wanted = key(values[c.field], c.kind)
    if (!wanted) continue
    const clash = (rows as Record<string, unknown>[]).some((r) => r.id !== ownId && key(r[c.field], c.kind) === wanted)
    if (clash) return `A ${noun} with this ${c.label} already exists`
  }
  return null
}
