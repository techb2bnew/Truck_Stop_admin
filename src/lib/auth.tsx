import { createContext, useContext, useState, type ReactNode } from 'react'

// Fake auth for the mock phase. Replaced by Supabase Auth later.
export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'trainer'
}

interface AuthCtx {
  user: AdminUser | null
  login: (email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)
const KEY = 'truckstop:auth'

export const DEMO_EMAIL = 'admin@truckstop.com'
export const DEMO_PASSWORD = 'admin123'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as AdminUser) : null
    } catch {
      return null
    }
  })

  const login: AuthCtx['login'] = (email, password) => {
    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const u: AdminUser = { id: 'tr1', name: 'Admin Senior', email: DEMO_EMAIL, role: 'super_admin' }
      localStorage.setItem(KEY, JSON.stringify(u))
      setUser(u)
      return { ok: true }
    }
    return { ok: false, error: 'Wrong email or password' }
  }

  const logout = () => {
    localStorage.removeItem(KEY)
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside provider')
  return c
}
