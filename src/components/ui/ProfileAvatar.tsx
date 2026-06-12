import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AuthModal from './AuthModal'

export default function ProfileAvatar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = user?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Avatar button */}
      <button
        onClick={() => user ? setShowDropdown(!showDropdown) : setShowAuthModal(true)}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '3px',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0,
        }}
      >
        <div style={{
          width: '32px', height: '32px',
          borderRadius: '50%',
          background: user ? '#6366F1' : '#1E293B',
          border: user ? '2px solid #818CF8' : '1.5px solid #334155',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {user ? (
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>
              {initials}
            </span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#64748B" strokeWidth="1.5"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <span style={{
          fontSize: '10px',
          color: user ? '#818CF8' : '#475569',
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
          {user ? 'Profile' : 'Profile'}
        </span>
      </button>

      {/* Signed-in dropdown */}
      {showDropdown && user && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#1E293B',
          border: '0.5px solid #334155',
          borderRadius: '10px',
          padding: '8px',
          minWidth: '200px',
          zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            padding: '8px 10px 12px',
            borderBottom: '0.5px solid #334155',
            marginBottom: '6px',
          }}>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>
              Signed in as
            </div>
            <div style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 500 }}>
              {user.email}
            </div>
          </div>
          <button
            onClick={() => { navigate('/profile'); setShowDropdown(false) }}
            style={{
              width: '100%', textAlign: 'left',
              padding: '8px 10px',
              fontSize: '13px', color: '#E2E8F0',
              background: 'none', border: 'none',
              cursor: 'pointer', borderRadius: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            View profile
          </button>
          <button
            onClick={() => { signOut(); setShowDropdown(false) }}
            style={{
              width: '100%', textAlign: 'left',
              padding: '8px 10px',
              fontSize: '13px', color: '#94A3B8',
              background: 'none', border: 'none',
              cursor: 'pointer', borderRadius: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            Sign out
          </button>
        </div>
      )}

      {/* Auth modal for guests */}
      {showAuthModal && (
        <AuthModal
          trigger="general"
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
    </div>
  )
}
