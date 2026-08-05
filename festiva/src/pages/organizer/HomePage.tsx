import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'

export function HomePage() {
  const { t } = useI18n()
  const { profile } = useAuth()

  return (
    <div style={{ paddingTop: 12 }}>
      <p style={{ margin: '0 0 2px', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
        {t('tagline')}
      </p>
      <h1 style={{ margin: '0 0 16px', fontSize: '1.7rem', color: 'var(--ink)' }}>
        {t('partnerHi')} {profile?.display_name?.split(' ')[0] ?? ''} 👋
      </h1>

      <div className="fx-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
          {t('yourEvents')}
        </div>
        <div style={{ textAlign: 'center', padding: '18px 6px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎈</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--ink)' }}>
            {t('noEventsTitle')}
          </div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '6px 0 16px' }}>
            {t('noEventsBody')}
          </p>
          <Link
            to="/app/create"
            className="fx-btn fx-btn-primary"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            + {t('newEvent')}
          </Link>
        </div>
      </div>
    </div>
  )
}
