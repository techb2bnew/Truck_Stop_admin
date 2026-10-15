import { Check, Copy, Eye, KeyRound, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ResourcePage } from '../components/ResourcePage'
import { Badge, Button, ConfirmDialog, Modal, StatusBadge, useToast } from '../components/ui'
import { TODAY, fmtDate } from '../lib/format'
import { batchName, roleLabel } from '../lib/lookup'
import { duplicateMessage } from '../lib/duplicates'
import { db, emailStudentCredentials, resetStudentPassword, takeStudentPassword, useCollection } from '../services/store'
import type { Student } from '../types'

interface Credentials { title: string; name: string; email: string; password: string; emailError?: string }

export default function Students() {
  const batches = useCollection(db.batches)
  const assignments = useCollection(db.assignments)
  const students = useCollection(db.students)
  const toast = useToast()
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [resetting, setResetting] = useState<Student | null>(null)

  const [resetBusy, setResetBusy] = useState(false)

  // The login details go to the student by email. The popup only appears when the email could not be sent,
  // so the password is never lost.
  const deliver = async (title: string, name: string, email: string, password: string) => {
    try {
      await emailStudentCredentials(email, password)
      toast(`${title}. Login details emailed to ${email}`)
    } catch (e) {
      setCredentials({ title, name, email, password, emailError: e instanceof Error ? e.message : 'The email could not be sent' })
    }
  }

  const confirmReset = async () => {
    const student = resetting
    if (!student) return
    setResetBusy(true)
    try {
      const res = await resetStudentPassword(student.id)
      setResetting(null)
      await deliver('New password created', student.name, res.email || student.email, res.password)
    } catch (e) {
      setResetting(null)
      toast(e instanceof Error ? e.message : 'Could not create a new password')
    } finally {
      setResetBusy(false)
    }
  }

  return (
    <>
    <ResourcePage<Student>
      title="Students"
      subtitle="Add students, control account status and app access."
      singular="Student"
      collection={db.students}
      defaults={{ name: '', email: '', phone: '', roles: [], batchId: null, status: 'active', appAccess: true, inviteStatus: 'pending', joinedAt: TODAY }}
      onCreated={async (s) => {
        const password = takeStudentPassword()
        if (password) await deliver('Student created', s.name, s.email, password)
        else toast('Student created')
        return false
      }}
      emptyHint="Add a student. A login password is created and emailed to them."
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
        { header: 'Role', mobile: true, render: (s) => (s.roles.length ? <div className="flex flex-wrap gap-1">{s.roles.map((r) => <Badge key={r} tone={r === 'dispatcher' ? 'blue' : 'violet'}>{roleLabel(r)}</Badge>)}</div> : <span className="text-slate-400">Not assigned</span>) },
        { header: 'Batch', sortValue: (s) => batchName(batches, s.batchId), render: (s) => batchName(batches, s.batchId) },
        { header: 'Practices', render: (s) => assignments.filter((a) => a.studentId === s.id).length },
        { header: 'Status', mobile: true, sortValue: (s) => s.status, render: (s) => <StatusBadge value={s.status} /> },
        { header: 'Login', render: (s) => (s.inviteStatus === 'pending' ? <Badge tone="amber">Not logged in yet</Badge> : <Badge tone="green">Logged in</Badge>) },
        { header: 'App access', render: (s) => (s.appAccess ? <Badge tone="green">Enabled</Badge> : <Badge tone="slate">Blocked</Badge>) },
        { header: 'Joined', sortValue: (s) => s.joinedAt, render: (s) => fmtDate(s.joinedAt) },
      ]}
      extraRowActions={(s) => (
        <>
          <button
            onClick={() => setResetting(s)}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
            title="Reset password"
            aria-label="Reset password"
          >
            <KeyRound size={16} />
          </button>
          <Link to={`/students/${s.id}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="View student">
            <Eye size={16} />
          </Link>
        </>
      )}
      fields={[
        { name: 'name', label: 'Full name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true, hint: 'A password is created automatically and emailed to the student.' },
        { name: 'phone', label: 'Phone', type: 'phone' },
        { name: 'batchId', label: 'Batch', type: 'select', nullable: true, options: batches.map((b) => ({ value: b.id, label: b.name })), addNew: { kind: 'batch', label: 'Add new batch' } },
        { name: 'roles', label: 'Role', type: 'multiselect', options: [{ value: 'dispatcher', label: 'Dispatcher' }, { value: 'broker', label: 'Freight Broker' }], hint: 'A student can have both roles.' },
        { name: 'status', label: 'Account status', type: 'select', required: true, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }] },
        { name: 'appAccess', label: 'App access', type: 'checkbox', placeholder: 'Student can log in to the mobile app' },
      ]}
      validate={(v) => {
        const email = String(v.email ?? '')
        if (!email.includes('@')) return 'Enter a valid email'
        return duplicateMessage(students, v, 'student', [{ field: 'email', label: 'email' }, { field: 'phone', label: 'phone number', kind: 'phone' }])
      }}
    />

    {credentials && <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />}

    <ConfirmDialog
      open={!!resetting}
      title="Reset password"
      message={`Create a new password for ${resetting?.name ?? 'this student'}? The old password stops working at once.`}
      confirmLabel="Reset password"
      busy={resetBusy}
      onConfirm={confirmReset}
      onCancel={() => setResetting(null)}
    />
    </>
  )
}

function CredentialsModal({ credentials, onClose }: { credentials: Credentials; onClose: () => void }) {
  const [copied, setCopied] = useState<'email' | 'password' | 'all' | null>(null)
  const [mail, setMail] = useState<{ state: 'idle' | 'sending' | 'sent' | 'failed'; message?: string }>(credentials.emailError ? { state: 'failed', message: credentials.emailError } : { state: 'idle' })

  const sendMail = async () => {
    setMail({ state: 'sending' })
    try {
      await emailStudentCredentials(credentials.email, credentials.password)
      setMail({ state: 'sent' })
    } catch (e) {
      setMail({ state: 'failed', message: e instanceof Error ? e.message : 'The email could not be sent' })
    }
  }

  const copy = async (kind: 'email' | 'password' | 'all') => {
    const text =
      kind === 'email' ? credentials.email
      : kind === 'password' ? credentials.password
      : `Truck Stop login\nEmail: ${credentials.email}\nPassword: ${credentials.password}`
    await navigator.clipboard.writeText(text)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={credentials.title}
      footer={
        <>
          <Button variant="secondary" loading={mail.state === 'sending'} onClick={sendMail}>{mail.state === 'sending' ? 'Sending…' : mail.state === 'sent' ? <><Check size={14} /> Emailed</> : <><Mail size={14} /> {mail.state === 'failed' ? 'Try email again' : 'Email to student'}</>}</Button>
          <Button variant="secondary" onClick={() => copy('all')}>{copied === 'all' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy both</>}</Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        The email to <b>{credentials.name}</b> could not be sent, so give them these login details yourself. They use them in the mobile app.
      </p>
      <div className="space-y-3">
        <CopyRow label="Email" value={credentials.email} copied={copied === 'email'} onCopy={() => copy('email')} />
        <CopyRow label="Password" value={credentials.password} copied={copied === 'password'} onCopy={() => copy('password')} />
      </div>
      {mail.state === 'failed' && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{mail.message}</p>}
      {mail.state === 'sent' && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Sent to {credentials.email}. Ask them to check Spam too.</p>}
      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        This password is shown only now and is not saved anywhere. If it is lost, use the key icon on the student to make a new one.
      </p>
    </Modal>
  )
}

function CopyRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 select-all break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900">{value}</div>
        <Button variant="secondary" size="sm" onClick={onCopy} aria-label={`Copy ${label}`}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </Button>
      </div>
    </div>
  )
}
