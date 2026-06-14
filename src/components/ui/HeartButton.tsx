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
        border: '1px solid var(--admyt-line)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.47,
        background: active
          ? 'linear-gradient(135deg, #fff0f6, #ffe5df)'
          : 'var(--admyt-lavender)',
        color: active ? 'var(--admyt-pink)' : '#b9add8',
        transition: 'transform 0.12s, background 0.15s',
        transform: active ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      {active ? '♥' : '♡'}
    </button>
  )
}
