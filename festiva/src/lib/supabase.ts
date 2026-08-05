import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** true quando le variabili d'ambiente Supabase sono configurate. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Client Supabase condiviso. È `null` quando l'app non è ancora collegata a un
 * progetto Supabase: in quel caso mostriamo la schermata di setup invece di
 * far crashare l'app.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
