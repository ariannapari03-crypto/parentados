import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFamily } from '../context/FamilyContext'
import type { Ruolo } from '../types/domain'

export default function ProfilePage() {
  const { members, loading, error, currentMember, setCurrentMemberId, createMember, deleteMember } = useFamily()
  const [nome, setNome] = useState('')
  const [ruolo, setRuolo] = useState<Ruolo>('adulto')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setSubmitting(true)
    try {
      const member = await createMember(nome.trim(), ruolo)
      setNome('')
      setCurrentMemberId(member.id)
      navigate('/')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 py-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">🏡 Case Famiglia</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Chi sei? Scegli il tuo nome dalla lista.</p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading && <p className="text-slate-400 text-sm mb-4">Caricamento...</p>}

      <ul className="space-y-2 mb-6">
        {members.map((m) => (
          <li key={m.id}>
            <button
              onClick={() => {
                setCurrentMemberId(m.id)
                navigate('/')
              }}
              className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                currentMember?.id === m.id
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-950'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <span className="font-medium">
                {m.ruolo === 'adulto' ? '🧑' : '🧒'} {m.nome}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wide text-slate-400">{m.ruolo}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Rimuovere ${m.nome} dalla famiglia?`)) deleteMember(m.id)
                  }}
                  className="text-slate-400 hover:text-red-600"
                >
                  ✕
                </span>
              </span>
            </button>
          </li>
        ))}
        {!loading && members.length === 0 && (
          <p className="text-sm text-slate-400">Nessun membro ancora. Aggiungine uno qui sotto.</p>
        )}
      </ul>

      <form onSubmit={handleAdd} className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
        <h2 className="font-semibold">Aggiungi un membro della famiglia</h2>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRuolo('adulto')}
            className={`flex-1 rounded-lg border px-3 py-2 ${ruolo === 'adulto' ? 'border-teal-600 bg-teal-50 dark:bg-teal-950' : 'border-slate-300 dark:border-slate-700'}`}
          >
            🧑 Adulto
          </button>
          <button
            type="button"
            onClick={() => setRuolo('nipote')}
            className={`flex-1 rounded-lg border px-3 py-2 ${ruolo === 'nipote' ? 'border-teal-600 bg-teal-50 dark:bg-teal-950' : 'border-slate-300 dark:border-slate-700'}`}
          >
            🧒 Nipote
          </button>
        </div>
        <button
          type="submit"
          disabled={submitting || !nome.trim()}
          className="w-full rounded-lg bg-teal-700 text-white font-medium py-2.5 disabled:opacity-50"
        >
          Aggiungi e continua
        </button>
      </form>
    </div>
  )
}
