import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { getMyPartner } from '../../lib/partners'
import {
  createPromotion,
  deletePromotion,
  listPartnerPromotions,
  updatePromotion,
  type PromotionInput,
} from '../../lib/promotions'
import { promoBadge } from '../../lib/promoDisplay'
import { formatDate } from '../../lib/format'
import { Modal } from '../../components/Modal'
import type { DiscountType, Partner, Promotion } from '../../types/domain'

const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 5 }

export function PartnerPromoPage() {
  const { t, lang } = useI18n()
  const { profile, session } = useAuth()
  const ownerId = profile?.id ?? session?.user?.id

  const [partner, setPartner] = useState<Partner | null | undefined>(undefined)
  const [promos, setPromos] = useState<Promotion[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)

  useEffect(() => {
    if (!ownerId) return
    let active = true
    getMyPartner(ownerId)
      .then(async (p) => {
        if (!active) return
        setPartner(p)
        if (p) setPromos(await listPartnerPromotions(p.id))
      })
      .catch(() => active && setPartner(null))
    return () => {
      active = false
    }
  }, [ownerId])

  async function addPromo(input: PromotionInput) {
    if (!partner) return
    const created = await createPromotion(partner.id, input)
    if (created) setPromos((prev) => [created, ...prev])
  }
  async function editPromo(id: string, input: PromotionInput) {
    await updatePromotion(id, input)
    setPromos((prev) => prev.map((x) => (x.id === id ? { ...x, ...input } : x)))
  }
  async function toggleActive(p: Promotion) {
    const next = !p.active
    setPromos((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: next } : x)))
    try {
      await updatePromotion(p.id, { active: next })
    } catch {
      setPromos((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: p.active } : x)))
    }
  }
  async function removePromo(id: string) {
    await deletePromotion(id)
    setPromos((prev) => prev.filter((x) => x.id !== id))
  }

  if (partner === undefined) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('loading')}</div>

  if (partner === null) {
    return (
      <div style={{ paddingTop: 24 }}>
        <div className="fx-card" style={{ padding: 22, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏪</div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--ink)' }}>{t('plPromos')}</h1>
        <button className="fx-btn fx-btn-gold" style={{ padding: '8px 12px', fontSize: '0.82rem' }} onClick={() => { setEditing(null); setOpen(true) }}>
          + {t('plAddPromo')}
        </button>
      </div>

      {promos.length === 0 ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('plNoPromos')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {promos.map((p) => (
            <div key={p.id} className="fx-card" style={{ padding: 14, opacity: p.active ? 1 : 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.95rem' }}>{p.title}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, borderRadius: 999, padding: '2px 8px', background: p.active ? 'rgba(168,181,160,0.2)' : 'var(--surface-line)', color: p.active ? 'var(--color-sage-dk)' : 'var(--ink-soft)' }}>
                      {p.active ? t('plActiveWord') : t('plDraftWord')}
                    </span>
                  </div>
                  {p.description && <p style={{ margin: '3px 0 0', color: 'var(--ink-soft)', fontSize: '0.76rem' }}>{p.description}</p>}
                  {p.valid_to && <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)', fontSize: '0.7rem' }}>{t('plValidTo')} {formatDate(p.valid_to, lang)}</p>}
                </div>
                <span style={{ background: 'var(--color-gold)', color: '#fff', borderRadius: 999, padding: '4px 10px', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
                  {promoBadge(p.discount_type, p.value, lang)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', color: 'var(--ink)' }}>
                  <input type="checkbox" checked={p.active} onChange={() => void toggleActive(p)} style={{ width: 16, height: 16, accentColor: 'var(--color-sage)' }} />
                  {t('plActiveWord')}
                </label>
                <button className="fx-btn fx-btn-ghost" style={{ marginLeft: 'auto', padding: '7px 12px', fontSize: '0.78rem' }} onClick={() => { setEditing(p); setOpen(true) }}>
                  {t('plEditPromo')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <PromoForm
          initial={editing}
          onClose={() => setOpen(false)}
          onDelete={editing ? () => { void removePromo(editing.id); setOpen(false) } : undefined}
          onSubmit={async (input) => {
            if (editing) await editPromo(editing.id, input)
            else await addPromo(input)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

function PromoForm({
  initial,
  onSubmit,
  onClose,
  onDelete,
}: {
  initial: Promotion | null
  onSubmit: (input: PromotionInput) => Promise<void>
  onClose: () => void
  onDelete?: () => void
}) {
  const { t } = useI18n()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [discountType, setDiscountType] = useState<DiscountType>(initial?.discount_type ?? 'percent')
  const [value, setValue] = useState(initial?.value != null ? String(initial.value) : '')
  const [minGuests, setMinGuests] = useState(initial?.min_guests != null ? String(initial.min_guests) : '')
  const [validTo, setValidTo] = useState(initial?.valid_to ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      discount_type: discountType,
      value: discountType === 'package' ? null : value ? Number(value) : null,
      min_guests: minGuests ? Number(minGuests) : null,
      valid_to: validTo || null,
      terms: initial?.terms ?? null,
      code_prefix: initial?.code_prefix ?? 'FST-AL',
      active,
    })
    setBusy(false)
  }

  return (
    <Modal title={initial ? t('plEditPromo') : t('plAddPromo')} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label>
          <span style={labelStyle}>{t('plPromoTitle')}</span>
          <input className="fx-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('plPromoTitlePh')} required />
        </label>
        <label>
          <span style={labelStyle}>{t('plPromoDesc')}</span>
          <textarea className="fx-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ resize: 'none' }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: discountType === 'package' ? '1fr' : '1.4fr 1fr', gap: 12 }}>
          <label>
            <span style={labelStyle}>{t('plDiscountType')}</span>
            <select className="fx-input" value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)}>
              <option value="percent">{t('dtPercent')}</option>
              <option value="fixed">{t('dtFixed')}</option>
              <option value="package">{t('dtPackage')}</option>
            </select>
          </label>
          {discountType !== 'package' && (
            <label>
              <span style={labelStyle}>{t('plValue')}</span>
              <input className="fx-input" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
            </label>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <span style={labelStyle}>{t('plMinGuestsField')}</span>
            <input className="fx-input" type="number" min={0} value={minGuests} onChange={(e) => setMinGuests(e.target.value)} />
          </label>
          <label>
            <span style={labelStyle}>{t('plValidTo')}</span>
            <input className="fx-input" type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
          </label>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--color-sage)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>{t('plActive')}</span>
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
