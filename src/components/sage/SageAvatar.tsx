export default function SageAvatar({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <circle cx="24" cy="24" r="24" fill="#EEF2FF"/>
      <circle cx="24" cy="24" r="22.5" fill="none" stroke="#C7D2FE" strokeWidth="2"/>
      <text x="24" y="32" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="26" fontWeight="500" fill="#6366F1">s</text>
      <circle cx="34" cy="13" r="3" fill="#F0ABFC"/>
    </svg>
  )
}
