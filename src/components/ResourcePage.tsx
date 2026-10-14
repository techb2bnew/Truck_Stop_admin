import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useCollection, type Collection } from '../services/store'
import { FormGrid } from './FormGrid'
import type { FieldDef, Option } from './formTypes'
import { cleanValues, firstMissing } from './formUtils'
import { Button, Card, ConfirmDialog, EmptyState, Modal, PageHeader, useToast } from './ui'

export type { FieldDef, Option }

export interface Column<T> {
  header: string
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  className?: string
  /** Show this column in the compact mobile row (first column is always shown). */
  mobile?: boolean
  /** Small prefix shown before the value on mobile, e.g. "Students". */
  mobileLabel?: string
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
  /** Shown when there are no records at all. */
  emptyHint?: string
  validate?: (values: Record<string, unknown>) => string | null
  /** Runs after a row is created. Return false when it shows its own message, so the default toast is skipped. */
  onCreated?: (row: T) => void | boolean | Promise<void | boolean>
  beforeDelete?: (row: T) => string | null
  wide?: boolean
  pageSize?: number
}

export function ResourcePage<T extends { id: string }>({
  title, subtitle, singular, collection, columns, fields, defaults, searchText, filters = [],
  extraRowActions, headerActions, rows, emptyHint, validate, onCreated, beforeDelete, wide, pageSize = 10,
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
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

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

  const flagged = columns.slice(1).filter((c) => c.mobile)
  const mobileColumns = flagged.length ? flagged : columns.slice(1, 3)

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages - 1)
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize)

  const clearFilters = () => {
    setQuery('')
    setFilterValues(filters.map(() => ''))
    setPage(0)
  }

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
    const missing = firstMissing(fields, values)
    if (missing) {
      setError(missing)
      return
    }
    const custom = validate?.(values)
    if (custom) {
      setError(custom)
      return
    }
    const clean = cleanValues(fields, values)
    setSaving(true)
    try {
      if (editing) {
        await collection.update(editing.id, clean as Partial<T>)
        toast(`${singular} updated`)
      } else {
        const created = await collection.create(clean as Omit<T, 'id'>)
        const own = onCreated ? await onCreated(created) : undefined
        if (own !== false) toast(`${singular} added`)
      }
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setRemoving(true)
    try {
      await collection.remove(deleting.id)
      toast(`${singular} deleted`)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete')
    } finally {
      setRemoving(false)
    }
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

      {source.length === 0 ? (
        <Card>
          <EmptyState
            title={`No ${title.toLowerCase()} yet`}
            hint={emptyHint ?? `Add your first ${singular.toLowerCase()} to get started.`}
            action={<Button onClick={openCreate}><Plus size={16} /> Add {singular}</Button>}
          />
        </Card>
      ) : (
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
          {visible.length === 0 && <EmptyState title="Nothing matches" hint="Try a different search or clear the filters." action={<Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>} />}
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {visible.map((row) => (
            <div key={row.id} className="flex items-center gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm">{columns[0].render(row)}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  {mobileColumns.map((c) => (
                    <span key={c.header} className="min-w-0">
                      {c.mobileLabel && <span className="mr-1 text-slate-400">{c.mobileLabel}</span>}
                      {c.render(row)}
                    </span>
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
          {visible.length === 0 && <EmptyState title="Nothing matches" hint="Try a different search or clear the filters." action={<Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>} />}
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
      )}

      <Modal
        open={creating || !!editing}
        onClose={close}
        wide={wide}
        title={editing ? `Edit ${singular}` : `Add ${singular}`}
        footer={
          <>
            <Button variant="secondary" disabled={saving} onClick={close}>Cancel</Button>
            <Button loading={saving} onClick={submit}>{editing ? 'Save changes' : `Add ${singular}`}</Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-4"
        >
          <FormGrid fields={fields} values={values} onChange={set} onLeave={close} />
          {error && <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${singular}`}
        message={`This will permanently remove this ${singular.toLowerCase()}.`}
        busy={removing}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
