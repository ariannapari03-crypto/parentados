import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { createEvent, type NewEventInput } from '../../lib/events'
import type { EventType } from '../../types/domain'
import {
  AREAS,
  EVENT_TYPES,
  GUEST_TYPES,
  VENUE_TYPES,
  budgetAllocation,
  metaLabel,
} from '../../data/eventMeta'

interface Draft {
  type: EventType | ''
  title: string
  event_date: string
  event_time: string
  duration_h: number
  guest_count: number
  guest_type: string
  budget_total: number
  city: string
  area: string
  venue_type: string
}

const TOTAL_STEPS = 5

const labelStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 700,
  color: 'var(--ink)',
  display: 'block',
  marginBottom: 6,
}

export function CreatePage() {
  const { t, lang } = useI18n()
  const { profile, session } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [d, setD] = useState<Draft>({
    type: '',
    title: '',
    event_date: '',
    event_time: '19:00',
    duration_h: 4,
    guest_count: 40,
    guest_type: '',
    budget_total: 800,
    city: 'Alba',
    area: '',
    venue_type: '',
  })

  const update = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }))

  const alloc = useMemo(
    () => budgetAllocation((d.type || 'other') as EventType, d.budget_total),
    [d.type, d.budget_total],
  )

  const canAdvance = step === 1 ? d.type !== '' : true

  async function finish() {
    const ownerId = profile?.id ?? session?.user?.id
    if (!ownerId || d.type === '') return
    setBusy(true)
    setError(null)
    const input: NewEventInput = {
      type: d.type,
      title: d.title.trim() || metaLabel(EVENT_TYPES, d.type, lang),
      event_date: d.event_date || null,
      event_time: d.event_time || null,
      duration_h: d.duration_h,
      guest_count: d.guest_count,
      guest_type: d.guest_type || null,
      budget_total: d.budget_total,
      city: d.city.trim() || 'Alba',
      area: d.area || null,
      venue_type: d.venue_type || null,
    }
    const { error } = await createEvent(ownerId, input)
    setBusy(false)
    if (error) setError(t('wSaveError'))
    else navigate('/app', { replace: true })
  }

  function next() {
    if (step < TOTAL_STEPS) setStep(step + 1)
    else void finish()
  }
  function back() {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div style={{ paddingTop: 12, paddingBottom: 8 }}>
      {/* progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
            <span
              key={n}
              style={{
                width: 22,
                height: 6,
                borderRadius: 3,
                background:
                  n < step ? 'var(--color-gold)' : n === step ? 'var(--color-sage)' : 'var(--surface-line)',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)' }}>
          {t('wStep')} {step} {t('wOf')} {TOTAL_STEPS}
        </span>
      </div>

      <div className="fx-card" style={{ padding: 20, minHeight: 320 }}>
        {step === 1 && (
          <>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--ink)' }}>{t('wQType')}</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: '4px 0 14px' }}>{t('wQTypeSub')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {EVENT_TYPES.map((et) => {
                const sel = d.type === et.value
                return (
                  <button
                    key={et.value}
                    type="button"
                    onClick={() => update({ type: et.value })}
                    style={{
                      textAlign: 'center',
                      borderRadius: 13,
                      padding: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      border: `2px solid ${sel ? 'var(--color-sage)' : 'var(--surface-line)'}`,
                      background: sel
                        ? 'linear-gradient(135deg, var(--color-sage), var(--color-sage-dk))'
                        : 'var(--surface)',
                      color: sel ? '#fff' : 'var(--ink)',
                    }}
                  >
                    <div style={{ fontSize: 26 }}>{et.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: 4 }}>{et.label[lang]}</div>
                    <div style={{ fontSize: '0.62rem', opacity: 0.8, marginTop: 1 }}>{et.hint?.[lang]}</div>
                  </button>
                )
              })}
            </div>
            <label>
              <span style={labelStyle}>{t('wEventName')}</span>
              <input
                className="fx-input"
                type="text"
                placeholder={t('wEventNamePh')}
                value={d.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--ink)' }}>{t('wQWhen')}</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: '4px 0 14px' }}>{t('wQWhenSub')}</p>
            <div style={{ display: 'grid', gap: 12 }}>
              <label>
                <span style={labelStyle}>{t('wDate')}</span>
                <input className="fx-input" type="date" value={d.event_date} onChange={(e) => update({ event_date: e.target.value })} />
              </label>
              <label>
                <span style={labelStyle}>{t('wTime')}</span>
                <input className="fx-input" type="time" value={d.event_time} onChange={(e) => update({ event_time: e.target.value })} />
              </label>
              <label>
                <span style={labelStyle}>{t('wDuration')}</span>
                <select className="fx-input" value={d.duration_h} onChange={(e) => update({ duration_h: Number(e.target.value) })}>
                  {[2, 3, 4, 6, 8].map((h) => (
                    <option key={h} value={h}>{h} {t('wHours')}</option>
                  ))}
                  <option value={12}>{t('wFullDay')}</option>
                </select>
              </label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--ink)' }}>{t('wQGuests')}</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: '4px 0 14px' }}>{t('wQGuestsSub')}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.85rem' }}>{t('wGuestCount')}</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-sage-dk)' }}>{d.guest_count}</span>
            </div>
            <input
              type="range" min={10} max={200} value={d.guest_count} step={1}
              onChange={(e) => update({ guest_count: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-sage)' }}
            />
            <div style={{ marginTop: 18 }}>
              <span style={labelStyle}>{t('wGuestType')}</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {GUEST_TYPES.map((g) => {
                  const sel = d.guest_type === g.value
                  return (
                    <button
                      key={g.value} type="button" onClick={() => update({ guest_type: g.value })}
                      style={{
                        fontFamily: 'inherit', borderRadius: 12, padding: 11, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                        border: `2px solid ${sel ? 'var(--color-sage)' : 'var(--surface-line)'}`,
                        background: sel ? 'var(--color-sage)' : 'var(--surface)', color: sel ? '#fff' : 'var(--ink)',
                      }}
                    >
                      {g.emoji} {g.label[lang]}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--ink)' }}>{t('wQBudget')}</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: '4px 0 14px' }}>{t('wQBudgetSub')}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.85rem' }}>{t('wTotalBudget')}</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-sage-dk)' }}>€{d.budget_total}</span>
            </div>
            <input
              type="range" min={200} max={5000} value={d.budget_total} step={50}
              onChange={(e) => update({ budget_total: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-sage)' }}
            />
            <div style={{ marginTop: 18 }}>
              <span style={labelStyle}>{t('wAllocation')}</span>
              <div style={{ display: 'grid', gap: 7 }}>
                {[
                  { k: t('wCatVenue'), e: '🏛️', v: alloc.venue },
                  { k: t('wCatCatering'), e: '🍽️', v: alloc.catering },
                  { k: t('wCatDecor'), e: '🎨', v: alloc.decorations },
                  { k: t('wCatPhoto'), e: '📸', v: alloc.photography },
                ].map((row) => (
                  <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-champagne)', borderRadius: 10, padding: '9px 12px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-charcoal)' }}>{row.e} {row.k}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>€{row.v}</span>
                  </div>
                ))}
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.75rem', marginTop: 10, textAlign: 'right' }}>
                ≈ €{d.guest_count > 0 ? Math.round(d.budget_total / d.guest_count) : 0} {t('wPerPerson')}
              </p>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--ink)' }}>{t('wQWhere')}</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', margin: '4px 0 14px' }}>{t('wQWhereSub')}</p>
            <label>
              <span style={labelStyle}>{t('wCity')}</span>
              <select className="fx-input" value={d.city} onChange={(e) => update({ city: e.target.value })}>
                {['Alba', 'Bra', 'Asti', 'Cuneo', 'Torino'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <div style={{ marginTop: 14 }}>
              <span style={labelStyle}>{t('wArea')}</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {AREAS.map((a) => {
                  const sel = d.area === a.value
                  return (
                    <button key={a.value} type="button" onClick={() => update({ area: a.value })}
                      style={{
                        fontFamily: 'inherit', borderRadius: 12, padding: 11, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        border: `2px solid ${sel ? 'var(--color-sage)' : 'var(--surface-line)'}`,
                        background: sel ? 'var(--color-sage)' : 'var(--surface)', color: sel ? '#fff' : 'var(--ink)',
                      }}>
                      {a.emoji} {a.label[lang]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <span style={labelStyle}>{t('wVenueType')}</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {VENUE_TYPES.map((v) => {
                  const sel = d.venue_type === v.value
                  return (
                    <button key={v.value} type="button" onClick={() => update({ venue_type: v.value })}
                      style={{
                        fontFamily: 'inherit', borderRadius: 12, padding: 11, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        border: `2px solid ${sel ? 'var(--color-sage)' : 'var(--surface-line)'}`,
                        background: sel ? 'var(--color-sage)' : 'var(--surface)', color: sel ? '#fff' : 'var(--ink)',
                      }}>
                      {v.emoji} {v.label[lang]}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {error && <p style={{ color: '#b3453f', fontSize: '0.85rem', marginTop: 10 }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
        <button className="fx-btn fx-btn-ghost" type="button" onClick={back} disabled={step === 1 || busy} style={{ flex: '0 0 auto' }}>
          ← {t('wBack')}
        </button>
        <button className="fx-btn fx-btn-primary" type="button" onClick={next} disabled={!canAdvance || busy} style={{ flex: '0 0 auto' }}>
          {busy ? t('wSaving') : step === TOTAL_STEPS ? t('wFinish') : `${t('wNext')} →`}
        </button>
      </div>
    </div>
  )
}
