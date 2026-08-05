import { supabase } from './supabase'
import type { EventRecord } from '../types/domain'

export interface NewEventInput {
  type: EventRecord['type']
  title: string
  event_date: string | null
  event_time: string | null
  duration_h: number
  guest_count: number
  guest_type: string | null
  budget_total: number
  city: string
  area: string | null
  venue_type: string | null
}

export async function listEvents(ownerId: string): Promise<EventRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('owner_id', ownerId)
    .order('event_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as EventRecord[]
}

export async function getEvent(id: string): Promise<EventRecord | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as EventRecord) ?? null
}

export async function createEvent(
  ownerId: string,
  input: NewEventInput,
): Promise<{ data: EventRecord | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'Supabase non configurato' }
  const { data, error } = await supabase
    .from('events')
    .insert({ ...input, owner_id: ownerId })
    .select('*')
    .single()
  return { data: (data as EventRecord) ?? null, error: error ? error.message : null }
}

export async function deleteEvent(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase non configurato' }
  const { error } = await supabase.from('events').delete().eq('id', id)
  return { error: error ? error.message : null }
}
