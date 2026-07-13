import { useState } from 'react'
import { HOUSES } from '../data/houses'
import { useFamily } from '../context/FamilyContext'
import { useRealtimeQuery } from '../hooks/useRealtimeQuery'
import { createHandoffItem, listHandoffItems, markHandoffDelivered } from '../lib/repo'

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
      <h1 className="text-xl font-bold">🧳 Oggetti in transito</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Cose che devono spostarsi tra un soggiorno e l’altro: lenzuola, macchina del caffè, tutto quello che ti viene in mente.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <h2 className="font-semibold text-sm">Segnala un oggetto da portare</h2>
        <select
          value={houseId}
          onChange={(e) => setHouseId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
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
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
        />
        <button
          type="submit"
          disabled={submitting || !descrizione.trim()}
          className="w-full rounded-lg bg-teal-700 text-white font-medium py-2.5 disabled:opacity-50"
        >
          Segnala
        </button>
      </form>

      <div>
        <h2 className="font-semibold mb-2">Da portare {daPortare.length > 0 && `(${daPortare.length})`}</h2>
        {loading && <p className="text-sm text-slate-400">Caricamento...</p>}
        {!loading && daPortare.length === 0 && <p className="text-sm text-slate-400">Niente in sospeso al momento.</p>}
        <ul className="space-y-2">
          {daPortare.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 px-3 py-2"
            >
              <div>
                <p className="font-medium text-sm">{houseName(item.houseId)}</p>
                <p className="text-sm">{item.descrizione}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {item.autoGenerato ? 'auto-generato in chiusura' : `segnalato da ${memberName(item.segnalatoDa)}`}
                </p>
              </div>
              <button
                onClick={() => markHandoffDelivered(item.id).then(refresh)}
                className="shrink-0 text-xs rounded-md bg-white dark:bg-slate-900 border border-amber-400 px-2 py-1"
              >
                Consegnato
              </button>
            </li>
          ))}
        </ul>
      </div>

      {consegnati.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2 text-slate-500">Consegnati di recente</h2>
          <ul className="space-y-2">
            {consegnati.slice(0, 15).map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm opacity-70">
                <p className="font-medium">{houseName(item.houseId)}</p>
                <p>{item.descrizione}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
