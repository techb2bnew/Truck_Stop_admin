import { Eye, EyeOff, Loader2, Lock, Mail, Truck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { DEMO_EMAIL, DEMO_PASSWORD, useAuth } from '../lib/auth'
import LoginScene from './LoginScene'

export default function Login() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)
  if (user && !busy) return <Navigate to="/" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    // Short delay so the button state is visible, like a real request.
    setTimeout(() => {
      const r = login(email, password)
      if (r.ok) {
        nav('/')
      } else {
        setBusy(false)
        setError(r.error ?? 'Login failed')
        setShake((n) => n + 1)
      }
    }, 700)
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.15fr_1fr]">
      <div className="relative h-80 lg:h-auto">
        <LoginScene />
        <div className="absolute inset-x-0 top-0 p-6 text-white sm:p-10 lg:p-12">
          <div className="ts-rise flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 shadow-lg"><Truck size={24} /></div>
            <span className="text-xl font-bold">Truck Stop</span>
          </div>
          <h2 className="ts-rise mt-5 max-w-lg text-xl font-bold leading-tight sm:text-3xl lg:mt-10 lg:text-4xl" style={{ animationDelay: '0.15s' }}>
            Train dispatchers and freight brokers with real-life practice.
          </h2>
          <p className="ts-rise mt-3 hidden max-w-md text-slate-300 lg:block" style={{ animationDelay: '0.3s' }}>
            Create scenarios, assign practice, review attempts and track every student from one place.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white p-6 sm:p-10">
        <form onSubmit={submit} className="ts-rise w-full max-w-sm" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to the admin panel to manage students and practice.</p>

          <div key={shake} className={`mt-8 space-y-4 ${shake ? 'ts-shake' : ''}`}>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="email" className="input pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="password" className="input px-9" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.99] disabled:opacity-80"
            >
              {busy ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign in'}
            </button>
          </div>

          <p className="mt-8 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
            Demo mode: the login is pre-filled. The admin uses one fixed account, set up in Supabase later.
          </p>
        </form>
      </div>
    </div>
  )
}
