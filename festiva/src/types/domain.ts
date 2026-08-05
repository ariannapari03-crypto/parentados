// Modello di dominio FESTIVA — allineato allo schema Supabase (supabase/schema.sql)

export type Role = 'organizer' | 'partner' | 'admin'

export type EventType =
  | 'laurea'
  | 'birthday'
  | 'wedding'
  | 'corporate'
  | 'anniversary'
  | 'other'

export type PartnerCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'decorations'
  | 'other'

export type DiscountType = 'percent' | 'fixed' | 'package'
export type Rsvp = 'pending' | 'confirmed' | 'declined'
export type Priority = 'high' | 'medium' | 'low'
export type BookingStatus = 'requested' | 'confirmed' | 'paid' | 'cancelled'
export type PartnerPlan = 'trial' | 'active' | 'paused'

export interface Profile {
  id: string
  display_name: string
  email: string
  avatar: string | null
  role: Role
  locale: 'it' | 'en'
  created_at: string
}

export interface EventRecord {
  id: string
  owner_id: string
  type: EventType
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
  status: string
  created_at: string
}

export interface Task {
  id: string
  event_id: string
  title: string
  category: string
  due_date: string | null
  priority: Priority
  completed: boolean
  notes: string | null
  created_at: string
}

export interface Expense {
  id: string
  event_id: string
  booking_id: string | null
  description: string
  amount: number
  spent_on: string | null
  category: string
  created_at: string
}

export interface Guest {
  id: string
  event_id: string
  name: string
  email: string | null
  phone: string | null
  rsvp: Rsvp
  dietary: string | null
  plus_one: boolean
  created_at: string
}

export interface Partner {
  id: string
  owner_id: string | null
  name: string
  category: PartnerCategory
  city: string
  area: string | null
  price_min: number | null
  price_max: number | null
  rating: number | null
  reviews_count: number
  description: string | null
  image_url: string | null
  featured: boolean
  plan: PartnerPlan
  created_at: string
}

export interface Promotion {
  id: string
  partner_id: string
  title: string
  description: string | null
  discount_type: DiscountType
  value: number | null
  min_guests: number | null
  valid_from: string | null
  valid_to: string | null
  terms: string | null
  code_prefix: string | null
  active: boolean
  created_at: string
}
