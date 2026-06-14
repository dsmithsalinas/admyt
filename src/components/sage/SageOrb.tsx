import sageOrb from '@/assets/sage/sage-orb.webp'

interface SageOrbProps {
  size?: number
  animate?: boolean
}

export default function SageOrb({ size = 32, animate = false }: SageOrbProps) {
  return (
    <>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
          boxShadow: size >= 46 ? 'var(--shadow-orb)' : '0 3px 12px rgba(99, 91, 255, 0.2)',
          animation: animate ? 'sageOrbFloat 4.8s ease-in-out infinite' : undefined,
          overflow: 'hidden',
        }}
      >
        <img
          src={sageOrb}
          alt=""
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scale(1.72)',
            display: 'block',
          }}
        />
      </div>
      {animate && (
        <style>{`
          @keyframes sageOrbFloat {
            0%,100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-5px) scale(1.025); }
          }
        `}</style>
      )}
    </>
  )
}
