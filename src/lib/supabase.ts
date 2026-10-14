import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

// When the keys are missing the app shows a setup screen, so these placeholders are never called.
export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'missing-key')
