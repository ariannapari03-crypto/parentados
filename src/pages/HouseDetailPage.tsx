import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getHouseBySlug } from '../data/houses'
import { useRealtimeQuery } from '../hooks/useRealtimeQuery'
import {
  deleteBooking,
  deleteHandoffItem,
  getChecklistState,
  listBookingsForHouse,
  listHandoffItems,
  markHandoffDelivered,
} from '../lib/repo'
import { useFamily } from '../context/FamilyContext'
import { bookingStatus, formatDate, formatDateRange } from '../lib/dateUtils'
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
        <span key={b} className="text-xs rounded-full bg-surface-2 px-2 py-1 text-ink-soft">
          {b}
        </span>
      ))}
    </div>
  )
}

const STATUS_STYLE: Record<string, string> = {
  'in-corso': 'bg-success/15 text-success',
  futuro: 'bg-terracotta/15 text-terracotta',
  passato: 'bg-surface-2 text-stone',
}

function BookingRow({
  booking,
  houseSlug,
  onDeleted,
}: {
  booking: Booking
  houseSlug: string
  onDeleted: () => void
}) {
  const { members } = useFamily()
  const [deleting, setDeleting] = useState(false)
  const status = bookingStatus(booking)
  const partecipanti = booking.partecipanti.map((id) => members.find((m) => m.id === id)?.nome ?? '—').join(', ')

  return (
    <li className="rounded-xl border border-stone-line bg-surface px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold tabular-nums">{formatDateRange(booking.dataInizio, booking.dataFine)}</span>
        <span className={`font-mono text-[11px] uppercase tracking-wide rounded-full px-2 py-0.5 ${STATUS_STYLE[status]}`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-ink-soft mt-1">
        {partecipanti} · {booking.stagione}
        {booking.inizioStagione && ' · inizio stagione'}
        {booking.fineStagione && ' · fine stagione'}
      </p>
      <div className="flex gap-2 mt-2">
        <Link
          to={`/soggiorno/${booking.id}/pre-partenza`}
          className="flex-1 text-center text-sm rounded-lg border border-shutter text-shutter py-1.5"
        >
          Pre partenza
        </Link>
        <Link
          to={`/soggiorno/${booking.id}/apertura`}
          className="flex-1 text-center text-sm rounded-lg border border-shutter text-shutter py-1.5"
        >
          Apertura
        </Link>
        <Link
          to={`/soggiorno/${booking.id}/chiusura`}
          className="flex-1 text-center text-sm rounded-lg border border-shutter text-shutter py-1.5"
        >
          Chiusura
        </Link>
        <button
          onClick={async () => {
            if (!confirm('Eliminare questo soggiorno?')) return
            setDeleting(true)
            try {
              await deleteBooking(booking.id)
              onDeleted()
            } catch (err) {
              alert(
                `Non sono riuscito a eliminare il soggiorno: ${err instanceof Error ? err.message : 'errore sconosciuto'}`,
              )
            } finally {
              setDeleting(false)
            }
          }}
          disabled={deleting}
          className="text-sm text-stone hover:text-danger px-2 disabled:opacity-50"
        >
          {deleting ? '…' : '✕'}
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
  const dateParts = formatDate(booking.dataInizio).split(' ')
  const year = dateParts.pop()
  const dayMonth = dateParts.join(' ')

  return (
    <li className="flex items-center gap-3 px-3 py-2.5 border-b border-stone-line last:border-0 text-sm">
      <div className="font-mono font-bold w-[4.5rem] shrink-0 leading-tight tabular-nums">
        {dayMonth}
        <span className="block text-[10px] font-semibold text-stone">{year}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-ink-soft">
          {open.da ? `Aperta da ${memberName(open.da)}` : 'Apertura non registrata'}
          {' · '}
          {close.da ? `Chiusa da ${memberName(close.da)}` : 'Chiusura non registrata'}
        </div>
      </div>
    </li>
  )
}

export default function HouseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const house = getHouseBySlug(slug ?? '')
  const {
    data: bookings,
    loading,
    refresh: refreshBookings,
  } = useRealtimeQuery('bookings', () => (house ? listBookingsForHouse(house.id) : Promise.resolve([])), [house?.id])
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
        <h1 className="font-display font-extrabold text-xl">{house.nome}</h1>
        <HouseConfigBadges house={house} />
        {house.accessoRiservato && (
          <p className="text-sm text-warning mt-2">
            ⚠️ Un nipote può partecipare solo se è presente anche un adulto nello stesso periodo.
          </p>
        )}
      </div>

      {house.infoGestione.length > 0 && (
        <details className="rounded-xl border border-stone-line bg-surface px-4 py-3">
          <summary className="font-display font-bold cursor-pointer">ℹ️ Informazioni di gestione</summary>
          <div className="mt-3 space-y-3">
            {house.infoGestione.map((sezione) => (
              <div key={sezione.titolo}>
                <p className="text-sm font-medium">{sezione.titolo}</p>
                <p className="text-sm text-ink-soft mt-0.5">{sezione.corpo}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      <Link
        to={`/case/${house.slug}/prenota`}
        className="block text-center rounded-lg bg-shutter text-white font-semibold py-2.5"
      >
        + Prenota un soggiorno
      </Link>

      {pendingHandoff.length > 0 && (
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-stone mb-2">
            🧳 Da portare alla prossima apertura
          </p>
          <ul className="space-y-2">
            {pendingHandoff.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-terracotta/35 bg-terracotta/10 px-3 py-2 text-sm"
              >
                <span>
                  {item.descrizione}
                  <span className="block text-xs text-ink-soft">
                    segnalato da {members.find((m) => m.id === item.segnalatoDa)?.nome ?? '—'}
                  </span>
                </span>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <button
                    onClick={() => markHandoffDelivered(item.id).then(refreshHandoff)}
                    className="text-xs rounded-md bg-surface border border-terracotta/50 px-2 py-1"
                  >
                    Consegnato
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Eliminare questa segnalazione?')) deleteHandoffItem(item.id).then(refreshHandoff)
                    }}
                    className="text-xs text-stone hover:text-danger px-2"
                  >
                    Elimina
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-stone mb-2">Soggiorni</p>
        {loading && <p className="text-sm text-stone">Caricamento...</p>}
        {!loading && upcoming.length === 0 && <p className="text-sm text-stone">Nessun soggiorno in programma.</p>}
        <ul className="space-y-2">
          {upcoming.map((b) => (
            <BookingRow key={b.id} booking={b} houseSlug={house.slug} onDeleted={refreshBookings} />
          ))}
        </ul>
      </div>

      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-stone mb-2">
          Storico · registro dei soggiorni
        </p>
        {past.length === 0 ? (
          <p className="text-sm text-stone">Nessun soggiorno passato ancora: qui vedrai chi è stato prima di te.</p>
        ) : (
          <ul className="rounded-xl border border-stone-line bg-surface overflow-hidden">
            {past.map((b) => (
              <HistoryEntry key={b.id} booking={b} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
