import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { FamilyProvider, useFamily } from './context/FamilyContext'
import { isSupabaseConfigured } from './lib/supabase'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import HouseDetailPage from './pages/HouseDetailPage'
import BookingFormPage from './pages/BookingFormPage'
import ChecklistWizardPage from './pages/ChecklistWizardPage'
import IssuesPage from './pages/IssuesPage'
import HandoffPage from './pages/HandoffPage'
import SetupNeededPage from './pages/SetupNeededPage'

function RequireProfile({ children }: { children: React.ReactElement }) {
  const { currentMember, loading } = useFamily()
  if (loading) return null
  if (!currentMember) return <Navigate to="/profilo" replace />
  return children
}

// All'apertura dell'app (una volta per sessione del browser) si parte dalla
// selezione del profilo, così ognuno conferma "chi sono" prima di usarla.
const SESSION_OPENED_KEY = 'parentados:opened'
function LandOnProfileOnOpen() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_OPENED_KEY)) {
      sessionStorage.setItem(SESSION_OPENED_KEY, '1')
      navigate('/profilo', { replace: true })
    }
  }, [navigate])
  return null
}

function AppRoutes() {
  return (
    <>
      <LandOnProfileOnOpen />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/profilo" element={<ProfilePage />} />
          <Route
            path="/"
            element={
              <RequireProfile>
                <HomePage />
              </RequireProfile>
            }
          />
          <Route
            path="/case/:slug"
            element={
              <RequireProfile>
                <HouseDetailPage />
              </RequireProfile>
            }
          />
          <Route
            path="/case/:slug/prenota"
            element={
              <RequireProfile>
                <BookingFormPage />
              </RequireProfile>
            }
          />
          <Route
            path="/soggiorno/:bookingId/:flow"
            element={
              <RequireProfile>
                <ChecklistWizardPage />
              </RequireProfile>
            }
          />
          <Route
            path="/guasti"
            element={
              <RequireProfile>
                <IssuesPage />
              </RequireProfile>
            }
          />
          <Route
            path="/oggetti"
            element={
              <RequireProfile>
                <HandoffPage />
              </RequireProfile>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupNeededPage />

  return (
    <FamilyProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </FamilyProvider>
  )
}
