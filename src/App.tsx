import { Routes, Route, Navigate } from 'react-router-dom'
import { ProfileProvider } from '@/context/ProfileContext'
import { AuthProvider } from '@/context/AuthContext'
import { SavedVibesProvider } from '@/context/SavedVibesContext'
import { CollegeProvider } from '@/context/CollegeContext'
import { ChatProvider } from '@/context/ChatContext'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Landing from '@/pages/Landing'
import Search from '@/pages/Search'
import CollegeDetail from '@/pages/CollegeDetail'
import VibeCheck from '@/pages/VibeCheck'
import Profile from '@/pages/Profile'
import SageOrb from '@/components/sage/SageOrb'

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
              <Routes>
                <Route path="/" element={<RootRoute />} />
                <Route element={<Layout />}>
                  <Route path="/chat" element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/college/:id" element={<CollegeDetail />} />
                  <Route path="/college/:id/vibe" element={<VibeCheck />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Routes>
            </ChatProvider>
          </CollegeProvider>
        </SavedVibesProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}
