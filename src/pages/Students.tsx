import { Eye, MailPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ResourcePage } from '../components/ResourcePage'
import { Badge, StatusBadge, useToast } from '../components/ui'
import { fmtDate } from '../lib/format'
import { batchName, roleLabel } from '../lib/lookup'
import { db, useCollection } from '../services/store'
import type { Student } from '../types'

export default function Students() {
  const batches = useCollection(db.batches)
  const assignments = useCollection(db.assignments)
  const toast = useToast()
  return (
    <ResourcePage<Student>
      title="Students"
      subtitle="Add students, control account status and app access."
      singular="Student"
      collection={db.students}
      defaults={{ name: '', email: '', phone: '', roles: [], batchId: null, status: 'active', appAccess: true, inviteStatus: 'pending', joinedAt: '2026-10-12' }}
      onCreated={(s) => toast(`Invite email sent to ${s.email} (demo, no real email)`)}
      searchText={(s) => `${s.name} ${s.email} ${s.phone}`}
      filters={[
        { label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }], match: (s, v) => s.status === v },
        { label: 'Role', options: [{ value: 'dispatcher', label: 'Dispatcher' }, { value: 'broker', label: 'Freight Broker' }], match: (s, v) => s.roles.includes(v as 'dispatcher' | 'broker') },
        { label: 'Batch', options: batches.map((b) => ({ value: b.id, label: b.name })), match: (s, v) => s.batchId === v },
      ]}
      columns={[
        {
          header: 'Student',
          sortValue: (s) => s.name,
          render: (s) => (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{s.name[0]}</div>
              <div>
                <Link to={`/students/${s.id}`} className="font-medium text-slate-900 hover:text-brand-600">{s.name}</Link>
                <div className="text-xs text-slate-500">{s.email}</div>
              </div>
            </div>
          ),
        },
        { header: 'Role', render: (s) => (s.roles.length ? <div className="flex flex-wrap gap-1">{s.roles.map((r) => <Badge key={r} tone={r === 'dispatcher' ? 'blue' : 'violet'}>{roleLabel(r)}</Badge>)}</div> : <span className="text-slate-400">Not assigned</span>) },
        { header: 'Batch', sortValue: (s) => batchName(batches, s.batchId), render: (s) => batchName(batches, s.batchId) },
        { header: 'Practices', render: (s) => assignments.filter((a) => a.studentId === s.id).length },
        { header: 'Status', sortValue: (s) => s.status, render: (s) => <StatusBadge value={s.status} /> },
        { header: 'Invite', render: (s) => (s.inviteStatus === 'pending' ? <Badge tone="amber">Invite pending</Badge> : <Badge tone="green">Joined</Badge>) },
        { header: 'App access', render: (s) => (s.appAccess ? <Badge tone="green">Enabled</Badge> : <Badge tone="slate">Blocked</Badge>) },
        { header: 'Joined', sortValue: (s) => s.joinedAt, render: (s) => fmtDate(s.joinedAt) },
      ]}
      extraRowActions={(s) => (
        <>
          {s.inviteStatus === 'pending' && (
            <button
              onClick={() => toast(`Invite email sent again to ${s.email} (demo, no real email)`)}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
              title="Resend invite"
              aria-label="Resend invite"
            >
              <MailPlus size={16} />
            </button>
          )}
          <Link to={`/students/${s.id}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="View student">
            <Eye size={16} />
          </Link>
        </>
      )}
      fields={[
        { name: 'name', label: 'Full name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'text' },
        { name: 'batchId', label: 'Batch', type: 'select', nullable: true, options: batches.map((b) => ({ value: b.id, label: b.name })) },
        { name: 'roles', label: 'Role', type: 'multiselect', options: [{ value: 'dispatcher', label: 'Dispatcher' }, { value: 'broker', label: 'Freight Broker' }], hint: 'A student can have both roles.' },
        { name: 'status', label: 'Account status', type: 'select', required: true, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }] },
        { name: 'appAccess', label: 'App access', type: 'checkbox', placeholder: 'Student can log in to the mobile app' },
      ]}
      validate={(v) => {
        const email = String(v.email ?? '')
        return email.includes('@') ? null : 'Enter a valid email'
      }}
    />
  )
}
