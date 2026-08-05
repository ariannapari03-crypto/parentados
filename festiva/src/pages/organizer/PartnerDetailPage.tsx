import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { getPartner } from '../../lib/partners'
import { promotionsForPartner } from '../../lib/promotions'
import { promoBadge } from '../../lib/promoDisplay'
import { AREAS, CATEGORIES, metaEmoji, metaLabel } from '../../data/eventMeta'
import { RedeemModal } from '../../components/RedeemModal'
import type { Partner, Promotion } from '../../types/domain'

export function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [partner, setPartner] = useState<Partner | null | undefined>(undefined)
  const [promos, setPromos] = useState<Promotion[]>([])
  const [redeeming, setRedeeming] = useState<Promotion | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    Promise.all([getPartner(id), promotionsForPartner(id)])
      .then(([p, pr]) => {
        if (!active) return
        setPartner(p)
        setPromos(pr)
      })
      .catch(() => active && setPartner(null))
    return () => {
      active = false
    }
  }, [id])

  if (partner === undefined) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('loading')}</div>
  if (partner === null) {
    return (
      <div style={{ paddingTop: 24, textAlign: 'center' }}>
        <button className="fx-btn fx-btn-ghost" onClick={() => navigate('/app/vendors')}>{t('mDetails')}</button>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <button
        onClick={() => navigate('/app/vendors')}
        aria-label="←"
        style={{ background: 'var(--surface)', border: '1px solid var(--surface-line)', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'var(--ink)', fontSize: 16, marginBottom: 12 }}
      >
        ←
      </button>

      <div className="fx-card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, var(--color-sage), var(--color-blush))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flex: '0 0 auto' }}>
            {metaEmoji(CATEGORIES, partner.category)}
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--ink)' }}>{partner.name}</h1>
            <p style={{ margin: '2px 0 0', color: 'var(--ink-soft)', fontSize: '0.82rem' }}>
              {metaLabel(CATEGORIES, partner.category, lang)} · {[partner.city, metaLabel(AREAS, partner.area, lang)].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          {partner.rating != null && <span style={{ fontSize: '0.82rem', color: 'var(--color-gold-dk)', fontWeight: 700 }}>★ {partner.rating} <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>({partner.reviews_count} {t('mReviews')})</span></span>}
          {(partner.price_min != null || partner.price_max != null) && (
            <span style={{ fontSize: '0.78rem', fontWeight: 600, background: 'var(--color-champagne)', color: 'var(--color-charcoal)', borderRadius: 8, padding: '3px 9px' }}>
              €{partner.price_min ?? ''}{partner.price_max != null ? `–${partner.price_max}` : ''}
            </span>
          )}
        </div>
        {partner.description && <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', margin: '12px 0 0' }}>{partner.description}</p>}
      </div>

      <h2 style={{ fontSize: '1.1rem', color: 'var(--ink)', margin: '0 2px 10px' }}>🎟️ {t('pdPromos')}</h2>
      {promos.length === 0 ? (
        <div className="fx-card" style={{ padding: 18, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('pdNoPromos')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {promos.map((pr) => (
            <div key={pr.id} className="fx-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.95rem' }}>{pr.title}</div>
                  {pr.description && <p style={{ margin: '3px 0 0', color: 'var(--ink-soft)', fontSize: '0.78rem' }}>{pr.description}</p>}
                  {pr.min_guests != null && <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)', fontSize: '0.72rem' }}>👥 {t('pMinGuests')} {pr.min_guests} {t('pGuestsWord')}</p>}
                </div>
                <span style={{ background: 'var(--color-gold)', color: '#fff', borderRadius: 999, padding: '4px 10px', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
                  {promoBadge(pr.discount_type, pr.value, lang)}
                </span>
              </div>
              <button className="fx-btn fx-btn-gold" style={{ width: '100%', marginTop: 12 }} onClick={() => setRedeeming(pr)}>
                {t('pRedeem')}
              </button>
            </div>
          ))}
        </div>
      )}

      {redeeming && (
        <RedeemModal
          promotion={redeeming}
          partnerId={partner.id}
          partnerName={partner.name}
          onClose={() => setRedeeming(null)}
        />
      )}
    </div>
  )
}
