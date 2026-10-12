import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useCollection, type Collection } from '../services/store'
import { Button, Card, ConfirmDialog, EmptyState, FormField, Modal, PageHeader, useToast } from './ui'

export interface Option { value: string; label: string }

export interface Column<T> {
  header: string
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  className?: string
}

export interface FieldDef {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'datetime-local' | 'email' | 'select' | 'textarea' | 'lines' | 'checkbox' | 'multiselect'
  options?: Option[]
  required?: boolean
  placeholder?: string
  span?: 1 | 2
  step?: string
  nullable?: boolean
  hint?: string
}

export interface FilterDef<T> {
  label: string
  options: Option[]
  match: (row: T, value: string) => boolean
}

interface Props<T extends { id: string }> {
  title: string
  subtitle?: string
  singular: string
  collection: Collection<T>
  columns: Column<T>[]
  fields: FieldDef[]
  defaults: Omit<T, 'id'>
  searchText: (row: T) => string
  filters?: FilterDef<T>[]
  extraRowActions?: (row: T) => ReactNode
  headerActions?: ReactNode
  rows?: T[]
  validate?: (values: Record<string, unknown>) => string | null
  onCreated?: (row: T) => void
  beforeDelete?: (row: T) => string | null
  wide?: boolean
  pageSize?: number
}

export function ResourcePage<T extends { id: string }>({
  title, subtitle, singular, collection, columns, fields, defaults, searchText, filters = [],
  extraRowActions, headerActions, rows, validate, onCreated, beforeDelete, wide, pageSize = 10,
}: Props<T>) {
  const all = useCollection(collection)
  const source = rows ?? all
  const toast = useToast()

  const [query, setQuery] = useState('')
  const [filterValues, setFilterValues] = useState<string[]>(() => filters.map(() => ''))
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ index: number; dir: 1 | -1 } | null>(null)

  const [editing, setEditing] = useState<T | null>(null)
  const [creating, setCreating] = useState(false)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<T | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = source.filter((r) => (q ? searchText(r).toLowerCase().includes(q) : true))
    filters.forEach((f, i) => {
      if (filterValues[i]) out = out.filter((r) => f.match(r, filterValues[i]))
    })
    if (sort) {
      const col = columns[sort.index]
      if (col.sortValue) {
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a)
          const bv = col.sortValue!(b)
          return av < bv ? -sort.dir : av > bv ? sort.dir : 0
        })
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, query, filterValues, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages - 1)
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize)

  const openCreate = () => {
    setValues({ ...(defaults as Record<string, unknown>) })
    setError(null)
    setEditing(null)
    setCreating(true)
  }
  const openEdit = (row: T) => {
    setValues({ ...(row as Record<string, unknown>) })
    setError(null)
    setCreating(false)
    setEditing(row)
  }
  const close = () => {
    setCreating(false)
    setEditing(null)
  }

  const set = (name: string, v: unknown) => setValues((s) => ({ ...s, [name]: v }))

  const submit = async () => {
    for (const f of fields) {
      const v = values[f.name]
      if (f.required && (v === '' || v == null || (Array.isArray(v) && v.length === 0))) {
        setError(`${f.label} is required`)
        return
      }
    }
    const custom = validate?.(values)
    if (custom) {
      setError(custom)
      return
    }
    const clean: Record<string, unknown> = { ...values }
    for (const f of fields) {
      const v = clean[f.name]
      if (f.type === 'number') clean[f.name] = v === '' || v == null ? (f.nullable ? null : 0) : Number(v)
      if (f.type === 'select' && f.nullable && v === '') clean[f.name] = null
      if (f.type === 'lines') clean[f.name] = ((v as string[] | undefined) ?? []).map((x) => x.trim()).filter(Boolean)
    }
    if (editing) {
      await collection.update(editing.id, clean as Partial<T>)
      toast(`${singular} updated`)
    } else {
      const created = await collection.create(clean as Omit<T, 'id'>)
      onCreated?.(created)
      toast(`${singular} added`)
    }
    close()
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await collection.remove(deleting.id)
    toast(`${singular} deleted`)
    setDeleting(null)
  }

  const requestDelete = (row: T) => {
    const block = beforeDelete?.(row)
    if (block) {
      toast(block)
      return
    }
    setDeleting(row)
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {headerActions}
            <Button onClick={openCreate}>
              <Plus size={16} /> Add {singular}
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-2.5 sm:gap-3 sm:p-3">
          <div className="relative min-w-56 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder={`Search ${title.toLowerCase()}…`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
            />
          </div>
          <div className="flex w-full gap-2 overflow-x-auto sm:contents">
          {filters.map((f, i) => (
            <select
              key={f.label}
              className="input w-auto shrink-0"
              value={filterValues[i]}
              onChange={(e) => {
                setFilterValues((s) => s.map((x, k) => (k === i ? e.target.value : x)))
                setPage(0)
              }}
            >
              <option value="">{f.label}: all</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((c, i) => (
                  <th
                    key={c.header}
                    className={`px-4 py-2.5 font-semibold ${c.sortValue ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                    onClick={() => c.sortValue && setSort((s) => (s?.index === i ? { index: i, dir: (s.dir * -1) as 1 | -1 } : { index: i, dir: 1 }))}
                  >
                    {c.header}
                    {sort?.index === i && (sort.dir === 1 ? ' ▲' : ' ▼')}
                  </th>
                ))}
                <th className="w-28 px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  {columns.map((c) => (
                    <td key={c.header} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>{c.render(row)}</td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {extraRowActions?.(row)}
                      <button onClick={() => openEdit(row)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => requestDelete(row)} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <EmptyState title={`No ${title.toLowerCase()} found`} hint="Try clearing the filters or add a new one." />}
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {visible.map((row) => (
            <div key={row.id} className="flex items-center gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm">{columns[0].render(row)}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  {columns.slice(1, 3).map((c) => (
                    <span key={c.header} className="min-w-0">{c.render(row)}</span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                {extraRowActions?.(row)}
                <button onClick={() => openEdit(row)} className="rounded p-2 text-slate-500 hover:bg-slate-100" aria-label="Edit"><Pencil size={16} /></button>
                <button onClick={() => requestDelete(row)} className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {visible.length === 0 && <EmptyState title={`No ${title.toLowerCase()} found`} hint="Try clearing the filters or add a new one." />}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 text-sm text-slate-500">
          <span>{filtered.length} {filtered.length === 1 ? 'record' : 'records'}</span>
          <div className="flex items-center gap-2">
            <button disabled={current === 0} onClick={() => setPage(current - 1)} className="rounded p-1 hover:bg-slate-100 disabled:opacity-30" aria-label="Previous page">
              <ChevronLeft size={18} />
            </button>
            <span>Page {current + 1} of {pages}</span>
            <button disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="rounded p-1 hover:bg-slate-100 disabled:opacity-30" aria-label="Next page">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </Card>

      <Modal
        open={creating || !!editing}
        onClose={close}
        wide={wide}
        title={editing ? `Edit ${singular}` : `Add ${singular}`}
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={submit}>{editing ? 'Save changes' : `Add ${singular}`}</Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {fields.map((f) => (
            <FormField key={f.name} label={f.label} hint={f.hint} className={f.span === 2 || f.type === 'textarea' || f.type === 'lines' || f.type === 'multiselect' ? 'sm:col-span-2' : ''}>
              <FieldInput field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
            </FormField>
          ))}
          {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${singular}`}
        message={`This will permanently remove this ${singular.toLowerCase()} from the demo data.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

export function FieldInput({ field: f, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  if (f.type === 'textarea') {
    return <textarea className="input min-h-24" value={String(value ?? '')} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
  }
  if (f.type === 'lines') {
    return <textarea className="input min-h-24" value={((value as string[] | undefined) ?? []).join('\n')} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value.split('\n'))} />
  }
  if (f.type === 'select') {
    return (
      <select className="input" value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value)}>
        <option value="">{f.nullable ? 'None' : 'Select…'}</option>
        {f.options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
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
      <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-300 p-2">
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
    )
  }
  return (
    <input
      className="input"
      type={f.type}
      step={f.step}
      placeholder={f.placeholder}
      value={value == null ? '' : String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
