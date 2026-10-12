import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ResourcePage } from '../components/ResourcePage'
import { Badge, EmptyState } from '../components/ui'
import { db, useCollection } from '../services/store'
import type { Lesson } from '../types'

export default function CourseDetail() {
  const { courseId } = useParams()
  const courses = useCollection(db.courses)
  const lessons = useCollection(db.lessons)
  const course = courses.find((c) => c.id === courseId)
  if (!course) return <EmptyState title="Course not found" />
  const mine = lessons.filter((l) => l.courseId === course.id).sort((a, b) => a.order - b.order)

  return (
    <div>
      <Link to="/training" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={16} /> Back to courses</Link>
      <ResourcePage<Lesson>
        title={`${course.title}: lessons`}
        subtitle={course.description}
        singular="Lesson"
        collection={db.lessons}
        rows={mine}
        defaults={{ courseId: course.id, title: '', type: 'video', durationMin: 10, order: mine.length + 1, content: '' }}
        searchText={(l) => `${l.title} ${l.content}`}
        columns={[
          { header: 'Lesson', render: (l) => <div><div className="font-medium text-slate-900">{l.title}</div><div className="text-xs text-slate-500">{l.content}</div></div> },
          { header: 'Type', mobile: true, render: (l) => <Badge tone={l.type === 'video' ? 'violet' : l.type === 'pdf' ? 'amber' : 'slate'}>{l.type}</Badge> },
          { header: 'Duration', mobile: true, render: (l) => `${l.durationMin} min` },
          { header: 'Order', mobile: true, mobileLabel: 'Order', sortValue: (l) => l.order, render: (l) => l.order },
        ]}
        fields={[
          { name: 'title', label: 'Lesson title', type: 'text', required: true, span: 2 },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'video', label: 'Video' }, { value: 'pdf', label: 'PDF' }, { value: 'text', label: 'Text' }] },
          { name: 'durationMin', label: 'Duration (minutes)', type: 'number', required: true },
          { name: 'order', label: 'Order', type: 'number', required: true },
          { name: 'content', label: 'Content / summary', type: 'textarea', hint: 'File and video upload comes with Supabase Storage.' },
        ]}
      />
    </div>
  )
}
