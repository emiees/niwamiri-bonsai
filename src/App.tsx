import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/appStore'

// Pages
import Onboarding from './pages/Onboarding'
import Inventory from './pages/Inventory'
import BonsaiDetail from './pages/BonsaiDetail'
import CareForm from './pages/CareForm'
import Gallery from './pages/Gallery'
import ClassNotes from './pages/ClassNotes'
import SpeciesSheet from './pages/SpeciesSheet'
import AIAssistant from './pages/AIAssistant'
import Calendar from './pages/Calendar'
import Identify from './pages/Identify'
import Backup from './pages/Backup'
import Settings from './pages/Settings'

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const config = useAppStore((s) => s.config)
  if (!config?.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }
  return <>{children}</>
}

export default function App() {
  const config = useAppStore((s) => s.config)

  // Apply theme and font-scale to <html> element
  useEffect(() => {
    const theme = config?.theme ?? 'dark'
    const fontSize = config?.fontSize ?? 'normal'
    document.documentElement.className = `${theme}${fontSize === 'large' ? ' font-large' : ''}`
  }, [config?.theme, config?.fontSize])

  return (
    <HashRouter>
      <Routes>
        {/* Onboarding — accessible always */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <OnboardingGuard>
              <Inventory />
            </OnboardingGuard>
          }
        />
        <Route
          path="/bonsai/:id"
          element={
            <OnboardingGuard>
              <BonsaiDetail />
            </OnboardingGuard>
          }
        />
        <Route
          path="/bonsai/:id/care"
          element={
            <OnboardingGuard>
              <CareForm />
            </OnboardingGuard>
          }
        />
        <Route
          path="/bonsai/:id/care/:careId"
          element={
            <OnboardingGuard>
              <CareForm />
            </OnboardingGuard>
          }
        />
        <Route
          path="/bonsai/:id/gallery"
          element={
            <OnboardingGuard>
              <Gallery />
            </OnboardingGuard>
          }
        />
        <Route
          path="/bonsai/:id/notes"
          element={
            <OnboardingGuard>
              <ClassNotes />
            </OnboardingGuard>
          }
        />
        <Route
          path="/bonsai/:id/sheet"
          element={
            <OnboardingGuard>
              <SpeciesSheet />
            </OnboardingGuard>
          }
        />
        <Route
          path="/bonsai/:id/ai"
          element={
            <OnboardingGuard>
              <AIAssistant />
            </OnboardingGuard>
          }
        />
        <Route
          path="/calendar"
          element={
            <OnboardingGuard>
              <Calendar />
            </OnboardingGuard>
          }
        />
        <Route
          path="/identify"
          element={
            <OnboardingGuard>
              <Identify />
            </OnboardingGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <OnboardingGuard>
              <Settings />
            </OnboardingGuard>
          }
        />
        <Route
          path="/settings/backup"
          element={
            <OnboardingGuard>
              <Backup />
            </OnboardingGuard>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
