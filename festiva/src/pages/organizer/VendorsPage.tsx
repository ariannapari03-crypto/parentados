import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { listPartners } from '../../lib/partners'
import { partnerIdsWithPromo } from '../../lib/promotions'
import { AREAS, CATEGORIES, metaEmoji, metaLabel } from '../../data/eventMeta'
import type { Partner, PartnerCategory } from '../../types/domain'

const MARKET_CATS = CATEGORIES.filter((c) => ['venue', 'catering', 'photography', 'decorations'].includes(c.value))

export function VendorsPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [partners, setPartners] = useState<Partner[] | null>(null)
  const [promoSet, setPromoSet] = useState<Set<string>>(new Set())
  const [cat, setCat] = useState<'all' | PartnerCategory>('all')
  const [search, setSearch] = useState('')
  const [onlyPromo, setOnlyPromo] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([listPartners(), partnerIdsWithPromo()])
      .then(([rows, set]) => {
        if (!active) return
        setPartners(rows)
        setPromoSet(set)
      })
      .catch(() => active && setPartners([]))
    return () => {
      active = false
    }
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (partners ?? []).filter((p) => {
      const mc = cat === 'all' || p.category === cat
      const mq = !q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
      const mp = !onlyPromo || promoSet.has(p.id)
      return mc && mq && mp
    })
  }, [partners, cat, search, onlyPromo, promoSet])

  const catTab = (value: 'all' | PartnerCategory, label: string) => {
    const on = cat === value
    return (
      <button
        key={value}
        onClick={() => setCat(value)}
        style={{
          fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
          border: 'none', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', flex: '0 0 auto',
          background: on ? 'var(--color-sage)' : 'var(--color-champagne)', color: on ? '#fff' : 'var(--color-charcoal)',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div style={{ paddingTop: 12 }}>
      <h1 style={{ margin: '0 0 2px', fontSize: '1.6rem', color: 'var(--ink)' }}>{t('navVendors')}</h1>
      <p style={{ margin: '0 0 12px', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{t('mSubtitle')}</p>

      <input className="fx-input" placeholder={t('mSearch')} value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 10 }} />

      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 8 }}>
        {catTab('all', t('mAll'))}
        {MARKET_CATS.map((c) => catTab(c.value as PartnerCategory, `${c.emoji} ${c.label[lang]}`))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 2px 14px', cursor: 'pointer' }}>
        <input type="checkbox" checked={onlyPromo} onChange={(e) => setOnlyPromo(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-gold)' }} />
        <span style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600 }}>🎟️ {t('mOnlyPromo')}</span>
      </label>

      {partners === null ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('loading')}</div>
      ) : visible.length === 0 ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('mNoResults')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 11 }}>
          {visible.map((p) => {
            const hasPromo = promoSet.has(p.id)
            const feat = p.featured
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/app/partner/${p.id}`)}
                className="fx-card"
                style={{
                  textAlign: 'left', cursor: 'pointer', padding: 14, border: feat ? '2px solid var(--color-gold)' : undefined,
                  background: feat ? 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dk))' : undefined,
                  color: feat ? '#fff' : undefined,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: feat ? 'rgba(255,255,255,.9)' : 'linear-gradient(135deg, var(--color-sage), var(--color-blush))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flex: '0 0 auto' }}>
                    {metaEmoji(CATEGORIES, p.category)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.98rem', color: feat ? '#fff' : 'var(--ink)' }}>{p.name}</span>
                      {feat && <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(255,255,255,.9)', color: 'var(--color-gold-dk)', borderRadius: 999, padding: '1px 7px' }}>★ {t('mFeatured')}</span>}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: feat ? 'rgba(255,255,255,.9)' : 'var(--ink-soft)', margin: '3px 0 6px' }}>
                      {[p.description, [p.city, metaLabel(AREAS, p.area, lang)].filter(Boolean).join(' · ')].filter(Boolean).join(' · ')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {p.rating != null && <span style={{ fontSize: '0.72rem', color: feat ? '#fff' : 'var(--color-gold-dk)' }}>★ {p.rating} <span style={{ opacity: 0.7 }}>({p.reviews_count})</span></span>}
                      {(p.price_min != null || p.price_max != null) && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, background: feat ? 'rgba(255,255,255,.9)' : 'var(--color-champagne)', color: 'var(--color-charcoal)', borderRadius: 7, padding: '2px 7px' }}>
                          €{p.price_min ?? ''}{p.price_max != null ? `–${p.price_max}` : ''}
                        </span>
                      )}
                      {hasPromo && <span style={{ fontSize: '0.68rem', fontWeight: 700, background: feat ? '#fff' : 'var(--color-gold)', color: feat ? 'var(--color-gold-dk)' : '#fff', borderRadius: 999, padding: '2px 8px' }}>🎟️ promo</span>}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
