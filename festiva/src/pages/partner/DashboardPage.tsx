import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { getMyPartner } from '../../lib/partners'
import { listPartnerPromotions } from '../../lib/promotions'
import { listRedemptionsForPartner } from '../../lib/bookings'
import type { Partner } from '../../types/domain'

export function PartnerDashboardPage() {
  const { t } = useI18n()
  const { profile, session } = useAuth()
  const ownerId = profile?.id ?? session?.user?.id

  const [partner, setPartner] = useState<Partner | null | undefined>(undefined)
  const [activePromos, setActivePromos] = useState(0)
  const [redemptions, setRedemptions] = useState(0)

  useEffect(() => {
    if (!ownerId) return
    let active = true
    getMyPartner(ownerId)
      .then(async (p) => {
        if (!active) return
        setPartner(p)
        if (p) {
          const [promos, reds] = await Promise.all([
            listPartnerPromotions(p.id),
            listRedemptionsForPartner(p.id),
          ])
          if (!active) return
          setActivePromos(promos.filter((x) => x.active).length)
          setRedemptions(reds.length)
        }
      })
      .catch(() => active && setPartner(null))
    return () => {
      active = false
    }
  }, [ownerId])

  return (
    <div style={{ paddingTop: 12 }}>
      <p style={{ margin: '0 0 2px', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>Area Locale · Alba</p>
      <h1 style={{ margin: '0 0 16px', fontSize: '1.6rem', color: 'var(--ink)' }}>
        {t('partnerHi')} {profile?.display_name?.split(' ')[0] ?? ''} 🏪
      </h1>

      <div
        className="fx-card"
        style={{ padding: 16, marginBottom: 14, background: 'var(--color-champagne)', border: '1px dashed var(--color-gold)' }}
      >
        <div style={{ fontWeight: 700, color: 'var(--color-charcoal)' }}>🎁 {t('trialActive')}</div>
        <p style={{ color: 'var(--color-charcoal)', fontSize: '0.85rem', margin: '4px 0 0' }}>{t('trialBody')}</p>
      </div>

      {partner === null ? (
        <div className="fx-card" style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🏪</div>
          <p style={{ color: 'var(--ink-soft)', margin: '0 0 14px' }}>{t('plCompleteFirst')}</p>
          <Link to="/app/listing" className="fx-btn fx-btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            {t('dashCompleteListing')}
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { n: activePromos, l: t('dashActivePromos') },
              { n: redemptions, l: t('dashRedemptions') },
              { n: partner?.rating != null ? `${partner.rating}★` : '—', l: t('dashRating') },
            ].map((k) => (
              <div key={k.l} className="fx-card" style={{ padding: '14px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)' }}>{k.n}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--ink-soft)', marginTop: 3 }}>{k.l}</div>
              </div>
            ))}
          </div>
          <Link to="/app/listing" className="fx-btn fx-btn-ghost" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
            {t('dashOpenListing')} · {partner?.name}
          </Link>
        </>
      )}
    </div>
  )
}
