import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FieldDef, QuickKey } from './formTypes'
import { QuickAddModal } from './QuickAddModal'
import { normalizeEmail, normalizePhone, normalizeState, PHONE_DIGITS } from './formUtils'
import { FormField } from './ui'

const ADD = '__add__'

/** The fields of a form. Dropdowns with `addNew` get a "+ Add new ..." choice that opens a popup or jumps to a page. */
export function FormGrid({
  fields, values, onChange, onLeave,
}: {
  fields: FieldDef[]
  values: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
  /** Called just before jumping to another page, so the parent popup can close. */
  onLeave?: () => void
}) {
  const nav = useNavigate()
  const [adding, setAdding] = useState<{ kind: QuickKey; field: FieldDef } | null>(null)

  const handleAdd = (f: FieldDef) => {
    const a = f.addNew
    if (!a) return
    if ('href' in a) {
      onLeave?.()
      nav(a.href)
    } else {
      setAdding({ kind: a.kind, field: f })
    }
  }

  // The new item is picked right away, so the user can carry on with the form.
  const created = (id: string) => {
    if (!adding) return
    const f = adding.field
    if (f.type === 'multiselect') onChange(f.name, [...((values[f.name] as string[] | undefined) ?? []), id])
    else onChange(f.name, id)
    setAdding(null)
  }

  return (
    <>
      {fields.map((f) => (
        <FormField key={f.name} label={f.label} hint={f.hint} required={f.required} className={f.span === 2 || f.type === 'textarea' || f.type === 'lines' || f.type === 'multiselect' ? 'col-span-2' : ''}>
          <FieldInput field={f} value={values[f.name]} onChange={(v) => onChange(f.name, v)} onAddNew={f.addNew ? () => handleAdd(f) : undefined} />
        </FormField>
      ))}
      {adding && <QuickAddModal kind={adding.kind} onClose={() => setAdding(null)} onCreated={created} />}
    </>
  )
}

export function FieldInput({
  field: f, value, onChange, onAddNew,
}: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; onAddNew?: () => void }) {
  if (f.type === 'textarea') {
    return <textarea className="input min-h-24" value={String(value ?? '')} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
  }
  if (f.type === 'lines') {
    return <textarea className="input min-h-24" value={((value as string[] | undefined) ?? []).join('\n')} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value.split('\n'))} />
  }
  if (f.type === 'select') {
    const empty = (f.options?.length ?? 0) === 0
    return (
      <select
        className="input"
        value={value == null ? '' : String(value)}
        onChange={(e) => {
          // "+ Add new" is an action, not a value: the selection stays as it was.
          if (e.target.value === ADD) onAddNew?.()
          else onChange(e.target.value)
        }}
      >
        <option value="">{f.nullable ? 'None' : empty ? 'Nothing here yet' : 'Select…'}</option>
        {f.options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        {onAddNew && f.addNew && <option value={ADD}>+ {f.addNew.label}</option>}
      </select>
    )
  }
  if (f.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 py-2 text-sm text-slate-700">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-500" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {f.placeholder ?? 'Enabled'}
      </label>
    )
  }
  if (f.type === 'multiselect') {
    const selected = (value as string[] | undefined) ?? []
    return (
      <div className="rounded-lg border border-slate-300 p-2">
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {f.options?.map((o) => (
            <label key={o.value} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-slate-50">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 accent-brand-500"
                checked={selected.includes(o.value)}
                onChange={(e) => onChange(e.target.checked ? [...selected, o.value] : selected.filter((x) => x !== o.value))}
              />
              {o.label}
            </label>
          ))}
          {(f.options?.length ?? 0) === 0 && <p className="px-1 text-sm text-slate-400">Nothing available yet.</p>}
        </div>
        {onAddNew && f.addNew && (
          <button type="button" onClick={onAddNew} className="mt-1 flex w-full items-center gap-1.5 rounded px-1.5 py-1.5 text-left text-sm font-medium text-brand-700 hover:bg-brand-50">
            <Plus size={14} /> {f.addNew.label}
          </button>
        )}
      </div>
    )
  }
  if (f.type === 'email') {
    return (
      <input
        className="input"
        type="email"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={f.placeholder ?? 'name@company.com'}
        value={normalizeEmail(value)}
        onChange={(e) => onChange(normalizeEmail(e.target.value))}
      />
    )
  }
  if (f.type === 'state') {
    return (
      <input
        className="input uppercase"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        maxLength={2}
        placeholder={f.placeholder ?? 'IN'}
        value={normalizeState(value)}
        onChange={(e) => onChange(normalizeState(e.target.value))}
      />
    )
  }
  if (f.type === 'phone') {
    return (
      <input
        className="input"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={PHONE_DIGITS}
        placeholder={f.placeholder ?? `${PHONE_DIGITS} digit number`}
        value={normalizePhone(value)}
        onChange={(e) => onChange(normalizePhone(e.target.value))}
      />
    )
  }
  return (
    <input
      className="input"
      type={f.type}
      step={f.type === 'number' ? (f.step ?? (f.integer ? '1' : 'any')) : f.step}
      min={f.type === 'number' ? (f.min ?? 0) : undefined}
      max={f.type === 'number' ? f.max : undefined}
      inputMode={f.type === 'number' ? 'decimal' : undefined}
      placeholder={f.placeholder}
      value={value == null ? '' : String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
