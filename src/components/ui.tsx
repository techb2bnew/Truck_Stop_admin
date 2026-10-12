import clsx from 'clsx'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import {
  createContext, useCallback, useContext, useEffect, useState,
  type ButtonHTMLAttributes, type ReactNode,
} from 'react'

/* ---------- Button ---------- */
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
export function Button({
  variant = 'primary', size = 'md', className, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
        variant === 'primary' && 'bg-brand-500 text-white shadow-sm hover:bg-brand-600',
        variant === 'secondary' && 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
        className,
      )}
    />
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

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      {hint && <div className="mt-1 text-sm text-slate-500">{hint}</div>}
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
export function Modal({
  open, onClose, title, children, footer, wide,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    // On phones the popup is a bottom sheet: easy to reach with a thumb, footer buttons always visible.
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-start sm:overflow-y-auto sm:p-8" onMouseDown={onClose}>
      <div
        className={clsx(
          'ts-sheet flex max-h-[90dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-none sm:rounded-xl',
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
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:flex-none sm:overflow-visible sm:px-5 sm:py-4">{children}</div>
        {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5 sm:rounded-b-xl sm:px-5 sm:py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Delete', onConfirm, onCancel,
}: { open: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={20} />
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </Modal>
  )
}

/* ---------- Form bits ---------- */
export function FormField({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
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
