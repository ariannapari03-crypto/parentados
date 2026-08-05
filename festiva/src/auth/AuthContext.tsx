import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, Role } from '../types/domain'

interface SignUpInput {
  email: string
  password: string
  displayName: string
  role: Extract<Role, 'organizer' | 'partner'>
}

interface AuthValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (input: SignUpInput) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Bootstrap: sessione corrente + iscrizione ai cambi di stato auth.
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Carica il profilo (con il ruolo) quando cambia l'utente.
  useEffect(() => {
    const userId = session?.user?.id
    if (!supabase || !userId) return
    let active = true
    setLoading(true)

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setProfile((data as Profile) ?? null)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [session?.user?.id])

  const value = useMemo<AuthValue>(() => {
    async function signIn(email: string, password: string) {
      if (!supabase) return { error: 'Supabase non configurato' }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ? error.message : null }
    }

    async function signUp({ email, password, displayName, role }: SignUpInput) {
      if (!supabase) return { error: 'Supabase non configurato', needsConfirmation: false }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName, role } },
      })
      if (error) return { error: error.message, needsConfirmation: false }
      // Se manca la sessione, è richiesta la conferma via email.
      return { error: null, needsConfirmation: !data.session }
    }

    async function signOut() {
      if (!supabase) return
      await supabase.auth.signOut()
    }

    return { session, profile, loading, signIn, signUp, signOut }
  }, [session, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  return ctx
}
