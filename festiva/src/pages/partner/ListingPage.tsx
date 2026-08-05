import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { getMyPartner, upsertPartner, type PartnerInput } from '../../lib/partners'
import { AREAS, CATEGORIES } from '../../data/eventMeta'
import type { Partner, PartnerCategory } from '../../types/domain'

const PARTNER_CATS = CATEGORIES.filter((c) => c.value !== 'guests')
const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 5 }

export function PartnerListingPage() {
  const { t, lang } = useI18n()
  const { profile, session } = useAuth()
  const ownerId = profile?.id ?? session?.user?.id

  const [existing, setExisting] = useState<Partner | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<PartnerCategory>('venue')
  const [city, setCity] = useState('Alba')
  const [area, setArea] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!ownerId) return
    let active = true
    getMyPartner(ownerId)
      .then((p) => {
        if (!active) return
        if (p) {
          setExisting(p)
          setName(p.name)
          setCategory(p.category)
          setCity(p.city)
          setArea(p.area ?? '')
          setPriceMin(p.price_min != null ? String(p.price_min) : '')
          setPriceMax(p.price_max != null ? String(p.price_max) : '')
          setDescription(p.description ?? '')
        }
        setLoaded(true)
      })
      .catch(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [ownerId])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!ownerId || !name.trim()) return
    setBusy(true)
    setSaved(false)
    const input: PartnerInput = {
      name: name.trim(),
      category,
      city: city.trim() || 'Alba',
      area: area || null,
      price_min: priceMin ? Number(priceMin) : null,
      price_max: priceMax ? Number(priceMax) : null,
      description: description.trim() || null,
    }
    const { data } = await upsertPartner(ownerId, input, existing?.id)
    setBusy(false)
    if (data) {
      setExisting(data)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    }
  }

  if (!loaded) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('loading')}</div>

  return (
    <div style={{ paddingTop: 12 }}>
      <h1 style={{ margin: '0 0 2px', fontSize: '1.6rem', color: 'var(--ink)' }}>{t('plListing')}</h1>
      <p style={{ margin: '0 0 14px', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{t('plListingSub')}</p>

      <form onSubmit={save} className="fx-card" style={{ padding: 18, display: 'grid', gap: 13 }}>
        <label>
          <span style={labelStyle}>{t('plName')}</span>
          <input className="fx-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          <span style={labelStyle}>{t('plCategory')}</span>
          <select className="fx-input" value={category} onChange={(e) => setCategory(e.target.value as PartnerCategory)}>
            {PARTNER_CATS.map((c) => (
              <option key={c.value} value={c.value}>{c.emoji} {c.label[lang]}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <span style={labelStyle}>{t('plCity')}</span>
            <input className="fx-input" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label>
            <span style={labelStyle}>{t('plArea')}</span>
            <select className="fx-input" value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">—</option>
              {AREAS.map((a) => (
                <option key={a.value} value={a.value}>{a.label[lang]}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <span style={labelStyle}>{t('plPriceMin')}</span>
            <input className="fx-input" type="number" min={0} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
          </label>
          <label>
            <span style={labelStyle}>{t('plPriceMax')}</span>
            <input className="fx-input" type="number" min={0} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          </label>
        </div>
        <label>
          <span style={labelStyle}>{t('plDescription')}</span>
          <textarea className="fx-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('plDescriptionPh')} rows={2} style={{ resize: 'none' }} />
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="fx-btn fx-btn-primary" type="submit" disabled={busy}>
            {busy ? t('loading') : t('plSave')}
          </button>
          {saved && <span style={{ color: 'var(--color-sage-dk)', fontSize: '0.85rem', fontWeight: 700 }}>{t('plSaved')}</span>}
        </div>
      </form>
    </div>
  )
}
