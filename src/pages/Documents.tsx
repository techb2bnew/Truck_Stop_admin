import { FileText } from 'lucide-react'
import { ResourcePage } from '../components/ResourcePage'
import { Badge } from '../components/ui'
import { db } from '../services/store'
import type { DocTemplate } from '../types'

const typeLabel: Record<DocTemplate['type'], string> = { rate_confirmation: 'Rate Confirmation', bol: 'BOL', pod: 'POD', other: 'Other' }

export default function Documents() {
  return (
    <ResourcePage<DocTemplate>
      title="Documents"
      subtitle="Sample documents (Rate Confirmation, BOL, POD) students view, fill and submit."
      singular="Document"
      collection={db.documents}
      defaults={{ name: '', type: 'rate_confirmation', description: '', fileName: '', fields: [] }}
      searchText={(d) => `${d.name} ${d.description}`}
      filters={[{ label: 'Type', options: Object.entries(typeLabel).map(([value, label]) => ({ value, label })), match: (d, v) => d.type === v }]}
      columns={[
        { header: 'Document', sortValue: (d) => d.name, render: (d) => <div className="flex items-center gap-2"><FileText size={18} className="text-brand-600" /><div><div className="font-medium text-slate-900">{d.name}</div><div className="text-xs text-slate-500">{d.fileName}</div></div></div> },
        { header: 'Type', mobile: true, render: (d) => <Badge tone="blue">{typeLabel[d.type]}</Badge> },
        { header: 'Fields student fills', render: (d) => <span className="text-slate-600">{d.fields.join(', ') || '—'}</span> },
      ]}
      fields={[
        { name: 'name', label: 'Document name', type: 'text', required: true },
        { name: 'type', label: 'Type', type: 'select', required: true, options: Object.entries(typeLabel).map(([value, label]) => ({ value, label })) },
        { name: 'fileName', label: 'File name', type: 'text', hint: 'Real file upload comes with Supabase Storage.' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'fields', label: 'Fields the student must fill (one per line)', type: 'lines', placeholder: 'Carrier name\nLoad number' },
      ]}
      beforeDelete={(d) => (db.scenarios.snapshot().some((s) => s.documentIds.includes(d.id)) ? 'This document is used in a scenario' : null)}
    />
  )
}
