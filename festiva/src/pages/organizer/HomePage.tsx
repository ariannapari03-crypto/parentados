import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { listEvents } from '../../lib/events'
import { taskStatsForEvents } from '../../lib/tasks'
import { formatDate } from '../../lib/format'
import { EVENT_TYPES, metaEmoji, metaLabel, setupProgress } from '../../data/eventMeta'
import { ProgressRing } from '../../components/ProgressRing'
import type { EventRecord } from '../../types/domain'

type Stats = Record<string, { total: number; done: number }>

export function HomePage() {
  const { t, lang } = useI18n()
  const { profile, session } = useAuth()
  const ownerId = profile?.id ?? session?.user?.id

  const [events, setEvents] = useState<EventRecord[] | null>(null)
  const [stats, setStats] = useState<Stats>({})

  useEffect(() => {
    if (!ownerId) return
    let active = true
    listEvents(ownerId)
      .then(async (rows) => {
        if (!active) return
        setEvents(rows)
        if (rows.length) {
          const s = await taskStatsForEvents(rows.map((r) => r.id))
          if (active) setStats(s)
        }
      })
      .catch(() => active && setEvents([]))
    return () => {
      active = false
    }
  }, [ownerId])

  const progressFor = (ev: EventRecord): number => {
    const s = stats[ev.id]
    if (s && s.total > 0) return Math.round((s.done / s.total) * 100)
    return setupProgress(ev)
  }

  return (
    <div style={{ paddingTop: 12 }}>
      <p style={{ margin: '0 0 2px', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>{t('tagline')}</p>
      <h1 style={{ margin: '0 0 16px', fontSize: '1.7rem', color: 'var(--ink)' }}>
        {t('partnerHi')} {profile?.display_name?.split(' ')[0] ?? ''} 👋
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{t('yourEvents')}</div>
        <Link to="/app/create" className="fx-btn fx-btn-primary" style={{ textDecoration: 'none', padding: '8px 12px', fontSize: '0.82rem' }}>
          + {t('newEvent')}
        </Link>
      </div>

      {events === null ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>
          {t('loading')}
        </div>
      ) : events.length === 0 ? (
        <div className="fx-card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎈</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--ink)' }}>{t('noEventsTitle')}</div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '6px 0 16px' }}>{t('noEventsBody')}</p>
          <Link to="/app/create" className="fx-btn fx-btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            + {t('newEvent')}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {events.map((ev) => {
            const pct = progressFor(ev)
            const color = pct >= 100 ? 'var(--color-gold)' : 'var(--color-sage)'
            return (
              <Link
                key={ev.id}
                to={`/app/event/${ev.id}`}
                className="fx-card"
                style={{ padding: 16, textDecoration: 'none', display: 'flex', gap: 14, alignItems: 'center' }}
              >
                <ProgressRing percent={pct} color={color} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{metaEmoji(EVENT_TYPES, ev.type)}</span>
                    <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '1rem' }}>{ev.title || metaLabel(EVENT_TYPES, ev.type, lang)}</span>
                  </div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '0.8rem', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>📅 {formatDate(ev.event_date, lang)}</span>
                    <span>👥 {ev.guest_count} {t('hGuests')}</span>
                    <span>💰 €{ev.budget_total}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
