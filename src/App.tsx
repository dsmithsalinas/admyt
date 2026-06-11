import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Search from '@/pages/Search'
import CollegeDetail from '@/pages/CollegeDetail'
import Onboarding from '@/pages/Onboarding'
import VibeCheck from '@/pages/VibeCheck'

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/college/:id" element={<CollegeDetail />} />
        <Route path="/college/:id/vibe" element={<VibeCheck />} />
      </Route>
    </Routes>
  )
}
