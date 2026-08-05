import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { listEvents } from '../../lib/events'
import { createGuest, deleteGuest, listGuests, updateGuest, type GuestInput } from '../../lib/guests'
import { downloadCsv } from '../../lib/csv'
import { Modal } from '../../components/Modal'
import { EVENT_TYPES, RSVP_COLOR, RSVP_STATES, metaLabel } from '../../data/eventMeta'
import type { EventRecord, Guest, Rsvp } from '../../types/domain'

const LAST_EVENT_KEY = 'festiva_last_event'
const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 5 }

export function GuestsPage() {
  const { t, lang } = useI18n()
  const { profile, session } = useAuth()
  const ownerId = profile?.id ?? session?.user?.id

  const [events, setEvents] = useState<EventRecord[] | null>(null)
  const [eventId, setEventId] = useState<string>('')
  const [guests, setGuests] = useState<Guest[] | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | Rsvp>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Guest | null>(null)

  // Carica gli eventi e ripristina l'ultimo selezionato.
  useEffect(() => {
    if (!ownerId) return
    let active = true
    listEvents(ownerId)
      .then((rows) => {
        if (!active) return
        setEvents(rows)
        const saved = localStorage.getItem(LAST_EVENT_KEY)
        const chosen = rows.find((r) => r.id === saved)?.id ?? rows[0]?.id ?? ''
        setEventId(chosen)
      })
      .catch(() => active && setEvents([]))
    return () => {
      active = false
    }
  }, [ownerId])

  // Carica gli invitati dell'evento selezionato.
  useEffect(() => {
    if (!eventId) {
      setGuests([])
      return
    }
    localStorage.setItem(LAST_EVENT_KEY, eventId)
    let active = true
    setGuests(null)
    listGuests(eventId)
      .then((rows) => active && setGuests(rows))
      .catch(() => active && setGuests([]))
    return () => {
      active = false
    }
  }, [eventId])

  const counts = useMemo(() => {
    const g = guests ?? []
    return {
      confirmed: g.filter((x) => x.rsvp === 'confirmed').length,
      pending: g.filter((x) => x.rsvp === 'pending').length,
      declined: g.filter((x) => x.rsvp === 'declined').length,
    }
  }, [guests])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (guests ?? []).filter((g) => {
      const matchesQ = !q || g.name.toLowerCase().includes(q) || (g.email ?? '').toLowerCase().includes(q)
      const matchesF = filter === 'all' || g.rsvp === filter
      return matchesQ && matchesF
    })
  }, [guests, search, filter])

  async function addGuest(input: GuestInput) {
    const created = await createGuest(eventId, input)
    if (created) setGuests((prev) => [...(prev ?? []), created])
  }
  async function editGuest(id: string, input: GuestInput) {
    await updateGuest(id, input)
    setGuests((prev) => (prev ?? []).map((x) => (x.id === id ? { ...x, ...input } : x)))
  }
  async function removeGuest(id: string) {
    await deleteGuest(id)
    setGuests((prev) => (prev ?? []).filter((x) => x.id !== id))
  }

  function exportCsv() {
    const rows: string[][] = [
      [t('gName'), t('gEmail'), t('gPhone'), t('gRsvp'), t('gDietary'), '+1'],
      ...(guests ?? []).map((g) => [
        g.name,
        g.email ?? '',
        g.phone ?? '',
        metaLabel(RSVP_STATES, g.rsvp, lang),
        g.dietary ?? '',
        g.plus_one ? '1' : '0',
      ]),
    ]
    const ev = events?.find((e) => e.id === eventId)
    downloadCsv(`invitati-${ev?.title || 'evento'}.csv`, rows)
  }

  if (events === null) {
    return <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('loading')}</div>
  }
  if (events.length === 0) {
    return (
      <div style={{ paddingTop: 24 }}>
        <div className="fx-card" style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>👥</div>
          <p style={{ color: 'var(--ink-soft)', margin: '0 0 14px' }}>{t('gNoEvents')}</p>
          <Link to="/app/create" className="fx-btn fx-btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            + {t('newEvent')}
          </Link>
        </div>
      </div>
    )
  }

  const chip = (value: 'all' | Rsvp, label: string, n?: number) => {
    const on = filter === value
    return (
      <button
        key={value}
        onClick={() => setFilter(value)}
        style={{
          fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
          border: 'none', borderRadius: 999, padding: '7px 12px', cursor: 'pointer', flex: '0 0 auto',
          background: on ? 'var(--color-sage)' : 'var(--color-champagne)', color: on ? '#fff' : 'var(--color-charcoal)',
        }}
      >
        {label}{n !== undefined ? ` (${n})` : ''}
      </button>
    )
  }

  return (
    <div style={{ paddingTop: 12 }}>
      <h1 style={{ margin: '0 0 12px', fontSize: '1.6rem', color: 'var(--ink)' }}>{t('navGuests')}</h1>

      {events.length > 1 && (
        <select className="fx-input" value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ marginBottom: 12 }}>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title || metaLabel(EVENT_TYPES, e.type, lang)}
            </option>
          ))}
        </select>
      )}

      <div className="fx-card" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div><div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-sage-dk)' }}>{counts.confirmed}</div><div style={{ fontSize: '0.62rem', color: 'var(--ink-soft)' }}>{t('gConfirmed')}</div></div>
          <div><div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold-dk)' }}>{counts.pending}</div><div style={{ fontSize: '0.62rem', color: 'var(--ink-soft)' }}>{t('gPending')}</div></div>
          <div><div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b3453f' }}>{counts.declined}</div><div style={{ fontSize: '0.62rem', color: 'var(--ink-soft)' }}>{t('gDeclined')}</div></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className="fx-btn fx-btn-primary" style={{ flex: 1, padding: '9px 12px', fontSize: '0.82rem' }} onClick={() => { setEditing(null); setModalOpen(true) }}>
          + {t('gAdd')}
        </button>
        <button className="fx-btn fx-btn-ghost" style={{ flex: '0 0 auto', padding: '9px 12px', fontSize: '0.82rem' }} onClick={exportCsv} disabled={(guests ?? []).length === 0}>
          📋 {t('gExport')}
        </button>
      </div>

      <input className="fx-input" placeholder={t('gSearch')} value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 10 }} />

      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 8, marginBottom: 4 }}>
        {chip('all', t('gAll'), (guests ?? []).length)}
        {chip('confirmed', t('gConfirmed'), counts.confirmed)}
        {chip('pending', t('gPending'), counts.pending)}
        {chip('declined', t('gDeclined'), counts.declined)}
      </div>

      {guests === null ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('loading')}</div>
      ) : visible.length === 0 ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('gEmpty')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {visible.map((g) => (
            <div key={g.id} className="fx-card" style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-sage), var(--color-blush))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flex: '0 0 auto' }}>
                {g.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>{g.name}</div>
                <div style={{ color: 'var(--ink-soft)', fontSize: '0.72rem' }}>
                  {g.email || g.phone || ''}
                  {g.dietary ? ` · 🥗 ${g.dietary}` : ''}
                </div>
              </div>
              {g.plus_one && <span style={{ fontSize: '0.66rem', fontWeight: 700, background: 'var(--color-champagne)', color: 'var(--color-charcoal)', borderRadius: 999, padding: '2px 7px', flex: '0 0 auto' }}>+1</span>}
              <span title={metaLabel(RSVP_STATES, g.rsvp, lang)} style={{ width: 11, height: 11, borderRadius: '50%', background: RSVP_COLOR[g.rsvp], flex: '0 0 auto' }} />
              <button onClick={() => { setEditing(g); setModalOpen(true) }} aria-label={t('gEdit')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, opacity: 0.7, flex: '0 0 auto' }}>⚙️</button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <GuestForm
          initial={editing}
          onClose={() => setModalOpen(false)}
          onDelete={editing ? () => { void removeGuest(editing.id); setModalOpen(false) } : undefined}
          onSubmit={async (input) => {
            if (editing) await editGuest(editing.id, input)
            else await addGuest(input)
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

function GuestForm({
  initial,
  onSubmit,
  onClose,
  onDelete,
}: {
  initial: Guest | null
  onSubmit: (input: GuestInput) => Promise<void>
  onClose: () => void
  onDelete?: () => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [rsvp, setRsvp] = useState<Rsvp>(initial?.rsvp ?? 'pending')
  const [dietary, setDietary] = useState(initial?.dietary ?? '')
  const [plusOne, setPlusOne] = useState(initial?.plus_one ?? false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    await onSubmit({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      rsvp,
      dietary: dietary.trim() || null,
      plus_one: plusOne,
    })
    setBusy(false)
  }

  return (
    <Modal title={initial ? t('gEdit') : t('gAdd')} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label>
          <span style={labelStyle}>{t('gName')}</span>
          <input className="fx-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <span style={labelStyle}>{t('gEmail')}</span>
            <input className="fx-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            <span style={labelStyle}>{t('gPhone')}</span>
            <input className="fx-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>
        <label>
          <span style={labelStyle}>{t('gRsvp')}</span>
          <select className="fx-input" value={rsvp} onChange={(e) => setRsvp(e.target.value as Rsvp)}>
            {RSVP_STATES.map((s) => (
              <option key={s.value} value={s.value}>{s.emoji} {s.label.it}</option>
            ))}
          </select>
        </label>
        <label>
          <span style={labelStyle}>{t('gDietary')}</span>
          <input className="fx-input" value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder={t('gDietaryPh')} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={plusOne} onChange={(e) => setPlusOne(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--color-sage)' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink)' }}>{t('gPlusOne')}</span>
        </label>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {onDelete && (
            <button type="button" className="fx-btn fx-btn-ghost" onClick={onDelete} style={{ borderColor: '#d8a3a0', color: '#b3453f' }}>
              {t('clDelete')}
            </button>
          )}
          <button type="submit" className="fx-btn fx-btn-primary" disabled={busy} style={{ marginLeft: 'auto' }}>
            {t('clSave')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
