import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { FamilyMember } from '../types/domain'
import { addFamilyMember, listFamilyMembers, removeFamilyMember } from '../lib/repo'
import { supabase } from '../lib/supabase'

const CURRENT_MEMBER_KEY = 'case-famiglia:current-member-id'

interface FamilyContextValue {
  members: FamilyMember[]
  loading: boolean
  error: string | null
  currentMember: FamilyMember | null
  setCurrentMemberId: (id: string | null) => void
  refresh: () => Promise<void>
  createMember: (nome: string, ruolo: 'nipote' | 'adulto') => Promise<FamilyMember>
  deleteMember: (id: string) => Promise<void>
}

const FamilyContext = createContext<FamilyContextValue | null>(null)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMemberId, setCurrentMemberIdState] = useState<string | null>(() =>
    localStorage.getItem(CURRENT_MEMBER_KEY),
  )

  async function refresh() {
    try {
      setLoading(true)
      const data = await listFamilyMembers()
      setMembers(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore di caricamento')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    const channel = supabase
      .channel('family_members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_members' }, () => refresh())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function setCurrentMemberId(id: string | null) {
    setCurrentMemberIdState(id)
    if (id) localStorage.setItem(CURRENT_MEMBER_KEY, id)
    else localStorage.removeItem(CURRENT_MEMBER_KEY)
  }

  const currentMember = useMemo(
    () => members.find((m) => m.id === currentMemberId) ?? null,
    [members, currentMemberId],
  )

  async function createMember(nome: string, ruolo: 'nipote' | 'adulto') {
    const member = await addFamilyMember(nome, ruolo)
    await refresh()
    return member
  }

  async function deleteMember(id: string) {
    await removeFamilyMember(id)
    if (currentMemberId === id) setCurrentMemberId(null)
    await refresh()
  }

  return (
    <FamilyContext.Provider
      value={{ members, loading, error, currentMember, setCurrentMemberId, refresh, createMember, deleteMember }}
    >
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily deve essere usato dentro FamilyProvider')
  return ctx
}
