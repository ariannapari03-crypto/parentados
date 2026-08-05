import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured } from './lib/supabase'
import { useAuth } from './auth/AuthContext'
import { useI18n } from './i18n/I18nContext'
import type { StringKey } from './i18n/strings'
import { AppLayout } from './components/AppLayout'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SetupNeededPage } from './pages/SetupNeededPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/organizer/HomePage'
import { CreatePage } from './pages/organizer/CreatePage'
import { EventDetailPage } from './pages/organizer/EventDetailPage'
import { PartnerDashboardPage } from './pages/partner/DashboardPage'

function Splash() {
  const { t } = useI18n()
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ink-soft)',
        fontFamily: 'var(--font-serif)',
        fontSize: '1.2rem',
      }}
    >
      {t('loading')}
    </div>
  )
}

function Protected() {
  const { session, loading } = useAuth()
  if (loading) return <Splash />
  if (!session) return <Navigate to="/login" replace />
  return <AppLayout />
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <Splash />
  if (session) return <Navigate to="/app" replace />
  return <>{children}</>
}

function RoleHome() {
  const { profile } = useAuth()
  return profile?.role === 'partner' ? <PartnerDashboardPage /> : <HomePage />
}

function Ph({ titleKey, emoji }: { titleKey: StringKey; emoji: string }) {
  const { t } = useI18n()
  return <PlaceholderPage title={t(titleKey)} emoji={emoji} />
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupNeededPage />

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <RegisterPage />
            </PublicOnly>
          }
        />

        <Route path="/app" element={<Protected />}>
          <Route index element={<RoleHome />} />
          {/* Organizer */}
          <Route path="create" element={<CreatePage />} />
          <Route path="event/:id" element={<EventDetailPage />} />
          <Route path="vendors" element={<Ph titleKey="navVendors" emoji="🛍️" />} />
          <Route path="guests" element={<Ph titleKey="navGuests" emoji="👥" />} />
          {/* Condivise / Partner */}
          <Route path="promo" element={<Ph titleKey="navPromo" emoji="🎟️" />} />
          <Route path="redemptions" element={<Ph titleKey="navRedemptions" emoji="🎫" />} />
          <Route path="listing" element={<Ph titleKey="navProfileCard" emoji="✏️" />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
