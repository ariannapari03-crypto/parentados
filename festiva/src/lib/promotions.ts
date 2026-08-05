import { supabase } from './supabase'
import type { Promotion } from '../types/domain'

/** Promozione con i dati essenziali del partner collegato (per la vetrina). */
export interface PromotionWithPartner extends Promotion {
  partner: {
    id: string
    name: string
    category: string
    city: string
    area: string | null
    image_url: string | null
    rating: number | null
  } | null
}

export async function listActivePromotions(): Promise<PromotionWithPartner[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('promotions')
    .select('*, partner:partners(id, name, category, city, area, image_url, rating)')
    .eq('active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as PromotionWithPartner[]
}

export async function promotionsForPartner(partnerId: string): Promise<Promotion[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Promotion[]
}

/** Insieme degli id dei partner che hanno almeno una promozione attiva. */
export async function partnerIdsWithPromo(): Promise<Set<string>> {
  if (!supabase) return new Set()
  const { data, error } = await supabase.from('promotions').select('partner_id').eq('active', true)
  if (error) throw error
  return new Set((data ?? []).map((r: { partner_id: string }) => r.partner_id))
}
