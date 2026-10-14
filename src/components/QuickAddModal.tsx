import { useState } from 'react'
import { useEntityForms } from '../lib/entityForms'
import { FormGrid } from './FormGrid'
import type { QuickKey } from './formTypes'
import { cleanValues, firstMissing } from './formUtils'
import { Button, Modal, useToast } from './ui'

/** A small "add one" popup that opens on top of another form and hands the new item's id back. */
export function QuickAddModal({ kind, onClose, onCreated }: { kind: QuickKey; onClose: () => void; onCreated: (id: string) => void }) {
  const spec = useEntityForms()[kind]
  const toast = useToast()
  const [values, setValues] = useState<Record<string, unknown>>(() => ({ ...spec.defaults }))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const problem = firstMissing(spec.fields, values) ?? spec.validate?.(values) ?? null
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    try {
      const created = await spec.collection.create(cleanValues(spec.fields, values) as never)
      await spec.onCreated?.(created as never)
      toast(`${spec.singular} added`)
      onCreated(created.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Add ${spec.singular.toLowerCase()}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={busy} onClick={submit}>{busy ? 'Adding…' : `Add ${spec.singular.toLowerCase()}`}</Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          // This popup sits inside another form in the React tree, so its submit must not bubble up.
          e.preventDefault()
          e.stopPropagation()
          void submit()
        }}
        className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-4"
      >
        <FormGrid fields={spec.fields} values={values} onChange={(name, value) => setValues((s) => ({ ...s, [name]: value }))} />
        {error && <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
