import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFamily } from '../context/FamilyContext'
import ConfirmDialog from '../components/ConfirmDialog'
import { PROFILE_EMOJI_OPTIONS, memberEmoji } from '../lib/memberDisplay'
import type { FamilyMember, Ruolo } from '../types/domain'

function EmojiGrid({ value, onPick }: { value: string | null; onPick: (e: string) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {PROFILE_EMOJI_OPTIONS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onPick(e)}
          className={`aspect-square rounded-lg text-xl flex items-center justify-center border transition ${
            value === e ? 'border-shutter bg-shutter/10 scale-105' : 'border-stone-line bg-surface'
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const { members, loading, error, currentMember, setCurrentMemberId, createMember, updateEmoji, deleteMember } =
    useFamily()
  const [nome, setNome] = useState('')
  const [ruolo, setRuolo] = useState<Ruolo>('adulto')
  const [emoji, setEmoji] = useState<string>(PROFILE_EMOJI_OPTIONS[0])
  const [submitting, setSubmitting] = useState(false)
  const [pendingMember, setPendingMember] = useState<FamilyMember | null>(null)
  const [editingEmojiFor, setEditingEmojiFor] = useState<string | null>(null)
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
      const member = await createMember(nome.trim(), ruolo, emoji)
      setNome('')
      setEmoji(PROFILE_EMOJI_OPTIONS[0])
      setCurrentMemberId(member.id)
      navigate('/')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Chi sei?</h1>
        <p className="text-ink-soft mt-0.5">Tocca il tuo profilo per continuare.</p>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}
      {loading && <p className="text-stone text-sm">Caricamento...</p>}

      <ul className="grid grid-cols-2 gap-3">
        {members.map((m) => {
          const active = currentMember?.id === m.id
          const editing = editingEmojiFor === m.id
          return (
            <li
              key={m.id}
              className={`relative rounded-2xl border p-3 flex flex-col items-center text-center transition ${
                active ? 'border-shutter bg-shutter/10' : 'border-stone-line bg-surface'
              }`}
            >
              <button onClick={() => setPendingMember(m)} className="flex flex-col items-center gap-1 w-full">
                <span className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center text-3xl">
                  {memberEmoji(m)}
                </span>
                <span className="font-display font-semibold text-lg leading-tight mt-1">{m.nome}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-stone">{m.ruolo}</span>
              </button>
              <div className="flex gap-3 mt-2 text-xs">
                <button
                  onClick={() => setEditingEmojiFor(editing ? null : m.id)}
                  className="text-stone hover:text-shutter"
                >
                  🎨 emoji
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Rimuovere ${m.nome} dalla famiglia?`)) deleteMember(m.id)
                  }}
                  className="text-stone hover:text-danger"
                >
                  rimuovi
                </button>
              </div>
              {editing && (
                <div className="mt-2 w-full">
                  <EmojiGrid
                    value={m.emoji}
                    onPick={async (e) => {
                      await updateEmoji(m.id, e)
                      setEditingEmojiFor(null)
                    }}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {!loading && members.length === 0 && (
        <p className="text-sm text-stone">Nessun membro ancora. Aggiungine uno qui sotto.</p>
      )}

      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-stone-line bg-surface p-4">
        <h2 className="font-display font-semibold text-lg">Aggiungi un membro</h2>
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-2xl shrink-0">
            {emoji}
          </span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome"
            className="flex-1 rounded-lg border border-stone-line bg-surface px-3 py-2"
          />
        </div>
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
        <div>
          <p className="text-sm text-ink-soft mb-1.5">Scegli la tua emoji</p>
          <EmojiGrid value={emoji} onPick={setEmoji} />
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
