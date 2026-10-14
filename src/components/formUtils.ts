import type { FieldDef } from './formTypes'

export const PHONE_DIGITS = 10
/** A US state is written as two capital letters: IN, OH. */
export const normalizeState = (v: unknown): string => String(v ?? '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2)
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Emails are always saved in small letters with no spaces. */
export const normalizeEmail = (v: unknown): string => String(v ?? '').replace(/\s/g, '').toLowerCase()
/** Phone numbers are kept as digits only, at most 10. */
export const normalizePhone = (v: unknown): string => String(v ?? '').replace(/\D/g, '').slice(0, PHONE_DIGITS)

/** The first required field that is empty, as a message, or null when the form is complete. */
export function firstMissing(fields: FieldDef[], values: Record<string, unknown>): string | null {
  for (const f of fields) {
    const v = values[f.name]
    if (f.required && (v === '' || v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0))) return `${f.label} is required`
    if (f.type === 'state' && v && normalizeState(v).length !== 2) return `${f.label} must be 2 letters, like IN`
    if (f.type === 'number' && v !== '' && v != null) {
      const n = Number(v)
      const min = f.min ?? 0
      if (!Number.isFinite(n)) return `${f.label} must be a number`
      if (n < min) return min === 0 ? `${f.label} cannot be negative` : `${f.label} must be at least ${min}`
      if (f.max != null && n > f.max) return `${f.label} must be at most ${f.max}`
      if (f.integer && !Number.isInteger(n)) return `${f.label} must be a whole number`
    }
    if (f.type === 'email' && v && !EMAIL_PATTERN.test(normalizeEmail(v))) return `${f.label} is not a valid email`
    if (f.type === 'phone' && v && normalizePhone(v).length !== PHONE_DIGITS) return `${f.label} must be ${PHONE_DIGITS} digits`
  }
  return null
}

/** Turns what the form holds (strings) into what the database wants (numbers, null, lists). */
export function cleanValues(fields: FieldDef[], values: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...values }
  for (const f of fields) {
    const v = clean[f.name]
    if ((f.type === 'text' || f.type === 'textarea') && typeof v === 'string') clean[f.name] = v.trim()
    if (f.type === 'state') clean[f.name] = normalizeState(v)
    if (f.type === 'email') clean[f.name] = normalizeEmail(v)
    if (f.type === 'phone') clean[f.name] = normalizePhone(v)
    if (f.type === 'number') clean[f.name] = v === '' || v == null ? (f.nullable ? null : 0) : Number(v)
    if (f.type === 'select' && f.nullable && v === '') clean[f.name] = null
    if (f.type === 'lines') clean[f.name] = ((v as string[] | undefined) ?? []).map((x) => x.trim()).filter(Boolean)
  }
  return clean
}
