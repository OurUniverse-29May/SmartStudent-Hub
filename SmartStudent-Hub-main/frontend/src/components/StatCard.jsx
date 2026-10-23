/**
 * StatCard — single metric card on the dashboard.
 * Props: { icon, label, value, sub, color }
 * color: hex string for icon background tint
 */
export default function StatCard({ icon, label, value, sub, color = '#eff6ff' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
