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
          className="block rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 px-4 py-3 text-red-800 dark:text-red-200"
        >
          🛠️ <strong>{openIssues.length}</strong> {openIssues.length === 1 ? 'guasto aperto' : 'guasti aperti'} da vedere
        </Link>
      )}

      <div>
        <h1 className="text-xl font-bold mb-3">Le nostre case</h1>
        <div className="space-y-3">
          {HOUSES.map((house) => {
            const houseBookings = bookings?.filter((b) => b.houseId === house.id) ?? []
            const relevant = currentOrNextBooking(houseBookings)
            const status = relevant ? bookingStatus(relevant) : null
            return (
              <Link
                key={house.id}
                to={`/case/${house.slug}`}
                className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{house.nome}</span>
                  {house.accessoRiservato && (
                    <span className="text-[11px] uppercase tracking-wide text-amber-600">accesso riservato</span>
                  )}
                </div>
                {loading && <p className="text-sm text-slate-400 mt-1">Caricamento...</p>}
                {!loading && relevant && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {status === 'in-corso' ? '🟢 In corso: ' : '📅 Prossimo: '}
                    {formatDateRange(relevant.dataInizio, relevant.dataFine)} — {relevant.partecipanti.map(memberName).join(', ')}
                  </p>
                )}
                {!loading && !relevant && (
                  <p className="text-sm text-slate-400 mt-1">Nessun soggiorno programmato</p>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
