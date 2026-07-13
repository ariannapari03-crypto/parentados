import type { Booking, Stagione } from '../types/domain'

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function suggestStagione(dateISO: string): Stagione {
  const month = new Date(dateISO).getMonth() + 1
  return month >= 5 && month <= 9 ? 'estate' : 'inverno'
}

export function formatDate(dateISO: string): string {
  const d = new Date(dateISO)
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} → ${formatDate(end)}`
}

export function bookingStatus(b: Booking, todayIso: string = todayISO()): 'in-corso' | 'futuro' | 'passato' {
  if (todayIso < b.dataInizio) return 'futuro'
  if (todayIso > b.dataFine) return 'passato'
  return 'in-corso'
}

export function currentOrNextBooking(bookings: Booking[]): Booking | null {
  const today = todayISO()
  const sorted = [...bookings].sort((a, b) => a.dataInizio.localeCompare(b.dataInizio))
  const current = sorted.find((b) => bookingStatus(b, today) === 'in-corso')
  if (current) return current
  return sorted.find((b) => bookingStatus(b, today) === 'futuro') ?? null
}
