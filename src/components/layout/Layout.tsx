import { Outlet, Link } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-[#0F172A] text-white px-6 py-4 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 30 30" fill="none">
              <path
                d="M15 5 L26 11 L15 17 L4 11 Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M8 14 L8 21 Q8 24 15 24 Q22 24 22 21 L22 14"
                stroke="#818CF8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="26" cy="11" r="1.5" fill="#F0ABFC" />
              <path
                d="M26 11 L26 20"
                stroke="#F0ABFC"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="2 2"
              />
            </svg>
          </div>
          <span className="text-lg font-medium tracking-tight">
            adm<span className="text-[#818CF8]">y</span>t
          </span>
        </Link>
        <div className="ml-auto flex gap-6 text-sm text-slate-400">
          <Link to="/search" className="hover:text-white transition-colors">
            Search
          </Link>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
