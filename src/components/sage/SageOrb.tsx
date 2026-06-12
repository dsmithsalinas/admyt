interface SageOrbProps {
  size?: number
}

export default function SageOrb({ size = 32 }: SageOrbProps) {
  const dotSize = Math.max(size * 0.16, 5)
  const fontSize = size * 0.5

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #A5B4FC, #6366F1 55%, #7C3AED)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        boxShadow: size >= 60 ? '0 8px 32px rgba(99,102,241,0.35)' : 'none',
      }}
    >
      <span style={{ fontSize, fontWeight: 500, color: '#fff', lineHeight: 1 }}>s</span>
      <span
        style={{
          position: 'absolute',
          top: size * 0.15,
          right: size * 0.17,
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: '#F9A8D4',
        }}
      />
    </div>
  )
}
