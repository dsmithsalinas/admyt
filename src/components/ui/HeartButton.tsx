interface HeartButtonProps {
  active: boolean
  onClick: (e: React.MouseEvent) => void
  size?: number
}

export default function HeartButton({ active, onClick, size = 32 }: HeartButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={active ? 'Remove from saved' : 'Save school'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.47,
        background: active
          ? 'linear-gradient(135deg, #FCE7F3, #FBCFE8)'
          : '#F4F3FE',
        color: active ? '#EC4899' : '#C4B5E8',
        transition: 'transform 0.12s, background 0.15s',
        transform: active ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      {active ? '♥' : '♡'}
    </button>
  )
}
