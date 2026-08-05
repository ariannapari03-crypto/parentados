import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { listEvents } from '../../lib/events'
import { listActivePromotions, type PromotionWithPartner } from '../../lib/promotions'
import { listRedemptions, type RedemptionRow } from '../../lib/bookings'
import { promoBadge } from '../../lib/promoDisplay'
import { AREAS, CATEGORIES, metaEmoji, metaLabel } from '../../data/eventMeta'
import { RedeemModal } from '../../components/RedeemModal'
import type { DiscountType, Promotion } from '../../types/domain'

export function PromoPage() {
  const { t, lang } = useI18n()
  const { profile, session } = useAuth()
  const ownerId = profile?.id ?? session?.user?.id

  const [eventIds, setEventIds] = useState<string[]>([])
  const [offers, setOffers] = useState<PromotionWithPartner[] | null>(null)
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([])
  const [redeeming, setRedeeming] = useState<PromotionWithPartner | null>(null)

  const refreshRedemptions = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return setRedemptions([])
    try {
      setRedemptions(await listRedemptions(ids))
    } catch {
      setRedemptions([])
    }
  }, [])

  useEffect(() => {
    let active = true
    listActivePromotions()
      .then((rows) => active && setOffers(rows))
      .catch(() => active && setOffers([]))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!ownerId) return
    let active = true
    listEvents(ownerId)
      .then((rows) => {
        if (!active) return
        const ids = rows.map((r) => r.id)
        setEventIds(ids)
        void refreshRedemptions(ids)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [ownerId, refreshRedemptions])

  return (
    <div style={{ paddingTop: 12 }}>
      <h1 style={{ margin: '0 0 2px', fontSize: '1.6rem', color: 'var(--ink)' }}>🎟️ {t('navPromo')}</h1>
      <p style={{ margin: '0 0 14px', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{t('mSubtitle')}</p>

      {redemptions.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.05rem', color: 'var(--ink)', margin: '0 2px 10px' }}>{t('pMyRedemptions')}</h2>
          <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
            {redemptions.map((r) => (
              <div key={r.id} style={{ background: 'linear-gradient(160deg, var(--color-gold), var(--color-gold-dk))', borderRadius: 14, padding: 14, color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', opacity: 0.9, fontWeight: 700 }}>{(r.partner?.name ?? '').toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.02rem', fontWeight: 700 }}>{r.promotion?.title ?? ''}</div>
                  </div>
                  {r.promotion && (
                    <span style={{ background: '#fff', color: 'var(--color-gold-dk)', borderRadius: 999, padding: '3px 9px', fontWeight: 800, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {promoBadge(r.promotion.discount_type as DiscountType, r.promotion.value, lang)}
                    </span>
                  )}
                </div>
                <div style={{ background: '#fff', color: 'var(--color-charcoal)', borderRadius: 10, padding: '9px 10px', marginTop: 10, textAlign: 'center', fontFamily: 'ui-monospace, monospace', fontWeight: 800, letterSpacing: '0.16em', fontSize: '1.15rem' }}>
                  {r.redemption_code}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 style={{ fontSize: '1.05rem', color: 'var(--ink)', margin: '0 2px 10px' }}>{t('pOffers')}</h2>
      {offers === null ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('loading')}</div>
      ) : offers.length === 0 ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('pNoOffers')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {offers.map((o) => (
            <div key={o.id} className="fx-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg, var(--color-sage), var(--color-blush))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flex: '0 0 auto' }}>
                  {metaEmoji(CATEGORIES, o.partner?.category ?? 'other')}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.92rem' }}>{o.title}</div>
                      <div style={{ color: 'var(--ink-soft)', fontSize: '0.74rem' }}>
                        {o.partner?.name}{o.partner?.area ? ` · ${metaLabel(AREAS, o.partner.area, lang)}` : ''}
                      </div>
                    </div>
                    <span style={{ background: 'var(--color-gold)', color: '#fff', borderRadius: 999, padding: '3px 9px', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
                      {promoBadge(o.discount_type, o.value, lang)}
                    </span>
                  </div>
                  <button className="fx-btn fx-btn-gold" style={{ width: '100%', marginTop: 10, padding: '9px 12px', fontSize: '0.84rem' }} onClick={() => setRedeeming(o)}>
                    {t('pRedeem')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {redeeming && redeeming.partner && (
        <RedeemModal
          promotion={redeeming as Promotion}
          partnerId={redeeming.partner.id}
          partnerName={redeeming.partner.name}
          onClose={() => setRedeeming(null)}
          onRedeemed={() => void refreshRedemptions(eventIds)}
        />
      )}
    </div>
  )
}
