import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { listEvents } from '../lib/events'
import { createRedemption, generateCode } from '../lib/bookings'
import { promoBadge } from '../lib/promoDisplay'
import { formatDate } from '../lib/format'
import { EVENT_TYPES, metaLabel } from '../data/eventMeta'
import { Modal } from './Modal'
import type { EventRecord, Promotion } from '../types/domain'

const LAST_EVENT_KEY = 'festiva_last_event'

interface Props {
  promotion: Promotion
  partnerId: string
  partnerName: string
  onClose: () => void
  onRedeemed?: () => void
}

export function RedeemModal({ promotion, partnerId, partnerName, onClose, onRedeemed }: Props) {
  const { t, lang } = useI18n()
  const { profile, session } = useAuth()
  const ownerId = profile?.id ?? session?.user?.id

  const [events, setEvents] = useState<EventRecord[] | null>(null)
  const [eventId, setEventId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)

  useEffect(() => {
    if (!ownerId) return
    let active = true
    listEvents(ownerId)
      .then((rows) => {
        if (!active) return
        setEvents(rows)
        const saved = localStorage.getItem(LAST_EVENT_KEY)
        setEventId(rows.find((r) => r.id === saved)?.id ?? rows[0]?.id ?? '')
      })
      .catch(() => active && setEvents([]))
    return () => {
      active = false
    }
  }, [ownerId])

  async function confirm() {
    if (!eventId) return
    setBusy(true)
    setError(null)
    const newCode = generateCode(promotion.code_prefix)
    const { error } = await createRedemption({ eventId, partnerId, promotionId: promotion.id, code: newCode })
    setBusy(false)
    if (error) {
      setError(t('rError'))
      return
    }
    localStorage.setItem(LAST_EVENT_KEY, eventId)
    setCode(newCode)
    onRedeemed?.()
  }

  const badge = promoBadge(promotion.discount_type, promotion.value, lang)

  return (
    <Modal title={code ? t('rDone') : t('pRedeem')} onClose={onClose}>
      {code ? (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              background: 'linear-gradient(160deg, var(--color-gold), var(--color-gold-dk))',
              borderRadius: 16,
              padding: 20,
              color: '#fff',
            }}
          >
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.14em', fontWeight: 700, opacity: 0.9 }}>{partnerName.toUpperCase()}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, margin: '2px 0 10px' }}>
              {promotion.title} · {badge}
            </div>
            <div style={{ background: '#fff', color: 'var(--color-charcoal)', borderRadius: 12, padding: '12px 10px' }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.16em' }}>{code}</div>
            </div>
            <div style={{ fontSize: '0.72rem', opacity: 0.92, marginTop: 8 }}>{t('rShowCode')}</div>
            {promotion.valid_to && (
              <div style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: 2 }}>
                {t('rValidUntil')} {formatDate(promotion.valid_to, lang)}
              </div>
            )}
          </div>
          <button className="fx-btn fx-btn-primary" onClick={onClose} style={{ width: '100%', marginTop: 14 }}>
            {t('rClose')}
          </button>
        </div>
      ) : events === null ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: 12 }}>{t('loading')}</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 8 }}>
          <p style={{ color: 'var(--ink-soft)', margin: '0 0 14px' }}>{t('rNoEvents')}</p>
          <Link to="/app/create" className="fx-btn fx-btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }} onClick={onClose}>
            + {t('newEvent')}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              background: 'var(--color-champagne)',
              borderRadius: 12,
              padding: '11px 14px',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-charcoal)', fontSize: '0.9rem' }}>{promotion.title}</div>
              <div style={{ color: 'var(--warm)', fontSize: '0.72rem' }}>{partnerName}</div>
            </div>
            <span style={{ background: 'var(--color-gold)', color: '#fff', borderRadius: 999, padding: '4px 10px', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{badge}</span>
          </div>

          <label>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 5 }}>{t('rPickEvent')}</span>
            <select className="fx-input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title || metaLabel(EVENT_TYPES, ev.type, lang)}</option>
              ))}
            </select>
          </label>

          {error && <p style={{ color: '#b3453f', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

          <button className="fx-btn fx-btn-gold" onClick={confirm} disabled={busy || !eventId} style={{ width: '100%' }}>
            {busy ? t('loading') : t('rConfirm')}
          </button>
        </div>
      )}
    </Modal>
  )
}
