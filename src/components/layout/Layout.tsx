import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ProfileAvatar from '@/components/ui/ProfileAvatar'
import SageAvatar from '@/components/sage/SageAvatar'
import { useAuth } from '@/context/AuthContext'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { user, signOut } = useAuth()
  const isHome = location.pathname === '/'
  const [showMobileProfile, setShowMobileProfile] = useState(false)

  const activeTabColor = '#6366F1'
  const inactiveTabColor = '#94A3B8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8FAFC' }}>

      {/* ── Top nav ─────────────────────────────────────────────── */}
      <nav style={{
        background: '#0F172A', color: 'white',
        padding: '0 24px', height: '54px',
        display: 'flex', alignItems: 'center',
        flexShrink: 0, zIndex: 10,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px', background: '#6366F1',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 30 30" fill="none">
              <path d="M15 5 L26 11 L15 17 L4 11 Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 14 L8 21 Q8 24 15 24 Q22 24 22 21 L22 14" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="26" cy="11" r="1.5" fill="#F0ABFC"/>
              <path d="M26 11 L26 20" stroke="#F0ABFC" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
            </svg>
          </div>
          <span style={{ fontSize: '17px', fontWeight: 500, color: 'white', letterSpacing: '-0.2px' }}>
            adm<span style={{ color: '#818CF8' }}>y</span>t
          </span>
        </Link>

        {!isMobile && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '28px' }}>
            <Link to="/" style={{
              fontSize: '14px', textDecoration: 'none',
              color: isHome ? '#818CF8' : '#94A3B8',
              fontWeight: isHome ? 500 : 400,
              transition: 'color 0.15s',
            }}>
              Chat
            </Link>
            <Link to="/search" style={{
              fontSize: '14px', textDecoration: 'none',
              color: location.pathname === '/search' ? '#818CF8' : '#94A3B8',
              fontWeight: location.pathname === '/search' ? 500 : 400,
              transition: 'color 0.15s',
            }}>
              Browse
            </Link>
            <ProfileAvatar />
          </div>
        )}
      </nav>

      {/* ── Main content ────────────────────────────────────────── */}
      <main style={isHome ? {
        flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        paddingBottom: isMobile ? '60px' : 0,
      } : {
        flex: 1, overflowY: 'auto',
        paddingBottom: isMobile ? '60px' : 0,
      }}>
        {isHome ? (
          <Outlet />
        ) : (
          <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '32px 24px' }}>
            <Outlet />
          </div>
        )}
      </main>

      {/* ── Back to Sage pill (non-home pages) ──────────────────── */}
      {!isHome && (
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'fixed',
            bottom: isMobile ? '76px' : '24px',
            right: '20px',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'white',
            border: '0.5px solid #E2E8F0',
            borderRadius: '100px',
            padding: '7px 14px 7px 7px',
            cursor: 'pointer',
            boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
            zIndex: 50,
            fontSize: '13px', fontWeight: 500, color: '#334155',
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.10)')}
        >
          <SageAvatar size={26} />
          Back to Sage
        </button>
      )}

      {/* ── Mobile bottom tab bar ───────────────────────────────── */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '60px',
          background: 'white',
          borderTop: '0.5px solid #E2E8F0',
          display: 'flex',
          zIndex: 100,
          boxShadow: '0 -1px 8px rgba(0,0,0,0.06)',
        }}>
          {/* Chat tab */}
          <Link
            to="/"
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              textDecoration: 'none',
              color: isHome ? activeTabColor : inactiveTabColor,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                fill={isHome ? '#EEF2FF' : 'none'}
              />
            </svg>
            <span style={{ fontSize: '10px', fontWeight: isHome ? 600 : 400 }}>Chat</span>
          </Link>

          {/* Browse tab */}
          <Link
            to="/search"
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              textDecoration: 'none',
              color: location.pathname === '/search' ? activeTabColor : inactiveTabColor,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '10px', fontWeight: location.pathname === '/search' ? 600 : 400 }}>Browse</span>
          </Link>

          {/* Profile tab */}
          <button
            onClick={() => navigate('/profile')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: inactiveTabColor,
            }}
          >
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: user ? '#6366F1' : '#E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {user ? (
                <span style={{ fontSize: '11px', color: 'white', fontWeight: 700 }}>
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="#94A3B8" strokeWidth="1.5"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: '10px' }}>Profile</span>
          </button>
        </div>
      )}

      {/* Mobile profile popover (signed-in) */}
      {isMobile && showMobileProfile && user && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 98 }}
            onClick={() => setShowMobileProfile(false)}
          />
          <div style={{
            position: 'fixed', bottom: '68px', right: '12px',
            background: 'white', border: '0.5px solid #E2E8F0',
            borderRadius: '12px', padding: '14px',
            minWidth: '200px', zIndex: 99,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>Signed in as</div>
            <div style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500, marginBottom: '12px' }}>
              {user.email}
            </div>
            <button
              onClick={() => { signOut(); setShowMobileProfile(false) }}
              style={{
                width: '100%', textAlign: 'left',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: '#64748B', padding: '6px 8px',
                borderRadius: '6px', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Sign out
            </button>
          </div>
        </>
      )}

    </div>
  )
}
