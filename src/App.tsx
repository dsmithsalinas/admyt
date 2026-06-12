import { Routes, Route } from 'react-router-dom'
import { ProfileProvider } from '@/context/ProfileContext'
import { AuthProvider } from '@/context/AuthContext'
import { ChatProvider } from '@/context/ChatContext'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Search from '@/pages/Search'
import CollegeDetail from '@/pages/CollegeDetail'
import Onboarding from '@/pages/Onboarding'
import VibeCheck from '@/pages/VibeCheck'

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ChatProvider>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/college/:id" element={<CollegeDetail />} />
              <Route path="/college/:id/vibe" element={<VibeCheck />} />
            </Route>
          </Routes>
        </ChatProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}
