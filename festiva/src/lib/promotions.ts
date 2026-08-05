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

export interface PromotionInput {
  title: string
  description: string | null
  discount_type: Promotion['discount_type']
  value: number | null
  min_guests: number | null
  valid_to: string | null
  terms: string | null
  code_prefix: string | null
  active: boolean
}

/** Tutte le promozioni (attive e non) di un partner — per la gestione lato locale. */
export async function listPartnerPromotions(partnerId: string): Promise<Promotion[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Promotion[]
}

export async function createPromotion(partnerId: string, input: PromotionInput): Promise<Promotion | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('promotions')
    .insert({ ...input, partner_id: partnerId })
    .select('*')
    .single()
  if (error) throw error
  return (data as Promotion) ?? null
}

export async function updatePromotion(id: string, patch: Partial<PromotionInput>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('promotions').update(patch).eq('id', id)
  if (error) throw error
}

export async function deletePromotion(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('promotions').delete().eq('id', id)
  if (error) throw error
}

/** Insieme degli id dei partner che hanno almeno una promozione attiva. */
export async function partnerIdsWithPromo(): Promise<Set<string>> {
  if (!supabase) return new Set()
  const { data, error } = await supabase.from('promotions').select('partner_id').eq('active', true)
  if (error) throw error
  return new Set((data ?? []).map((r: { partner_id: string }) => r.partner_id))
}
