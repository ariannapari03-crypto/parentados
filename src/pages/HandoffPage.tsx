import { useState } from 'react'
import { HOUSES } from '../data/houses'
import { useFamily } from '../context/FamilyContext'
import { useRealtimeQuery } from '../hooks/useRealtimeQuery'
import { createHandoffItem, deleteHandoffItem, listHandoffItems, markHandoffDelivered } from '../lib/repo'

export default function HandoffPage() {
  const { members, currentMember } = useFamily()
  const { data: items, loading, refresh } = useRealtimeQuery('handoff_items', () => listHandoffItems(), [])
  const [houseId, setHouseId] = useState(HOUSES[0].id)
  const [descrizione, setDescrizione] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const daPortare = (items ?? []).filter((i) => i.stato === 'da_portare')
  const consegnati = (items ?? []).filter((i) => i.stato === 'consegnato')

  function houseName(id: string) {
    return HOUSES.find((h) => h.id === id)?.nome ?? id
  }
  function memberName(id: string) {
    return members.find((m) => m.id === id)?.nome ?? '—'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descrizione.trim() || !currentMember) return
    setSubmitting(true)
    try {
      await createHandoffItem({ houseId, descrizione: descrizione.trim(), segnalatoDa: currentMember.id })
      setDescrizione('')
      await refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display font-extrabold text-xl">🧳 Oggetti in transito</h1>
      <p className="text-sm text-ink-soft">
        Cose che devono spostarsi tra un soggiorno e l’altro: lenzuola, macchina del caffè, tutto quello che ti viene in mente.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-stone-line bg-surface p-4">
        <h2 className="font-display font-bold text-sm">Segnala un oggetto da portare</h2>
        <select
          value={houseId}
          onChange={(e) => setHouseId(e.target.value)}
          className="w-full rounded-lg border border-stone-line bg-surface px-3 py-2"
        >
          {HOUSES.map((h) => (
            <option key={h.id} value={h.id}>
              {h.nome}
            </option>
          ))}
        </select>
        <input
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          placeholder="Es. macchina del caffè"
          className="w-full rounded-lg border border-stone-line bg-surface px-3 py-2"
        />
        <button
          type="submit"
          disabled={submitting || !descrizione.trim()}
          className="w-full rounded-lg bg-shutter text-white font-semibold py-2.5 disabled:opacity-50"
        >
          Segnala
        </button>
      </form>

      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-stone mb-2">
          Da portare {daPortare.length > 0 && `(${daPortare.length})`}
        </p>
        {loading && <p className="text-sm text-stone">Caricamento...</p>}
        {!loading && daPortare.length === 0 && <p className="text-sm text-stone">Niente in sospeso al momento.</p>}
        <ul className="space-y-2">
          {daPortare.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-terracotta/35 bg-terracotta/10 px-3 py-2"
            >
              <div>
                <p className="font-display font-bold text-sm">{houseName(item.houseId)}</p>
                <p className="text-sm">{item.descrizione}</p>
                <p className="text-xs text-ink-soft mt-1">
                  {item.autoGenerato ? 'auto-generato in chiusura' : `segnalato da ${memberName(item.segnalatoDa)}`}
                </p>
              </div>
              <div className="shrink-0 flex flex-col gap-1 items-end">
                <button
                  onClick={() => markHandoffDelivered(item.id).then(refresh)}
                  className="text-xs rounded-md bg-surface border border-terracotta/50 px-2 py-1"
                >
                  Consegnato
                </button>
                <button
                  onClick={() => {
                    if (confirm('Eliminare questa segnalazione?')) deleteHandoffItem(item.id).then(refresh)
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

      {consegnati.length > 0 && (
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-stone mb-2">Consegnati di recente</p>
          <ul className="space-y-2">
            {consegnati.slice(0, 15).map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-stone-line px-3 py-2 text-sm opacity-70"
              >
                <div>
                  <p className="font-display font-bold">{houseName(item.houseId)}</p>
                  <p>{item.descrizione}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Eliminare questa segnalazione?')) deleteHandoffItem(item.id).then(refresh)
                  }}
                  className="shrink-0 text-xs text-stone hover:text-danger px-2"
                >
                  Elimina
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
