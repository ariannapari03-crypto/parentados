import { supabase } from './supabase'
import type { BookingStatus } from '../types/domain'

/** Genera un codice di riscatto leggibile, es. FST-AL-9K3T. */
export function generateCode(prefix: string | null): string {
  const base = (prefix && prefix.trim()) || 'FST-AL'
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${base}-${rand}`
}

export interface RedemptionRow {
  id: string
  event_id: string
  status: BookingStatus
  redemption_code: string | null
  created_at: string
  partner: { name: string } | null
  promotion: { title: string; discount_type: string; value: number | null } | null
}

export async function createRedemption(input: {
  eventId: string
  partnerId: string
  promotionId: string | null
  code: string
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase non configurato' }
  const { error } = await supabase.from('bookings').insert({
    event_id: input.eventId,
    partner_id: input.partnerId,
    promotion_id: input.promotionId,
    status: 'confirmed',
    redemption_code: input.code,
  })
  return { error: error ? error.message : null }
}

/** Riscatti ricevuti da un partner (lato locale). Gli eventi non sono
 *  leggibili dal partner per privacy: mostriamo codice, promo e data. */
export async function listRedemptionsForPartner(partnerId: string): Promise<RedemptionRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('bookings')
    .select('id, event_id, status, redemption_code, created_at, promotion:promotions(title, discount_type, value)')
    .eq('partner_id', partnerId)
    .not('redemption_code', 'is', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as RedemptionRow[]
}

export async function listRedemptions(eventIds: string[]): Promise<RedemptionRow[]> {
  if (!supabase || eventIds.length === 0) return []
  const { data, error } = await supabase
    .from('bookings')
    .select('id, event_id, status, redemption_code, created_at, partner:partners(name), promotion:promotions(title, discount_type, value)')
    .in('event_id', eventIds)
    .not('redemption_code', 'is', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as RedemptionRow[]
}
