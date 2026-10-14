import clsx from 'clsx'
import {
  Bell, Boxes, Briefcase, Building2, ClipboardCheck, ClipboardList, FileText, GraduationCap, Handshake,
  LayoutDashboard, Loader2, LogOut, Menu, MessageSquareText, Package, Scale, Settings, ShieldCheck, TrendingUp, Truck,
  UserCog, Users, UsersRound, X, BarChart3,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { Button } from '../components/ui'
import { useConfirm } from '../components/useConfirm'
import { useAuth } from '../lib/auth'
import { store, useStoreStatus } from '../services/store'

interface Item { to: string; label: string; icon: ReactNode }
const groups: { title: string; items: Item[] }[] = [
  { title: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> }] },
  {
    title: 'People',
    items: [
      { to: '/students', label: 'Students', icon: <Users size={18} /> },
      { to: '/roles', label: 'Role Management', icon: <UserCog size={18} /> },
      { to: '/batches', label: 'Batches', icon: <UsersRound size={18} /> },
    ],
  },
  {
    title: 'Learning',
    items: [
      { to: '/training', label: 'Training Modules', icon: <GraduationCap size={18} /> },
      { to: '/scenarios', label: 'Practice Scenarios', icon: <ClipboardList size={18} /> },
    ],
  },
  {
    title: 'Sample Data',
    items: [
      { to: '/loads', label: 'Load Board', icon: <Package size={18} /> },
      { to: '/rate-insights', label: 'Rate Insights', icon: <TrendingUp size={18} /> },
      { to: '/trucks', label: 'Trucks', icon: <Truck size={18} /> },
      { to: '/drivers', label: 'Drivers', icon: <Briefcase size={18} /> },
      { to: '/brokers', label: 'Brokers', icon: <Handshake size={18} /> },
      { to: '/shippers', label: 'Shippers', icon: <Building2 size={18} /> },
      { to: '/negotiation', label: 'Negotiation Rules', icon: <MessageSquareText size={18} /> },
      { to: '/documents', label: 'Documents', icon: <FileText size={18} /> },
    ],
  },
  {
    title: 'Practice',
    items: [
      { to: '/assignments', label: 'Assignments', icon: <Boxes size={18} /> },
      { to: '/scoring', label: 'Scoring Rules', icon: <Scale size={18} /> },
      { to: '/reviews', label: 'Review & Retry', icon: <ClipboardCheck size={18} /> },
      { to: '/reports', label: 'Reports', icon: <BarChart3 size={18} /> },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
      { to: '/settings', label: 'Settings', icon: <Settings size={18} /> },
    ],
  },
]

export default function AppLayout() {
  const { user, loading, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const { ask, dialog } = useConfirm()
  const data = useStoreStatus()
  if (loading) return <Centered title="Checking your session…" spinner />
  if (!user) return <Navigate to="/login" replace />

  const nav = (
    <nav className="flex h-full flex-col bg-ink-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white"><Truck size={20} /></div>
        <div>
          <div className="text-base font-bold leading-tight text-white">Truck Stop</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400">Admin Panel</div>
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.title}</div>
            {g.items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition',
                    isActive ? 'bg-brand-500/15 font-medium text-brand-300' : 'hover:bg-white/5 hover:text-white',
                  )
                }
              >
                {it.icon}
                {it.label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">{user.name[0]}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{user.name}</div>
            <div className="flex items-center gap-1 text-xs text-slate-400"><ShieldCheck size={12} /> {user.role === 'super_admin' ? 'Super Admin' : 'Trainer'}</div>
          </div>
          <button onClick={() => ask({ title: 'Log out?', message: 'You will need to sign in again to use the admin panel.', confirmLabel: 'Log out', onConfirm: logout })} className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Log out" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  )

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64">{nav}</div>
          <button className="absolute right-3 top-3 z-50 rounded bg-white p-1.5" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2.5 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <span className="font-semibold text-slate-900">Truck Stop Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {data.phase === 'error' ? (
              <Centered
                title="Could not load the data"
                text={`${data.message}. If a table is missing, run supabase/schema.sql in the Supabase SQL Editor.`}
                action={<Button onClick={() => void store.retry()}>Try again</Button>}
              />
            ) : data.phase !== 'ready' ? (
              <Centered title="Loading your data…" spinner />
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
      {dialog}
    </div>
  )
}



function Centered({ title, text, spinner, action }: { title: string; text?: string; spinner?: boolean; action?: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      {spinner && <Loader2 className="animate-spin text-brand-500" size={28} />}
      <div className="text-base font-semibold text-slate-800">{title}</div>
      {text && <p className="max-w-md text-sm text-slate-500">{text}</p>}
      {action}
    </div>
  )
}
