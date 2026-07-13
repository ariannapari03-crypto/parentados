import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/profilo" element={<ProfilePage />} />
      <Route
        element={
          <RequireProfile>
            <Layout />
          </RequireProfile>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/case/:slug" element={<HouseDetailPage />} />
        <Route path="/case/:slug/prenota" element={<BookingFormPage />} />
        <Route path="/soggiorno/:bookingId/:flow" element={<ChecklistWizardPage />} />
        <Route path="/guasti" element={<IssuesPage />} />
        <Route path="/oggetti" element={<HandoffPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
