import clsx from 'clsx'
import { AlertTriangle, CheckCircle2, HelpCircle, Inbox, Loader2, X } from 'lucide-react'
import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
  type ButtonHTMLAttributes, type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

/* ---------- Button ---------- */
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
/**
 * A button. While its action runs it shows a spinner and cannot be pressed again:
 * pass `loading`, or just let `onClick` return a promise (an async handler) and it waits for it.
 */
export function Button({
  variant = 'primary', size = 'md', className, loading = false, disabled, children, onClick, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; loading?: boolean }) {
  const [running, setRunning] = useState(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])
  const busy = loading || running
  const handleClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick'] = (e) => {
    const result = onClick?.(e) as unknown
    if (result instanceof Promise) {
      setRunning(true)
      result.finally(() => { if (alive.current) setRunning(false) }).catch(() => undefined)
    }
  }
  return (
    <button
      {...props}
      onClick={onClick ? handleClick : undefined}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
        variant === 'primary' && 'bg-brand-500 text-white shadow-sm hover:bg-brand-600',
        variant === 'secondary' && 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
        className,
      )}
    >
      {busy && <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" />}
      {children}
    </button>
  )
}

/* ---------- Card / Page ---------- */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2 sm:mb-6 sm:gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-slate-500 sm:mt-1 sm:text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{label}</span>
        {icon && <span className="ml-1 hidden shrink-0 text-brand-600 sm:block">{icon}</span>}
      </div>
      <div className="mt-1 text-xl font-bold text-slate-900 sm:mt-2 sm:text-2xl">{value}</div>
      {hint && <div className="mt-0.5 truncate text-[11px] text-slate-500 sm:mt-1 sm:text-xs">{hint}</div>}
    </Card>
  )
}

export function EmptyState({ title, hint, icon, action }: { title: string; hint?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center sm:py-14">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {icon ?? <Inbox size={22} />}
      </div>
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      {hint && <div className="mt-1 max-w-sm text-sm text-slate-500">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ---------- Badge ---------- */
const tones = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
} as const
export type Tone = keyof typeof tones

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone])}>
      {children}
    </span>
  )
}

const statusTone: Record<string, Tone> = {
  active: 'green', published: 'green', available: 'green', approved: 'green', reviewed: 'green', High: 'green', easy: 'green', A: 'green',
  inactive: 'slate', draft: 'slate', off_duty: 'slate', assigned: 'blue', Medium: 'amber', medium: 'amber', B: 'blue',
  in_progress: 'amber', in_use: 'amber', on_trip: 'amber', pending_review: 'amber', submitted: 'violet', C: 'amber',
  suspended: 'red', maintenance: 'red', retry: 'red', Low: 'red', hard: 'red', D: 'red',
}
export function StatusBadge({ value }: { value: string }) {
  return <Badge tone={statusTone[value] ?? 'slate'}>{value.replace(/_/g, ' ')}</Badge>
}

/* ---------- Modal ---------- */
// Popups can open on top of each other, so only the top one answers Escape.
const modalStack: symbol[] = []

export function Modal({
  open, onClose, title, children, footer, wide, centered,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean; centered?: boolean }) {
  const id = useRef(Symbol('modal'))
  useEffect(() => {
    if (!open) return
    const mine = id.current
    modalStack.push(mine)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && modalStack[modalStack.length - 1] === mine && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      const i = modalStack.indexOf(mine)
      if (i !== -1) modalStack.splice(i, 1)
    }
  }, [open, onClose])
  if (!open) return null
  // Confirmation questions: a small centred card on every screen size, phones included.
  if (centered) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={onClose}>
        <div
          className="ts-sheet w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
        >
          {children}
          {footer && <div className="mt-6 flex gap-3">{footer}</div>}
        </div>
      </div>,
      document.body,
    )
  }
  // Rendered on the page body: a popup opened from inside a form is never nested in that form's HTML.
  return createPortal(
    // On phones the popup is a bottom sheet: easy to reach with a thumb, footer buttons always visible.
    // On a desktop it sits in the middle of the screen, and a tall one scrolls inside so its buttons stay in view.
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-8" onMouseDown={onClose}>
      <div
        className={clsx(
          'ts-sheet flex max-h-[90dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-300 sm:hidden" />
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5 sm:px-5 sm:py-3.5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">{children}</div>
        {footer && <div className="flex shrink-0 justify-end gap-2 rounded-b-xl border-t border-slate-200 bg-slate-50 px-4 py-2.5 sm:px-5 sm:py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Delete', danger = true, busy = false, onConfirm, onCancel,
}: { open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal
      open={open}
      centered
      onClose={busy ? () => undefined : onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" className="flex-1 py-2.5" disabled={busy} onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} className="flex-1 py-2.5" loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div className={clsx('mx-auto flex h-14 w-14 items-center justify-center rounded-full', danger ? 'bg-red-50 text-red-500' : 'bg-brand-50 text-brand-600')}>
        {danger ? <AlertTriangle size={28} /> : <HelpCircle size={28} />}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{message}</p>
    </Modal>
  )
}

/* ---------- Form bits ---------- */
export function FormField({ label, hint, children, className, required }: { label: string; hint?: string; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <div className={className}>
      <label className="label">{label}{required && <span className="ml-0.5 text-red-500" aria-hidden="true"> *</span>}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export function Tabs<T extends string>({
  tabs, value, onChange,
}: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mb-4 flex gap-1 border-b border-slate-200">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={clsx(
            '-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition',
            value === t.value ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700',
          )}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* ---------- Toasts ---------- */
const ToastCtx = createContext<(msg: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msgs, setMsgs] = useState<{ id: number; text: string }[]>([])
  const push = useCallback((text: string) => {
    const id = Date.now() + Math.random()
    setMsgs((m) => [...m, { id, text }])
    setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 2800)
  }, [])
  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => push(e.reason instanceof Error ? e.reason.message : 'Something went wrong')
    window.addEventListener('unhandledrejection', onRejection)
    return () => window.removeEventListener('unhandledrejection', onRejection)
  }, [push])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {msgs.map((m) => (
          <div key={m.id} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {m.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
