import type { EventType } from '../types/domain'
import type { Lang } from '../i18n/strings'

interface Labeled<T extends string> {
  value: T
  emoji: string
  label: Record<Lang, string>
  hint?: Record<Lang, string>
}

export const EVENT_TYPES: Labeled<EventType>[] = [
  { value: 'laurea', emoji: '🎓', label: { it: 'Laurea', en: 'Graduation' }, hint: { it: 'Traguardo accademico', en: 'Academic milestone' } },
  { value: 'birthday', emoji: '🎂', label: { it: 'Compleanno', en: 'Birthday' }, hint: { it: 'Festa di compleanno', en: 'Birthday party' } },
  { value: 'wedding', emoji: '💒', label: { it: 'Matrimonio', en: 'Wedding' }, hint: { it: 'Il giorno perfetto', en: 'The perfect day' } },
  { value: 'corporate', emoji: '🏢', label: { it: 'Aziendale', en: 'Corporate' }, hint: { it: 'Evento business', en: 'Business event' } },
  { value: 'anniversary', emoji: '💕', label: { it: 'Anniversario', en: 'Anniversary' }, hint: { it: 'Un traguardo insieme', en: 'A milestone together' } },
  { value: 'other', emoji: '🎉', label: { it: 'Altro', en: 'Other' }, hint: { it: 'Festa su misura', en: 'Custom celebration' } },
]

export const GUEST_TYPES: Labeled<string>[] = [
  { value: 'family', emoji: '👨‍👩‍👧‍👦', label: { it: 'Famiglia', en: 'Family' } },
  { value: 'friends', emoji: '👫', label: { it: 'Amici', en: 'Friends' } },
  { value: 'colleagues', emoji: '👔', label: { it: 'Colleghi', en: 'Colleagues' } },
  { value: 'mixed', emoji: '🎭', label: { it: 'Misto', en: 'Mixed' } },
]

// Zone di Alba (partenza del progetto)
export const AREAS: Labeled<string>[] = [
  { value: 'centro', emoji: '🏛️', label: { it: 'Centro storico', en: 'Old town' } },
  { value: 'savona', emoji: '⛲', label: { it: 'Piazza Savona', en: 'Piazza Savona' } },
  { value: 'piave', emoji: '🌿', label: { it: 'Borgo Piave', en: 'Borgo Piave' } },
  { value: 'langhe', emoji: '🍷', label: { it: 'Corso Langhe', en: 'Corso Langhe' } },
]

export const VENUE_TYPES: Labeled<string>[] = [
  { value: 'restaurant', emoji: '🍽️', label: { it: 'Ristorante', en: 'Restaurant' } },
  { value: 'bar', emoji: '🍸', label: { it: 'Bar / Enoteca', en: 'Bar / Wine bar' } },
  { value: 'outdoor', emoji: '🌳', label: { it: "All'aperto", en: 'Outdoor' } },
  { value: 'private', emoji: '🏠', label: { it: 'Spazio privato', en: 'Private venue' } },
]

export function metaLabel<T extends string>(list: Labeled<T>[], value: T | null | undefined, lang: Lang): string {
  const found = list.find((x) => x.value === value)
  return found ? found.label[lang] : ''
}

export function metaEmoji<T extends string>(list: Labeled<T>[], value: T | null | undefined): string {
  return list.find((x) => x.value === value)?.emoji ?? '🎉'
}

/** Ripartizione consigliata del budget in base al tipo di evento. */
export function budgetAllocation(type: EventType, budget: number) {
  let venue = 0.5, catering = 0.3, decorations = 0.1, photography = 0.1
  if (type === 'wedding') { venue = 0.4; catering = 0.35; decorations = 0.15; photography = 0.1 }
  else if (type === 'laurea') { venue = 0.45; catering = 0.35; decorations = 0.1; photography = 0.1 }
  return {
    venue: Math.round(budget * venue),
    catering: Math.round(budget * catering),
    decorations: Math.round(budget * decorations),
    photography: Math.round(budget * photography),
  }
}

/** Progresso di allestimento derivato dai campi realmente compilati (0–100). */
export function setupProgress(e: {
  event_date: string | null
  budget_total: number
  guest_count: number
  area: string | null
  venue_type: string | null
}): number {
  const checks = [
    Boolean(e.event_date),
    e.budget_total > 0,
    e.guest_count > 0,
    Boolean(e.area),
    Boolean(e.venue_type),
  ]
  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}
