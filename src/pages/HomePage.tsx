import { Link } from 'react-router-dom'
import { HOUSES } from '../data/houses'
import { useRealtimeQuery } from '../hooks/useRealtimeQuery'
import { listBookings, listIssues } from '../lib/repo'
import { useFamily } from '../context/FamilyContext'
import { bookingStatus, currentOrNextBooking, formatDateRange } from '../lib/dateUtils'

const STATUS_TAG_COLOR: Record<string, string> = {
  'in-corso': 'var(--color-success)',
  futuro: 'var(--color-terracotta)',
}

export default function HomePage() {
  const { members } = useFamily()
  const { data: bookings, loading } = useRealtimeQuery('bookings', () => listBookings(), [])
  const { data: issues } = useRealtimeQuery('issues', () => listIssues(), [])
  const openIssues = issues?.filter((i) => i.stato === 'aperto') ?? []

  function memberName(id: string) {
    return members.find((m) => m.id === id)?.nome ?? '—'
  }

  return (
    <div className="space-y-5">
      {openIssues.length > 0 && (
        <Link
          to="/guasti"
          className="flex items-center gap-2 rounded-xl border border-danger/35 bg-danger/10 px-4 py-3 text-danger font-medium"
        >
          🛠️ <strong className="font-mono">{openIssues.length}</strong>{' '}
          {openIssues.length === 1 ? 'guasto aperto' : 'guasti aperti'} da vedere
        </Link>
      )}

      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-stone mb-2">Le nostre case</p>
        <div className="space-y-3">
          {HOUSES.map((house) => {
            const houseBookings = bookings?.filter((b) => b.houseId === house.id) ?? []
            const relevant = currentOrNextBooking(houseBookings)
            const status = relevant ? bookingStatus(relevant) : null
            const tagColor = (status && STATUS_TAG_COLOR[status]) || 'var(--color-stone-line)'
            return (
              <Link
                key={house.id}
                to={`/case/${house.slug}`}
                className="relative block rounded-2xl border border-stone-line bg-surface pl-5 pr-4 py-3.5 overflow-hidden"
              >
                <span
                  className="absolute left-0 top-3.5 bottom-3.5 w-[5px] rounded-full"
                  style={{ background: tagColor }}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-[16.5px]">{house.nome}</span>
                  {house.accessoRiservato && (
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-warning shrink-0">
                      🔑 adulto richiesto
                    </span>
                  )}
                </div>
                {loading && <p className="text-sm text-stone mt-1">Caricamento...</p>}
                {!loading && relevant && (
                  <p className="text-sm text-ink-soft mt-1 tabular-nums">
                    {status === 'in-corso' ? 'in corso' : 'prossimo'} ·{' '}
                    <span className="font-mono font-medium text-ink">
                      {formatDateRange(relevant.dataInizio, relevant.dataFine)}
                    </span>{' '}
                    · {relevant.partecipanti.map(memberName).join(', ')}
                  </p>
                )}
                {!loading && !relevant && <p className="text-sm text-stone mt-1">Nessun soggiorno programmato</p>}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
