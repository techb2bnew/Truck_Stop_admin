import { Eye, EyeOff, Loader2, Lock, Mail, Truck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import LoginScene from './LoginScene'

const EMAIL_KEY = 'truckstop:last-email'

function rememberedEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

// Only in `npm run dev`: these come from your local .env and are removed from the production build,
// so the password never ships to the public website.
const devEmail = import.meta.env.DEV ? ((import.meta.env.VITE_DEV_LOGIN_EMAIL as string | undefined) ?? '') : ''
const devPassword = import.meta.env.DEV ? ((import.meta.env.VITE_DEV_LOGIN_PASSWORD as string | undefined) ?? '') : ''

export default function Login() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState(() => devEmail || rememberedEmail())
  const [password, setPassword] = useState(devPassword)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)
  if (user) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const r = await login(email, password)
    if (r.ok) {
      try {
        localStorage.setItem(EMAIL_KEY, email.trim())
      } catch {
        /* the email just will not be remembered */
      }
      nav('/')
    } else {
      setBusy(false)
      setError(r.error ?? 'Login failed')
      setShake((n) => n + 1)
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="relative h-80 min-w-0 overflow-hidden lg:h-auto">
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
                <input id="email" name="email" className="input pl-9" type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value.replace(/\s/g, '').toLowerCase())} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="password" name="password" className="input px-9" type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
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

        </form>
      </div>
    </div>
  )
}
