import { lazy, Suspense, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
const SagePlan = lazy(() => import('@/pages/SagePlan'))
const DataAndPrivacy = lazy(() => import('@/pages/DataAndPrivacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Admin = lazy(() => import('@/pages/Admin'))
const AdminDataQuality = lazy(() => import('@/pages/AdminDataQuality'))
const AdminSupport = lazy(() => import('@/pages/AdminSupport'))
const AdminIncidents = lazy(() => import('@/pages/AdminIncidents'))
const AdminAudit = lazy(() => import('@/pages/AdminAudit'))
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

function RouteAccessibility() {
  const location = useLocation()
  const { user } = useAuth()
  const previousPath = useRef(location.pathname)
  const pageName = location.pathname === '/'
    ? 'Admyt home'
    : location.pathname === '/chat'
    ? 'Sage'
    : location.pathname === '/search'
    ? 'Browse colleges'
    : location.pathname === '/profile'
    ? 'Your profile'
    : location.pathname === '/plan'
    ? 'Sage Plan'
    : location.pathname === '/data-and-privacy'
    ? 'Data and privacy'
    : location.pathname === '/terms'
    ? 'Terms'
    : location.pathname === '/privacy'
    ? 'Privacy policy'
    : location.pathname === '/admin/data-quality'
    ? user ? 'Data quality' : 'Not authorized'
    : location.pathname === '/admin/support'
    ? user ? 'User support' : 'Not authorized'
    : location.pathname === '/admin/incidents'
    ? user ? 'Incident controls' : 'Not authorized'
    : location.pathname === '/admin/audit'
    ? user ? 'Admin audit log' : 'Not authorized'
    : location.pathname === '/admin'
    ? user ? 'Admin overview' : 'Not authorized'
    : location.pathname === '/email-operations'
    ? user ? 'Email operations' : 'Not authorized'
    : location.pathname.includes('/vibe')
    ? 'Vibe Check'
    : 'College details'

  useEffect(() => {
    document.title = `${pageName} — admyt`
    const routeChanged = previousPath.current !== location.pathname
    previousPath.current = location.pathname
    if (!routeChanged) return
    window.requestAnimationFrame(() => {
      const main = document.getElementById('main-content')
      if (!main) return
      main.scrollTop = 0
      main.focus({ preventScroll: true })
    })
  }, [location.pathname, pageName])

  return <div className="sr-only" aria-live="polite" aria-atomic="true">{pageName}</div>
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <SavedVibesProvider>
          <CollegeProvider>
            <ChatProvider>
              <SageTransitionProvider>
                <RouteAccessibility />
                <Suspense fallback={<LoadingOrb />}>
                  <Routes>
                    <Route path="/" element={<RootRoute />} />
                    <Route element={<Layout />}>
                      <Route path="/chat" element={<Home />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/college/:id" element={<CollegeDetail />} />
                      <Route path="/college/:id/vibe" element={<VibeCheck />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/plan" element={<SagePlan />} />
                      <Route path="/data-and-privacy" element={<DataAndPrivacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/admin/data-quality" element={<AdminDataQuality />} />
                      <Route path="/admin/support" element={<AdminSupport />} />
                      <Route path="/admin/incidents" element={<AdminIncidents />} />
                      <Route path="/admin/audit" element={<AdminAudit />} />
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
