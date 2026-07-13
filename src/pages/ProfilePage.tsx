import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFamily } from '../context/FamilyContext'
import ConfirmDialog from '../components/ConfirmDialog'
import type { FamilyMember, Ruolo } from '../types/domain'

export default function ProfilePage() {
  const { members, loading, error, currentMember, setCurrentMemberId, createMember, deleteMember } = useFamily()
  const [nome, setNome] = useState('')
  const [ruolo, setRuolo] = useState<Ruolo>('adulto')
  const [submitting, setSubmitting] = useState(false)
  const [pendingMember, setPendingMember] = useState<FamilyMember | null>(null)
  const navigate = useNavigate()

  function confirmSelection() {
    if (!pendingMember) return
    setCurrentMemberId(pendingMember.id)
    setPendingMember(null)
    navigate('/')
  }

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
    <div className="min-h-svh bg-bg text-ink font-sans px-4 py-6 max-w-xl mx-auto">
      <h1 className="font-display font-extrabold text-2xl mb-1 flex items-center gap-2 text-shutter">
        🏡 Case Famiglia
      </h1>
      <p className="text-ink-soft mb-6">Chi sei? Scegli il tuo nome dalla lista.</p>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}
      {loading && <p className="text-stone text-sm mb-4">Caricamento...</p>}

      <ul className="space-y-2 mb-6">
        {members.map((m) => (
          <li key={m.id}>
            <button
              onClick={() => setPendingMember(m)}
              className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                currentMember?.id === m.id ? 'border-shutter bg-shutter/10' : 'border-stone-line bg-surface'
              }`}
            >
              <span className="font-medium">
                {m.ruolo === 'adulto' ? '🧑' : '🧒'} {m.nome}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-wide text-stone">{m.ruolo}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Rimuovere ${m.nome} dalla famiglia?`)) deleteMember(m.id)
                  }}
                  className="text-stone hover:text-danger"
                >
                  ✕
                </span>
              </span>
            </button>
          </li>
        ))}
        {!loading && members.length === 0 && (
          <p className="text-sm text-stone">Nessun membro ancora. Aggiungine uno qui sotto.</p>
        )}
      </ul>

      <form onSubmit={handleAdd} className="space-y-3 border-t border-stone-line pt-5">
        <h2 className="font-display font-bold">Aggiungi un membro della famiglia</h2>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome"
          className="w-full rounded-lg border border-stone-line bg-surface px-3 py-2"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRuolo('adulto')}
            className={`flex-1 rounded-lg border px-3 py-2 ${ruolo === 'adulto' ? 'border-shutter bg-shutter/10' : 'border-stone-line'}`}
          >
            🧑 Adulto
          </button>
          <button
            type="button"
            onClick={() => setRuolo('nipote')}
            className={`flex-1 rounded-lg border px-3 py-2 ${ruolo === 'nipote' ? 'border-shutter bg-shutter/10' : 'border-stone-line'}`}
          >
            🧒 Nipote
          </button>
        </div>
        <button
          type="submit"
          disabled={submitting || !nome.trim()}
          className="w-full rounded-lg bg-shutter text-white font-semibold py-2.5 disabled:opacity-50"
        >
          Aggiungi e continua
        </button>
      </form>

      <ConfirmDialog
        open={pendingMember !== null}
        title={`Stai selezionando il profilo: ${pendingMember?.nome ?? ''}`}
        message="Confermare?"
        onConfirm={confirmSelection}
        onCancel={() => setPendingMember(null)}
      />
    </div>
  )
}
