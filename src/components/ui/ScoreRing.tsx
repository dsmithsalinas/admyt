interface ScoreRingProps {
  score: number
  size?: number
  color?: string
}

export default function ScoreRing({ score, size = 46, color = '#6366F1' }: ScoreRingProps) {
  const inner = size * 0.82
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${color} 0% ${score}%, var(--admyt-line) ${score}% 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: '50%',
          background: 'var(--admyt-paper)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.28,
          fontWeight: 800,
          color,
        }}
      >
        {score}
      </div>
    </div>
  )
}
