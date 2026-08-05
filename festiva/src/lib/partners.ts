import { supabase } from './supabase'
import type { Partner, PartnerCategory } from '../types/domain'

export async function listPartners(opts: { city?: string; category?: PartnerCategory | 'all' } = {}): Promise<Partner[]> {
  if (!supabase) return []
  let query = supabase.from('partners').select('*')
  if (opts.city) query = query.eq('city', opts.city)
  if (opts.category && opts.category !== 'all') query = query.eq('category', opts.category)
  const { data, error } = await query.order('featured', { ascending: false }).order('rating', { ascending: false, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as Partner[]
}

export async function getPartner(id: string): Promise<Partner | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('partners').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as Partner) ?? null
}

export interface PartnerInput {
  name: string
  category: PartnerCategory
  city: string
  area: string | null
  price_min: number | null
  price_max: number | null
  description: string | null
}

/** La scheda del locale posseduta dall'utente corrente (se esiste). */
export async function getMyPartner(ownerId: string): Promise<Partner | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as Partner) ?? null
}

export async function upsertPartner(
  ownerId: string,
  input: PartnerInput,
  existingId?: string,
): Promise<{ data: Partner | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'Supabase non configurato' }
  const query = existingId
    ? supabase.from('partners').update(input).eq('id', existingId).select('*').single()
    : supabase.from('partners').insert({ ...input, owner_id: ownerId }).select('*').single()
  const { data, error } = await query
  return { data: (data as Partner) ?? null, error: error ? error.message : null }
}
