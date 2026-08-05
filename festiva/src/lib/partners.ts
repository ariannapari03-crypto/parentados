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
