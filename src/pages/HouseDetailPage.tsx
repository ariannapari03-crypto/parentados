import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getHouseBySlug } from '../data/houses'
import { useRealtimeQuery } from '../hooks/useRealtimeQuery'
import { deleteBooking, getChecklistState, listBookingsForHouse, listHandoffItems, markHandoffDelivered } from '../lib/repo'
import { useFamily } from '../context/FamilyContext'
import { bookingStatus, formatDateRange } from '../lib/dateUtils'
import { extractResponsible } from '../lib/checklistHistory'
import type { Booking, ChecklistState } from '../types/domain'

function HouseConfigBadges({ house }: { house: ReturnType<typeof getHouseBySlug> }) {
  if (!house) return null
  const badges: string[] = []
  if (house.hasGarage) badges.push('🚗 Garage')
  if (house.hasGas) badges.push('🔥 Gas')
  if (house.hasBoiler) badges.push('♨️ Boiler')
  if (house.hasDeumidificatore) badges.push('💨 Deumidificatore')
  if (house.hasTerrazzo) badges.push('🌞 Terrazzo')
  if (house.serranda !== 'nessuna') badges.push(house.serranda === 'tapparelle' ? '🪟 Tapparelle' : '🪟 Simil-imposte')
  if (house.supportsInverno) badges.push('❄️ Anche inverno')
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {badges.map((b) => (
        <span key={b} className="text-xs rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-slate-600 dark:text-slate-300">
          {b}
        </span>
      ))}
    </div>
  )
}

function BookingRow({ booking, houseSlug }: { booking: Booking; houseSlug: string }) {
  const { members } = useFamily()
  const status = bookingStatus(booking)
  const partecipanti = booking.partecipanti.map((id) => members.find((m) => m.id === id)?.nome ?? '—').join(', ')

  return (
    <li className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{formatDateRange(booking.dataInizio, booking.dataFine)}</span>
        <span
          className={`text-[11px] uppercase tracking-wide rounded-full px-2 py-0.5 ${
            status === 'in-corso'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : status === 'futuro'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
          }`}
        >
          {status}
        </span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        {partecipanti} · {booking.stagione}
        {booking.inizioStagione && ' · inizio stagione'}
        {booking.fineStagione && ' · fine stagione'}
      </p>
      <div className="flex gap-2 mt-2">
        <Link
          to={`/soggiorno/${booking.id}/apertura`}
          className="flex-1 text-center text-sm rounded-lg border border-teal-600 text-teal-700 dark:text-teal-400 py-1.5"
        >
          Apertura
        </Link>
        <Link
          to={`/soggiorno/${booking.id}/chiusura`}
          className="flex-1 text-center text-sm rounded-lg border border-teal-600 text-teal-700 dark:text-teal-400 py-1.5"
        >
          Chiusura
        </Link>
        <button
          onClick={() => {
            if (confirm('Eliminare questo soggiorno?')) deleteBooking(booking.id)
          }}
          className="text-sm text-slate-400 hover:text-red-600 px-2"
        >
          ✕
        </button>
      </div>
      <span className="hidden">{houseSlug}</span>
    </li>
  )
}

function HistoryEntry({ booking }: { booking: Booking }) {
  const { members } = useFamily()
  const [apertura, setApertura] = useState<ChecklistState | null>(null)
  const [chiusura, setChiusura] = useState<ChecklistState | null>(null)

  useEffect(() => {
    getChecklistState(booking.id, 'apertura').then(setApertura)
    getChecklistState(booking.id, 'chiusura').then(setChiusura)
  }, [booking.id])

  function memberName(id: string | null) {
    if (!id) return null
    return members.find((m) => m.id === id)?.nome ?? '—'
  }

  const open = extractResponsible(apertura)
  const close = extractResponsible(chiusura)

  return (
    <li className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm">
      <div className="font-medium">{formatDateRange(booking.dataInizio, booking.dataFine)}</div>
      <div className="text-slate-500 dark:text-slate-400">
        {open.da ? `Aperta da ${memberName(open.da)}` : 'Apertura non registrata'}
        {' · '}
        {close.da ? `Chiusa da ${memberName(close.da)}` : 'Chiusura non registrata'}
      </div>
    </li>
  )
}

export default function HouseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const house = getHouseBySlug(slug ?? '')
  const { data: bookings, loading } = useRealtimeQuery(
    'bookings',
    () => (house ? listBookingsForHouse(house.id) : Promise.resolve([])),
    [house?.id],
  )
  const { data: handoff, refresh: refreshHandoff } = useRealtimeQuery(
    'handoff_items',
    () => (house ? listHandoffItems(house.id) : Promise.resolve([])),
    [house?.id],
  )
  const { members } = useFamily()

  if (!house) return <p>Casa non trovata.</p>

  const upcoming = (bookings ?? []).filter((b) => bookingStatus(b) !== 'passato')
  const past = (bookings ?? []).filter((b) => bookingStatus(b) === 'passato').slice(0, 10)
  const pendingHandoff = (handoff ?? []).filter((h) => h.stato === 'da_portare')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{house.nome}</h1>
        <HouseConfigBadges house={house} />
        {house.accessoRiservato && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ Un nipote può partecipare solo se è presente anche un adulto nello stesso periodo.
          </p>
        )}
      </div>

      <Link
        to={`/case/${house.slug}/prenota`}
        className="block text-center rounded-lg bg-teal-700 text-white font-medium py-2.5"
      >
        + Prenota un soggiorno
      </Link>

      {pendingHandoff.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">🧳 Da portare alla prossima apertura</h2>
          <ul className="space-y-2">
            {pendingHandoff.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 px-3 py-2 text-sm"
              >
                <span>
                  {item.descrizione}
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    segnalato da {members.find((m) => m.id === item.segnalatoDa)?.nome ?? '—'}
                  </span>
                </span>
                <button
                  onClick={() => markHandoffDelivered(item.id).then(refreshHandoff)}
                  className="text-xs rounded-md bg-white dark:bg-slate-900 border border-amber-400 px-2 py-1"
                >
                  Consegnato
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-2">Soggiorni</h2>
        {loading && <p className="text-sm text-slate-400">Caricamento...</p>}
        {!loading && upcoming.length === 0 && <p className="text-sm text-slate-400">Nessun soggiorno in programma.</p>}
        <ul className="space-y-2">
          {upcoming.map((b) => (
            <BookingRow key={b.id} booking={b} houseSlug={house.slug} />
          ))}
        </ul>
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Storico</h2>
          <ul className="space-y-1.5">
            {past.map((b) => (
              <HistoryEntry key={b.id} booking={b} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
