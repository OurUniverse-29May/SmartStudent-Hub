import { BookOpen, Users } from 'lucide-react'

/**
 * CoursesPage — shows each course as a card with student count and bar.
 * Uses existing stats data already fetched in App — no extra API calls.
 */
const CARD_COLORS = [
  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', bar: 'linear-gradient(90deg,#2563eb,#60a5fa)' },
  { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', bar: 'linear-gradient(90deg,#059669,#34d399)' },
  { bg: '#eef2ff', border: '#c7d2fe', text: '#4338ca', bar: 'linear-gradient(90deg,#4f46e5,#818cf8)' },
  { bg: '#fffbeb', border: '#fde68a', text: '#92400e', bar: 'linear-gradient(90deg,#d97706,#fbbf24)' },
  { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', bar: 'linear-gradient(90deg,#e11d48,#fb7185)' },
  { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8', bar: 'linear-gradient(90deg,#7c3aed,#a78bfa)' },
  { bg: '#ecfeff', border: '#a5f3fc', text: '#164e63', bar: 'linear-gradient(90deg,#0891b2,#22d3ee)' },
]

export default function CoursesPage({ stats }) {
  const courses = stats?.students_per_course ?? []
  const total   = stats?.total_students ?? 0
  const max     = Math.max(...courses.map(c => c.count), 1)

  return (
    <div>
      {/* Page heading */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Courses
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
          All programmes with enrolled student counts
        </p>
      </div>

      {/* Summary strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem', marginBottom: '1.5rem',
      }}>
        {[
          { label: 'Total Courses', value: courses.length, icon: <BookOpen size={18} color="#2563eb" />, bg: '#eff6ff' },
          { label: 'Total Students', value: total, icon: <Users size={18} color="#10b981" />, bg: '#f0fdf4' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Course cards grid */}
      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <BookOpen size={40} strokeWidth={1.2} style={{ marginBottom: '0.75rem' }} />
          <p style={{ fontWeight: 600, color: '#475569' }}>No course data yet</p>
          <p style={{ fontSize: '0.85rem' }}>Add students to see course breakdown.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
          {courses.map((course, i) => {
            const c   = CARD_COLORS[i % CARD_COLORS.length]
            const pct = Math.round((course.count / total) * 100)
            const barW = Math.round((course.count / max) * 100)
            return (
              <div key={course.course} style={{
                background: '#fff', border: `1px solid #e2e8f0`,
                borderRadius: 14, padding: '1.25rem',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                transition: 'box-shadow 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.11)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {/* Badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: c.bg, border: `1px solid ${c.border}`, color: c.text,
                  fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.55rem',
                  borderRadius: 99, marginBottom: '0.75rem',
                }}>
                  <BookOpen size={10} /> Course
                </div>

                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                  {course.course}
                </p>

                {/* Bar */}
                <div style={{ background: '#f1f5f9', borderRadius: 99, height: 6, marginBottom: '0.65rem' }}>
                  <div style={{ width: `${barW}%`, height: '100%', borderRadius: 99, background: c.bar, transition: 'width 0.6s ease' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: '0.8rem' }}>
                    <Users size={13} /> <span style={{ fontWeight: 600, color: '#1e293b' }}>{course.count}</span> students
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c.text, background: c.bg, padding: '0.15rem 0.5rem', borderRadius: 99 }}>
                    {pct}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
