import { useState } from 'react'
import { HOUSES } from '../data/houses'
import { useFamily } from '../context/FamilyContext'
import { useRealtimeQuery } from '../hooks/useRealtimeQuery'
import { createIssue, listIssues, resolveIssue } from '../lib/repo'

export default function IssuesPage() {
  const { members, currentMember } = useFamily()
  const { data: issues, loading, refresh } = useRealtimeQuery('issues', () => listIssues(), [])
  const [houseId, setHouseId] = useState(HOUSES[0].id)
  const [descrizione, setDescrizione] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const aperti = (issues ?? []).filter((i) => i.stato === 'aperto')
  const risolti = (issues ?? []).filter((i) => i.stato === 'risolto')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descrizione.trim() || !currentMember) return
    setSubmitting(true)
    try {
      await createIssue({ houseId, descrizione: descrizione.trim(), segnalatoDa: currentMember.id })
      setDescrizione('')
      await refresh()
    } finally {
      setSubmitting(false)
    }
  }

  function houseName(id: string) {
    return HOUSES.find((h) => h.id === id)?.nome ?? id
  }

  function memberName(id: string) {
    return members.find((m) => m.id === id)?.nome ?? '—'
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display font-extrabold text-xl">🛠️ Guasti e segnalazioni</h1>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-stone-line bg-surface p-4">
        <h2 className="font-display font-bold text-sm">Nuova segnalazione</h2>
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
        <textarea
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          placeholder="Cosa è successo?"
          rows={2}
          className="w-full rounded-lg border border-stone-line bg-surface px-3 py-2"
        />
        <button
          type="submit"
          disabled={submitting || !descrizione.trim()}
          className="w-full rounded-lg bg-danger text-white font-semibold py-2.5 disabled:opacity-50"
        >
          Segnala
        </button>
      </form>

      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-stone mb-2">
          Aperti {aperti.length > 0 && `(${aperti.length})`}
        </p>
        {loading && <p className="text-sm text-stone">Caricamento...</p>}
        {!loading && aperti.length === 0 && <p className="text-sm text-stone">Nessun guasto aperto. 🎉</p>}
        <ul className="space-y-2">
          {aperti.map((issue) => (
            <li key={issue.id} className="rounded-lg border border-danger/35 bg-danger/10 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-bold text-sm">{houseName(issue.houseId)}</p>
                  <p className="text-sm">{issue.descrizione}</p>
                  <p className="text-xs text-ink-soft mt-1">
                    segnalato da {memberName(issue.segnalatoDa)} il{' '}
                    <span className="font-mono">{new Date(issue.data).toLocaleDateString('it-IT')}</span>
                  </p>
                </div>
                <button
                  onClick={() => resolveIssue(issue.id).then(refresh)}
                  className="shrink-0 text-xs rounded-md bg-surface border border-danger/50 px-2 py-1"
                >
                  Risolto
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {risolti.length > 0 && (
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-stone mb-2">Risolti</p>
          <ul className="space-y-2">
            {risolti.slice(0, 15).map((issue) => (
              <li key={issue.id} className="rounded-lg border border-stone-line px-3 py-2 text-sm opacity-70">
                <p className="font-display font-bold">{houseName(issue.houseId)}</p>
                <p>{issue.descrizione}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
