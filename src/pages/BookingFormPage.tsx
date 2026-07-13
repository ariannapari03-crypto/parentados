import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getHouseBySlug } from '../data/houses'
import { useFamily } from '../context/FamilyContext'
import { createBooking, findOverlappingBooking } from '../lib/repo'
import { formatDateRange, suggestStagione, todayISO } from '../lib/dateUtils'
import type { Stagione } from '../types/domain'

export default function BookingFormPage() {
  const { slug } = useParams<{ slug: string }>()
  const house = getHouseBySlug(slug ?? '')
  const { members, currentMember } = useFamily()
  const navigate = useNavigate()

  const [dataInizio, setDataInizio] = useState(todayISO())
  const [dataFine, setDataFine] = useState(todayISO())
  const [partecipanti, setPartecipanti] = useState<string[]>(currentMember ? [currentMember.id] : [])
  const [stagioneOverride, setStagioneOverride] = useState<Stagione | null>(null)
  const [inizioStagione, setInizioStagione] = useState(false)
  const [fineStagione, setFineStagione] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stagione = stagioneOverride ?? suggestStagione(dataInizio)

  const hasAdultoInSelection = useMemo(
    () => partecipanti.some((id) => members.find((m) => m.id === id)?.ruolo === 'adulto'),
    [partecipanti, members],
  )

  function toggleMember(id: string) {
    setPartecipanti((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!house) return
    setError(null)

    if (dataFine < dataInizio) {
      setError('La data di fine non può essere prima della data di inizio.')
      return
    }
    if (partecipanti.length === 0) {
      setError('Seleziona almeno un partecipante.')
      return
    }
    if (house.accessoRiservato && !hasAdultoInSelection) {
      setError(
        'A Sanremo un nipote può partecipare solo se è presente anche un adulto (zio/zia o genitore) nello stesso periodo. Aggiungi un adulto tra i partecipanti.',
      )
      return
    }

    setSubmitting(true)
    try {
      const conflict = await findOverlappingBooking(house.id, dataInizio, dataFine)
      if (conflict) {
        setError(
          `Periodo in conflitto con un soggiorno già prenotato: ${formatDateRange(conflict.dataInizio, conflict.dataFine)}.`,
        )
        return
      }
      const booking = await createBooking({
        houseId: house.id,
        dataInizio,
        dataFine,
        partecipanti,
        stagione,
        inizioStagione,
        fineStagione,
        createdBy: currentMember?.id ?? '',
      })
      navigate(`/case/${house.slug}`, { state: { newBookingId: booking.id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!house) return <p>Casa non trovata.</p>

  return (
    <div className="space-y-5">
      <h1 className="font-display font-extrabold text-xl">Prenota — {house.nome}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Dal
            <input
              type="date"
              value={dataInizio}
              onChange={(e) => setDataInizio(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-line bg-surface px-3 py-2 font-mono tabular-nums"
              required
            />
          </label>
          <label className="text-sm">
            Al
            <input
              type="date"
              value={dataFine}
              onChange={(e) => setDataFine(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-line bg-surface px-3 py-2 font-mono tabular-nums"
              required
            />
          </label>
        </div>

        {house.supportsInverno && !house.genericChecklist && (
          <div>
            <p className="text-sm mb-1">Stagione</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStagioneOverride('estate')}
                className={`flex-1 rounded-lg border px-3 py-2 ${stagione === 'estate' ? 'border-shutter bg-shutter/10' : 'border-stone-line'}`}
              >
                ☀️ Estate
              </button>
              <button
                type="button"
                onClick={() => setStagioneOverride('inverno')}
                className={`flex-1 rounded-lg border px-3 py-2 ${stagione === 'inverno' ? 'border-shutter bg-shutter/10' : 'border-stone-line'}`}
              >
                ❄️ Inverno
              </button>
            </div>
          </div>
        )}

        {!house.genericChecklist && (
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={inizioStagione} onChange={(e) => setInizioStagione(e.target.checked)} />
              È la prima apertura della stagione
            </label>
          </div>
        )}
        {!house.genericChecklist && (
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={fineStagione} onChange={(e) => setFineStagione(e.target.checked)} />
              Sarà l’ultima chiusura della stagione
            </label>
          </div>
        )}

        <div>
          <p className="text-sm mb-2">Partecipanti</p>
          <div className="space-y-1.5">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2 rounded-lg border border-stone-line px-3 py-2 text-sm"
              >
                <input type="checkbox" checked={partecipanti.includes(m.id)} onChange={() => toggleMember(m.id)} />
                {m.ruolo === 'adulto' ? '🧑' : '🧒'} {m.nome}
              </label>
            ))}
          </div>
          {house.accessoRiservato && (
            <p className="text-xs text-warning mt-1">⚠️ Serve almeno un adulto tra i partecipanti per prenotare Sanremo.</p>
          )}
        </div>

        {error && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-shutter text-white font-semibold py-2.5 disabled:opacity-50"
        >
          {submitting ? 'Salvataggio...' : 'Crea soggiorno'}
        </button>
      </form>
    </div>
  )
}
