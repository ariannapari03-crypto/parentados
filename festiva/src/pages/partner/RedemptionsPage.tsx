import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { getMyPartner } from '../../lib/partners'
import { listRedemptionsForPartner, type RedemptionRow } from '../../lib/bookings'
import { promoBadge } from '../../lib/promoDisplay'
import { formatDate } from '../../lib/format'
import type { DiscountType, Partner } from '../../types/domain'

export function PartnerRedemptionsPage() {
  const { t, lang } = useI18n()
  const { profile, session } = useAuth()
  const ownerId = profile?.id ?? session?.user?.id

  const [partner, setPartner] = useState<Partner | null | undefined>(undefined)
  const [rows, setRows] = useState<RedemptionRow[]>([])

  useEffect(() => {
    if (!ownerId) return
    let active = true
    getMyPartner(ownerId)
      .then(async (p) => {
        if (!active) return
        setPartner(p)
        if (p) setRows(await listRedemptionsForPartner(p.id))
      })
      .catch(() => active && setPartner(null))
    return () => {
      active = false
    }
  }, [ownerId])

  if (partner === undefined) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('loading')}</div>

  if (partner === null) {
    return (
      <div style={{ paddingTop: 24 }}>
        <div className="fx-card" style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎫</div>
          <p style={{ color: 'var(--ink-soft)', margin: '0 0 14px' }}>{t('plCompleteFirst')}</p>
          <Link to="/app/listing" className="fx-btn fx-btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            {t('dashCompleteListing')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 12 }}>
      <h1 style={{ margin: '0 0 12px', fontSize: '1.5rem', color: 'var(--ink)' }}>🎫 {t('plRedemptions')}</h1>

      {rows.length === 0 ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('plNoRedemptions')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 9 }}>
          {rows.map((r) => (
            <div key={r.id} className="fx-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>{r.promotion?.title ?? '—'}</div>
                <div style={{ color: 'var(--ink-soft)', fontSize: '0.72rem', marginTop: 2 }}>{formatDate(r.created_at.slice(0, 10), lang)}</div>
              </div>
              {r.promotion && (
                <span style={{ background: 'var(--color-champagne)', color: 'var(--color-charcoal)', borderRadius: 999, padding: '3px 9px', fontWeight: 700, fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                  {promoBadge(r.promotion.discount_type as DiscountType, r.promotion.value, lang)}
                </span>
              )}
              <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, letterSpacing: '0.1em', fontSize: '0.86rem', color: 'var(--color-gold-dk)', flex: '0 0 auto' }}>
                {r.redemption_code}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
