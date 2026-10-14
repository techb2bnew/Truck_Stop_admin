import { Send } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, EmptyState, FormField, PageHeader, useToast } from '../components/ui'
import { TODAY, fmtDateTime } from '../lib/format'
import { batchName, studentName } from '../lib/lookup'
import { useConfirm } from '../components/useConfirm'
import { db, useCollection } from '../services/store'
import type { AppNotification } from '../types'

const kinds: { value: AppNotification['kind']; label: string }[] = [
  { value: 'assignment', label: 'New assignment' },
  { value: 'deadline', label: 'Deadline reminder' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'announcement', label: 'Announcement' },
]
const tone = { assignment: 'blue', deadline: 'amber', feedback: 'green', announcement: 'violet' } as const

export default function Notifications() {
  const list = useCollection(db.notifications)
  const students = useCollection(db.students)
  const batches = useCollection(db.batches)
  const toast = useToast()
  const [kind, setKind] = useState<AppNotification['kind']>('announcement')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<AppNotification['target']>('all')
  const [targetId, setTargetId] = useState('')

  const { ask, dialog } = useConfirm()
  const send = () => {
    if (!title.trim() || !body.trim()) return toast('Add a title and a message')
    if (target !== 'all' && !targetId) return toast(`Choose a ${target}`)
    const recipient = target === 'all' ? 'all students' : target === 'batch' ? batchName(batches, targetId) : studentName(students, targetId)
    ask({
      title: 'Send this notification?',
      message: `"${title.trim()}" will be sent to ${recipient}. It cannot be taken back.`,
      confirmLabel: 'Send',
      onConfirm: deliver,
    })
  }
  const deliver = async () => {
    await db.notifications.create({ kind, title: title.trim(), body: body.trim(), target, targetId: target === 'all' ? null : targetId, createdAt: `${TODAY}T11:00:00` })
    setTitle('')
    setBody('')
    toast('Notification sent')
  }

  const who = (n: AppNotification) => (n.target === 'all' ? 'All students' : n.target === 'batch' ? batchName(batches, n.targetId) : studentName(students, n.targetId ?? ''))

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Send announcements and see what was sent for assignments, deadlines and feedback." />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="space-y-4 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Send a notification</h2>
          <FormField label="Type"><select className="input" value={kind} onChange={(e) => setKind(e.target.value as AppNotification['kind'])}>{kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select></FormField>
          <FormField label="Send to">
            <div className="flex gap-2">
              <select className="input" value={target} onChange={(e) => { setTarget(e.target.value as AppNotification['target']); setTargetId('') }}>
                <option value="all">All students</option><option value="batch">A batch</option><option value="student">One student</option>
              </select>
              {target === 'batch' && <select className="input" value={targetId} onChange={(e) => setTargetId(e.target.value)}><option value="">Select…</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
              {target === 'student' && <select className="input" value={targetId} onChange={(e) => setTargetId(e.target.value)}><option value="">Select…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
            </div>
          </FormField>
          <FormField required label="Title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></FormField>
          <FormField required label="Message"><textarea className="input min-h-24" value={body} onChange={(e) => setBody(e.target.value)} /></FormField>
          <Button onClick={send} className="w-full"><Send size={16} /> Send</Button>
          <p className="text-xs text-slate-400">Push delivery to the phone app is connected later with Supabase and FCM.</p>
        </Card>

        <Card className="lg:col-span-3">
          <div className="border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">History</h2></div>
          {list.length === 0 ? <EmptyState title="No notifications yet" /> : (
            <ul className="divide-y divide-slate-100">
              {[...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><Badge tone={tone[n.kind]}>{n.kind}</Badge><span className="text-sm font-medium text-slate-900">{n.title}</span></div>
                    <span className="text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">To: {who(n)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {dialog}
    </div>
  )
}
