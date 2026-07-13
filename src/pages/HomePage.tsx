import { Link } from 'react-router-dom'
import { HOUSES } from '../data/houses'
import { useRealtimeQuery } from '../hooks/useRealtimeQuery'
import { listBookings, listIssues } from '../lib/repo'
import { useFamily } from '../context/FamilyContext'
import { bookingStatus, currentOrNextBooking, formatDateRange } from '../lib/dateUtils'

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
          className="flex items-center gap-2 rounded-xl border border-danger/35 bg-danger/10 px-4 py-3 text-danger font-semibold"
        >
          🛠️ <strong className="font-mono">{openIssues.length}</strong>{' '}
          {openIssues.length === 1 ? 'guasto aperto' : 'guasti aperti'} da vedere
        </Link>
      )}

      <div>
        <h1 className="font-display font-semibold text-2xl mb-1">Le nostre case</h1>
        <p className="text-ink-soft text-sm mb-3">Tocca una casa per prenotare o fare la checklist.</p>
        <div className="space-y-3">
          {HOUSES.map((house) => {
            const houseBookings = bookings?.filter((b) => b.houseId === house.id) ?? []
            const relevant = currentOrNextBooking(houseBookings)
            const status = relevant ? bookingStatus(relevant) : null
            return (
              <Link
                key={house.id}
                to={`/case/${house.slug}`}
                className="relative block rounded-2xl border overflow-hidden active:scale-[0.99] transition"
                style={{
                  borderColor: `color-mix(in srgb, ${house.colore} 35%, transparent)`,
                  background: `linear-gradient(135deg, color-mix(in srgb, ${house.colore} 14%, var(--color-surface)), var(--color-surface) 70%)`,
                }}
              >
                <div className="flex items-center gap-3 p-4">
                  <span
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `color-mix(in srgb, ${house.colore} 22%, var(--color-surface))` }}
                  >
                    {house.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-semibold text-lg leading-tight">{house.nome}</span>
                      {status && (
                        <span
                          className="font-mono text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            color: house.colore,
                            background: `color-mix(in srgb, ${house.colore} 16%, var(--color-surface))`,
                          }}
                        >
                          {status === 'in-corso' ? 'in corso' : 'in arrivo'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft" style={{ color: house.colore }}>
                      {house.sottotitolo}
                    </p>
                    {loading && <p className="text-sm text-stone mt-1">Caricamento...</p>}
                    {!loading && relevant && (
                      <p className="text-sm text-ink-soft mt-1 truncate">
                        <span className="font-mono text-ink">{formatDateRange(relevant.dataInizio, relevant.dataFine)}</span>{' '}
                        · {relevant.partecipanti.map(memberName).join(', ')}
                      </p>
                    )}
                    {!loading && !relevant && <p className="text-sm text-stone mt-1">Nessun soggiorno programmato</p>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
