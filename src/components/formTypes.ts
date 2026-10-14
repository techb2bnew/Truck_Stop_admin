export interface Option { value: string; label: string }

/** Things that can be created from inside a dropdown, in a popup, without leaving the form. */
export type QuickKey = 'batch' | 'broker' | 'shipper' | 'truck' | 'driver' | 'load' | 'document' | 'rule'

/** Shown as "+ Add new ..." in a dropdown: either a popup (kind) or a jump to another page (href). */
export type AddNew = { kind: QuickKey; label: string } | { href: string; label: string }

export interface FieldDef {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'datetime-local' | 'email' | 'phone' | 'state' | 'select' | 'textarea' | 'lines' | 'checkbox' | 'multiselect'
  options?: Option[]
  required?: boolean
  placeholder?: string
  span?: 1 | 2
  step?: string
  /** Numbers: the lowest and highest allowed. Numbers can never be negative unless `min` says so. */
  min?: number
  max?: number
  /** Numbers: whole numbers only. */
  integer?: boolean
  nullable?: boolean
  hint?: string
  addNew?: AddNew
}
