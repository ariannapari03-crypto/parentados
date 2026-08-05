import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { BottomNav, type NavItem } from './BottomNav'
import { LanguageToggle } from './LanguageToggle'

/** Guscio mobile-first: barra in alto, contenuto scrollabile, bottom-nav in base al ruolo. */
export function AppLayout() {
  const { profile, signOut } = useAuth()
  const { t } = useI18n()

  const organizerNav: NavItem[] = [
    { to: '/app', label: t('navHome'), emoji: '🏠', end: true },
    { to: '/app/create', label: t('navCreate'), emoji: '➕' },
    { to: '/app/promo', label: t('navPromo'), emoji: '🎟️' },
    { to: '/app/vendors', label: t('navVendors'), emoji: '🛍️' },
    { to: '/app/guests', label: t('navGuests'), emoji: '👥' },
  ]

  const partnerNav: NavItem[] = [
    { to: '/app', label: t('navDashboard'), emoji: '📊', end: true },
    { to: '/app/promo', label: t('navPromo'), emoji: '🎟️' },
    { to: '/app/redemptions', label: t('navRedemptions'), emoji: '🎫' },
    { to: '/app/listing', label: t('navProfileCard'), emoji: '✏️' },
  ]

  const nav = profile?.role === 'partner' ? partnerNav : organizerNav

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'calc(12px + env(safe-area-inset-top)) 18px 10px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            fontSize: '1.35rem',
            color: 'var(--ink)',
            letterSpacing: '0.02em',
          }}
        >
          FESTIVA
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LanguageToggle />
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label={t('signOut')}
            title={t('signOut')}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid var(--surface-line)',
              background: 'var(--surface)',
              cursor: 'pointer',
              fontSize: 16,
              color: 'var(--ink)',
            }}
          >
            ⎋
          </button>
        </div>
      </header>

      <main style={{ flex: '1 1 auto', overflowY: 'auto', padding: '4px 18px 16px' }}>
        <Outlet />
      </main>

      <BottomNav items={nav} />
    </div>
  )
}
