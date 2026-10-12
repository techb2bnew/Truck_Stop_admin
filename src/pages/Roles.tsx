import { useState } from 'react'
import { Button, Card, PageHeader, StatusBadge, useToast } from '../components/ui'
import { batchName } from '../lib/lookup'
import { db, useCollection } from '../services/store'
import type { StudentRole } from '../types'

const roles: { value: StudentRole; label: string }[] = [
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'broker', label: 'Freight Broker' },
]

export default function Roles() {
  const students = useCollection(db.students)
  const batches = useCollection(db.batches)
  const toast = useToast()
  const [bulkBatch, setBulkBatch] = useState('')
  const [bulkRole, setBulkRole] = useState<StudentRole>('dispatcher')

  const toggle = async (id: string, current: StudentRole[], role: StudentRole) => {
    const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role]
    await db.students.update(id, { roles: next })
    toast('Role updated')
  }

  const applyBulk = async () => {
    const targets = students.filter((s) => s.batchId === bulkBatch)
    for (const s of targets) {
      if (!s.roles.includes(bulkRole)) await db.students.update(s.id, { roles: [...s.roles, bulkRole] })
    }
    toast(`${bulkRole === 'dispatcher' ? 'Dispatcher' : 'Freight Broker'} role added for ${targets.length} students`)
  }

  const unassigned = students.filter((s) => s.roles.length === 0).length

  return (
    <div>
      <PageHeader title="Role Management" subtitle="Choose whether each student practises as a Dispatcher, a Freight Broker or both. The app screens follow the role." />

      <Card className="mb-3 p-2.5 sm:mb-4 sm:p-4">
        <div className="flex items-end gap-2 sm:flex-wrap sm:gap-3">
          <div className="min-w-0 flex-1 sm:flex-none">
            <label className="label hidden sm:block">Batch</label>
            <select className="input px-2 text-[13px] sm:w-56 sm:px-3 sm:text-sm" aria-label="Batch" value={bulkBatch} onChange={(e) => setBulkBatch(e.target.value)}>
              <option value="">Select batch…</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="w-28 shrink-0 sm:w-auto">
            <label className="label hidden sm:block">Add role</label>
            <select className="input px-2 text-[13px] sm:w-48 sm:px-3 sm:text-sm" aria-label="Role to add" value={bulkRole} onChange={(e) => setBulkRole(e.target.value as StudentRole)}>
              {roles.map((r) => <option key={r.value} value={r.value}>{r.value === 'broker' ? 'Broker' : r.label}</option>)}
            </select>
          </div>
          <Button className="shrink-0 px-3" disabled={!bulkBatch} onClick={applyBulk}>
            Apply<span className="hidden sm:inline">&nbsp;to whole batch</span>
          </Button>
          {unassigned > 0 && <span className="hidden text-sm text-amber-700 sm:ml-auto sm:block">{unassigned} student(s) have no role yet</span>}
        </div>
        {unassigned > 0 && <p className="mt-1.5 text-xs text-amber-700 sm:hidden">{unassigned} student(s) have no role yet</p>}
      </Card>

      <Card className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Student</th>
              <th className="px-4 py-2.5 font-semibold">Batch</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              {roles.map((r) => <th key={r.value} className="px-4 py-2.5 text-center font-semibold">{r.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3"><div className="font-medium text-slate-900">{s.name}</div><div className="text-xs text-slate-500">{s.email}</div></td>
                <td className="px-4 py-3 text-slate-600">{batchName(batches, s.batchId)}</td>
                <td className="px-4 py-3"><StatusBadge value={s.status} /></td>
                {roles.map((r) => (
                  <td key={r.value} className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-500"
                      checked={s.roles.includes(r.value)}
                      onChange={() => toggle(s.id, s.roles, r.value)}
                      aria-label={`${r.label} for ${s.name}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="divide-y divide-slate-100 md:hidden">
        {students.map((s) => (
          <div key={s.id} className="flex items-center gap-2 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-900">{s.name}</div>
              <div className="truncate text-xs text-slate-500">{batchName(batches, s.batchId)}</div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              {roles.map((r) => {
                const on = s.roles.includes(r.value)
                return (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs ${on ? 'border-brand-500 bg-brand-50 font-medium text-brand-700' : 'border-slate-200 text-slate-500'}`}
                  >
                    <input type="checkbox" className="h-3.5 w-3.5 accent-brand-500" checked={on} onChange={() => toggle(s.id, s.roles, r.value)} />
                    {r.value === 'dispatcher' ? 'Dispatcher' : 'Broker'}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
