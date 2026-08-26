import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProfileProvider } from '@/context/ProfileContext'
import { AuthProvider } from '@/context/AuthContext'
import { SavedVibesProvider } from '@/context/SavedVibesContext'
import { CollegeProvider } from '@/context/CollegeContext'
import { ChatProvider } from '@/context/ChatContext'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/layout/Layout'
import SageOrb from '@/components/sage/SageOrb'
import { SageTransitionProvider } from '@/context/SageTransitionContext'

const Home = lazy(() => import('@/pages/Home'))
const Landing = lazy(() => import('@/pages/Landing'))
const Search = lazy(() => import('@/pages/Search'))
const CollegeDetail = lazy(() => import('@/pages/CollegeDetail'))
const VibeCheck = lazy(() => import('@/pages/VibeCheck'))
const Profile = lazy(() => import('@/pages/Profile'))
const DataAndPrivacy = lazy(() => import('@/pages/DataAndPrivacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const EmailOperations = lazy(() => import('@/pages/EmailOperations'))

function LoadingOrb() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#FCFCFF',
    }}>
      <SageOrb size={48} />
    </div>
  )
}

function RootRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingOrb />
  if (user) return <Navigate to="/chat" replace />
  return <Landing />
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <SavedVibesProvider>
          <CollegeProvider>
            <ChatProvider>
              <SageTransitionProvider>
                <Suspense fallback={<LoadingOrb />}>
                  <Routes>
                    <Route path="/" element={<RootRoute />} />
                    <Route element={<Layout />}>
                      <Route path="/chat" element={<Home />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/college/:id" element={<CollegeDetail />} />
                      <Route path="/college/:id/vibe" element={<VibeCheck />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/data-and-privacy" element={<DataAndPrivacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/email-operations" element={<EmailOperations />} />
                    </Route>
                  </Routes>
                </Suspense>
              </SageTransitionProvider>
            </ChatProvider>
          </CollegeProvider>
        </SavedVibesProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}
