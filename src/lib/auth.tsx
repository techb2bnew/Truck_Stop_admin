import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { store } from '../services/store'
import { supabase } from './supabase'

// Real login with Supabase Auth. Only profiles with role super_admin or trainer may use the admin panel.
export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'trainer'
}

interface AuthCtx {
  user: AdminUser | null
  /** True while the saved session is being checked on first load. */
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

async function adminFrom(session: Session): Promise<AdminUser | null> {
  const { data } = await supabase.from('profiles').select('id, full_name, email, role').eq('id', session.user.id).maybeSingle()
  if (!data || (data.role !== 'super_admin' && data.role !== 'trainer')) return null
  return { id: data.id, name: data.full_name || data.email, email: data.email, role: data.role }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const apply = useCallback(async (session: Session | null) => {
    if (!session) {
      setUser(null)
      store.reset()
      setLoading(false)
      return
    }
    const admin = await adminFrom(session)
    if (!admin) {
      // A signed-in student (or an account without a profile) must not stay in the admin panel.
      await supabase.auth.signOut()
      setUser(null)
      store.reset()
      setLoading(false)
      return
    }
    setUser(admin)
    setLoading(false)
    void store.load()
  }, [])

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => apply(data.session))
    // Supabase calls can deadlock inside this callback, so the work is pushed to the next tick.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setTimeout(() => void apply(null), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [apply])

  const login: AuthCtx['login'] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error || !data.session) return { ok: false, error: error?.message === 'Invalid login credentials' ? 'Wrong email or password' : (error?.message ?? 'Login failed') }
    const admin = await adminFrom(data.session)
    if (!admin) {
      await supabase.auth.signOut()
      return { ok: false, error: 'This account is not an admin account.' }
    }
    setUser(admin)
    void store.load()
    return { ok: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    store.reset()
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside provider')
  return c
}
