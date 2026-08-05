import { supabase } from './supabase'
import type { Guest, Rsvp } from '../types/domain'

export interface GuestInput {
  name: string
  email: string | null
  phone: string | null
  rsvp: Rsvp
  dietary: string | null
  plus_one: boolean
}

export async function listGuests(eventId: string): Promise<Guest[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Guest[]
}

export async function createGuest(eventId: string, input: GuestInput): Promise<Guest | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('guests')
    .insert({ ...input, event_id: eventId })
    .select('*')
    .single()
  if (error) throw error
  return (data as Guest) ?? null
}

export async function updateGuest(id: string, patch: Partial<GuestInput>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('guests').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteGuest(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('guests').delete().eq('id', id)
  if (error) throw error
}
