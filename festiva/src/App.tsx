import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured } from './lib/supabase'
import { useAuth } from './auth/AuthContext'
import { useI18n } from './i18n/I18nContext'
import { AppLayout } from './components/AppLayout'
import { SetupNeededPage } from './pages/SetupNeededPage'

// Pagine caricate on-demand (code-splitting): il bundle iniziale resta leggero.
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const HomePage = lazy(() => import('./pages/organizer/HomePage').then((m) => ({ default: m.HomePage })))
const CreatePage = lazy(() => import('./pages/organizer/CreatePage').then((m) => ({ default: m.CreatePage })))
const EventDetailPage = lazy(() => import('./pages/organizer/EventDetailPage').then((m) => ({ default: m.EventDetailPage })))
const GuestsPage = lazy(() => import('./pages/organizer/GuestsPage').then((m) => ({ default: m.GuestsPage })))
const VendorsPage = lazy(() => import('./pages/organizer/VendorsPage').then((m) => ({ default: m.VendorsPage })))
const PartnerDetailPage = lazy(() => import('./pages/organizer/PartnerDetailPage').then((m) => ({ default: m.PartnerDetailPage })))
const PromoPage = lazy(() => import('./pages/organizer/PromoPage').then((m) => ({ default: m.PromoPage })))
const PartnerDashboardPage = lazy(() => import('./pages/partner/DashboardPage').then((m) => ({ default: m.PartnerDashboardPage })))
const PartnerListingPage = lazy(() => import('./pages/partner/ListingPage').then((m) => ({ default: m.PartnerListingPage })))
const PartnerPromoPage = lazy(() => import('./pages/partner/PartnerPromoPage').then((m) => ({ default: m.PartnerPromoPage })))
const PartnerRedemptionsPage = lazy(() => import('./pages/partner/RedemptionsPage').then((m) => ({ default: m.PartnerRedemptionsPage })))

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
      <Suspense fallback={<Splash />}>
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
      </Suspense>
    </BrowserRouter>
  )
}
