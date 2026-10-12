import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ResourcePage } from '../components/ResourcePage'
import { StatusBadge, Badge } from '../components/ui'
import { roleLabel } from '../lib/lookup'
import { db, useCollection } from '../services/store'
import type { Course } from '../types'

export default function Training() {
  const lessons = useCollection(db.lessons)
  return (
    <ResourcePage<Course>
      title="Training Modules"
      subtitle="Courses and lessons students see under My Training."
      singular="Course"
      collection={db.courses}
      defaults={{ title: '', description: '', audience: 'both', status: 'draft' }}
      searchText={(c) => `${c.title} ${c.description}`}
      columns={[
        { header: 'Course', sortValue: (c) => c.title, render: (c) => <div><Link to={`/training/${c.id}`} className="font-medium text-slate-900 hover:text-brand-600">{c.title}</Link><div className="text-xs text-slate-500">{c.description}</div></div> },
        { header: 'For', mobile: true, render: (c) => <Badge tone="blue">{roleLabel(c.audience)}</Badge> },
        { header: 'Lessons', mobile: true, mobileLabel: 'Lessons', render: (c) => lessons.filter((l) => l.courseId === c.id).length },
        { header: 'Status', mobile: true, render: (c) => <StatusBadge value={c.status} /> },
      ]}
      extraRowActions={(c) => (
        <Link to={`/training/${c.id}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600" title="Manage lessons" aria-label="Manage lessons"><BookOpen size={16} /></Link>
      )}
      fields={[
        { name: 'title', label: 'Course title', type: 'text', required: true, span: 2 },
        { name: 'audience', label: 'For role', type: 'select', required: true, options: [{ value: 'dispatcher', label: 'Dispatcher' }, { value: 'broker', label: 'Freight Broker' }, { value: 'both', label: 'Both' }] },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }] },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      beforeDelete={(c) => (lessons.some((l) => l.courseId === c.id) ? 'Delete the lessons of this course first' : null)}
    />
  )
}
