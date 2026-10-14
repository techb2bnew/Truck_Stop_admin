import { useCallback, useState } from 'react'
import { ConfirmDialog } from './ui'

interface Ask {
  title: string
  message: string
  confirmLabel: string
  /** A destructive action gets the red button. Default: false. */
  danger?: boolean
  /** May be async: the popup stays open with a spinner on its button until it finishes. */
  onConfirm: () => void | Promise<unknown>
}

/**
 * Important actions ask first. Call `ask({...})` when the user clicks, and render `dialog` once.
 * The action only runs after they confirm.
 */
export function useConfirm() {
  const [pending, setPending] = useState<Ask | null>(null)
  const [busy, setBusy] = useState(false)
  const ask = useCallback((config: Ask) => setPending(config), [])

  const confirm = async () => {
    const action = pending
    if (!action || busy) return
    setBusy(true)
    try {
      await action.onConfirm()
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title={pending?.title ?? ''}
      message={pending?.message ?? ''}
      confirmLabel={pending?.confirmLabel ?? ''}
      danger={pending?.danger ?? false}
      busy={busy}
      onConfirm={confirm}
      onCancel={() => setPending(null)}
    />
  )
  return { ask, dialog }
}
