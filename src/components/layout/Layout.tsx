import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { MessageCircle, Search, UserRound } from 'lucide-react'
import ProfileAvatar from '@/components/ui/ProfileAvatar'
import SageOrb from '@/components/sage/SageOrb'
import AuthModal from '@/components/ui/AuthModal'
import { useAuth } from '@/context/AuthContext'
import { useChat } from '@/context/ChatContext'

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
  const { user } = useAuth()
  const { heartedSchools, authNudgeOpen, dismissAuthNudge } = useChat()
  const isHome = location.pathname === '/chat'
  const savedCount = heartedSchools.size

  const activeTabColor = 'var(--admyt-indigo)'
  const inactiveTabColor = 'var(--admyt-muted)'
  const isBrowse = location.pathname === '/search'
  const isProfile = location.pathname === '/profile'
  // The floating "Back to Sage" pill belongs on Browse + school pages, not on
  // Home (that IS Sage) or Profile (which has its own tab and gets overlapped).
  const showBackPill = !isHome && !isProfile
  const navLink = (active: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    textDecoration: 'none',
    color: active ? 'var(--admyt-ink)' : 'var(--admyt-muted)',
    fontWeight: active ? 760 : 500,
    borderRadius: '8px',
    padding: '12px',
    background: active ? 'white' : 'transparent',
    border: active ? '1px solid var(--admyt-line)' : '1px solid transparent',
    boxShadow: active ? 'var(--admyt-shadow-small)' : 'none',
    transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--admyt-paper)' }}>

      {/* ── Top nav ─────────────────────────────────────────────── */}
      <nav style={{
        background: 'rgba(255, 253, 250, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--admyt-line)',
        padding: '12px clamp(16px, 3vw, 42px)', minHeight: '76px',
        display: 'flex', alignItems: 'center',
        flexShrink: 0, zIndex: 10,
        boxShadow: '0 1px 16px rgba(78,65,150,0.06)',
      }}>
        <Link to="/chat" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <span>
            <strong style={{ display: 'block', fontSize: '14px', letterSpacing: '.08em', textTransform: 'none', color: 'var(--admyt-ink)', lineHeight: 1 }}>
              adm<span style={{
                background: 'var(--admyt-grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>y</span>t
            </strong>
            <span style={{ display: 'block', color: 'var(--admyt-muted)', fontSize: '12px', marginTop: '4px' }}>
              find where you fit
            </span>
          </span>
        </Link>

        {!isMobile && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/chat" style={navLink(isHome)}>
              <MessageCircle size={16} />
              Sage
            </Link>
            <Link to="/search" style={navLink(isBrowse)}>
              <Search size={16} />
              Browse
            </Link>
            <div style={{ position: 'relative' }}>
              <ProfileAvatar />
              {savedCount > 0 && (
                <span className="pill" style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 850,
                  color: 'var(--admyt-indigo)',
                  background: 'white',
                  boxShadow: 'var(--admyt-shadow-small)',
                  pointerEvents: 'none',
                }}>{savedCount}</span>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Main content ────────────────────────────────────────── */}
      <main style={isHome ? {
        flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        paddingBottom: isMobile ? '70px' : 0,
      } : {
        flex: 1, overflowY: 'auto',
        // On mobile, clear the bottom tab bar (~70px) plus the floating
        // "Back to Sage" pill where it shows, so it never covers content.
        paddingBottom: isMobile ? (showBackPill ? '132px' : '70px') : 0,
      }}>
        {isHome ? (
          <Outlet />
        ) : (
          <div style={{ maxWidth: '1060px', margin: '0 auto', padding: isMobile ? '24px 16px' : '36px 24px' }}>
            <Outlet />
          </div>
        )}
      </main>

      {/* ── Back to Sage pill (Browse + school pages) ───────────── */}
      {showBackPill && (
        <button
          onClick={() => navigate('/chat')}
          style={{
            position: 'fixed',
            bottom: isMobile ? '84px' : '24px',
            right: '20px',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255, 253, 250, 0.94)',
            border: '1px solid var(--admyt-line)',
            borderRadius: '100px',
            padding: '7px 14px 7px 7px',
            cursor: 'pointer',
            boxShadow: 'var(--admyt-shadow-small)',
            zIndex: 50,
            fontSize: '13px', fontWeight: 800, color: 'var(--admyt-indigo)',
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--admyt-shadow)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--admyt-shadow-small)')}
        >
          <SageOrb size={28} />
          Back to Sage
        </button>
      )}

      {/* ── Mobile bottom tab bar ───────────────────────────────── */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '68px',
          background: 'rgba(255, 253, 250, 0.94)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--admyt-line)',
          display: 'flex',
          zIndex: 100,
          boxShadow: '0 -10px 30px rgba(78,65,150,0.08)',
        }}>
          {/* Chat tab */}
          <Link
            to="/chat"
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              textDecoration: 'none',
              color: isHome ? activeTabColor : inactiveTabColor,
            }}
          >
            <MessageCircle size={22} />
            <span style={{ fontSize: '10px', fontWeight: isHome ? 800 : 600 }}>Sage</span>
          </Link>

          {/* Browse tab */}
          <Link
            to="/search"
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              textDecoration: 'none',
              color: isBrowse ? activeTabColor : inactiveTabColor,
            }}
          >
            <Search size={22} />
            <span style={{ fontSize: '10px', fontWeight: isBrowse ? 800 : 600 }}>Browse</span>
          </Link>

          {/* Profile tab */}
          <button
            onClick={() => navigate('/profile')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: isProfile ? activeTabColor : inactiveTabColor,
            }}
          >
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: user
                  ? 'var(--admyt-grad)'
                  : 'var(--admyt-lavender)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: isProfile && user ? '2px solid var(--admyt-indigo)' : '1px solid var(--admyt-line)',
              }}>
                {user ? (
                  <span style={{ fontSize: '11px', color: 'white', fontWeight: 700 }}>
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <UserRound size={14} />
                )}
              </div>
              {savedCount > 0 && (
                <span className="pill" style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-12px',
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 850,
                  color: 'var(--admyt-indigo)',
                  background: 'white',
                  boxShadow: 'var(--admyt-shadow-small)',
                  pointerEvents: 'none',
                }}>{savedCount}</span>
              )}
            </div>
            <span style={{ fontSize: '10px', fontWeight: isProfile ? 800 : 600 }}>Profile</span>
          </button>
        </div>
      )}

      {/* ── Guest heart → sign-up nudge (one per session) ───────── */}
      {authNudgeOpen && (
        <AuthModal
          trigger="heart"
          onClose={dismissAuthNudge}
          onSuccess={dismissAuthNudge}
        />
      )}

    </div>
  )
}
