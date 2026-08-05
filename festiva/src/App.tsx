import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured } from './lib/supabase'
import { useAuth } from './auth/AuthContext'
import { useI18n } from './i18n/I18nContext'
import { AppLayout } from './components/AppLayout'
import { SetupNeededPage } from './pages/SetupNeededPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/organizer/HomePage'
import { CreatePage } from './pages/organizer/CreatePage'
import { EventDetailPage } from './pages/organizer/EventDetailPage'
import { GuestsPage } from './pages/organizer/GuestsPage'
import { VendorsPage } from './pages/organizer/VendorsPage'
import { PartnerDetailPage } from './pages/organizer/PartnerDetailPage'
import { PromoPage } from './pages/organizer/PromoPage'
import { PartnerDashboardPage } from './pages/partner/DashboardPage'
import { PartnerListingPage } from './pages/partner/ListingPage'
import { PartnerPromoPage } from './pages/partner/PartnerPromoPage'
import { PartnerRedemptionsPage } from './pages/partner/RedemptionsPage'

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

// La sezione Promo: vetrina per l'organizzatore, gestione per il partner.
function PromoRoute() {
  const { profile } = useAuth()
  return profile?.role === 'partner' ? <PartnerPromoPage /> : <PromoPage />
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
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="partner/:id" element={<PartnerDetailPage />} />
          <Route path="guests" element={<GuestsPage />} />
          {/* Condivise / Partner */}
          <Route path="promo" element={<PromoRoute />} />
          <Route path="redemptions" element={<PartnerRedemptionsPage />} />
          <Route path="listing" element={<PartnerListingPage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
