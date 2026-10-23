import { useState } from 'react'
import { BarChart2, Users, BookOpen, TrendingUp, Calendar, Award, Download } from 'lucide-react'

import { exportStudentsCsv } from '../services/studentService.js'

/**
 * ReportsPage — analytics summary using existing stats data.
 * No extra API calls — all data comes from props.
 */
export default function ReportsPage({ stats, preferences }) {
  const [exporting, setExporting] = useState(false)
  const courses = stats?.students_per_course ?? []
  const total   = stats?.total_students ?? 0
  const max     = Math.max(...courses.map(c => c.count), 1)

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  const metrics = [
    { label: 'Total Students',    value: total,                          icon: <Users size={18} color="#2563eb" />,    bg: '#eff6ff' },
    { label: 'Courses Offered',   value: stats?.courses_offered ?? 0,    icon: <BookOpen size={18} color="#10b981" />, bg: '#f0fdf4' },
    { label: 'Avg per Course',    value: courses.length ? Math.round(total / courses.length) : 0, icon: <TrendingUp size={18} color="#7c3aed" />, bg: '#faf5ff' },
    { label: 'Largest Course',    value: courses[0]?.count ?? 0,         icon: <Award size={18} color="#d97706" />,    bg: '#fffbeb' },
  ]

  const handleExportCsv = async () => {
    try {
      setExporting(true)
      await exportStudentsCsv()
    } catch (error) {
      console.error('CSV export failed', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Reports</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Analytics summary from live student data</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleExportCsv}
          disabled={exporting || !total}
          style={{ opacity: exporting || !total ? 0.7 : 1 }}
        >
          <Download size={14} />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {metrics.map(({ label, value, icon, bg }) => (
          <div key={label} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '1.1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.6rem' }}>
              {icon}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Enrollment date range */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        padding: '1.35rem 1.5rem', marginBottom: '1.25rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={15} color="#3b82f6" /> Enrollment Date Range
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'First Enrollment',  value: fmtDate(stats?.oldest_enrollment) },
            { label: 'Latest Enrollment', value: fmtDate(stats?.newest_enrollment) },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem 1rem', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Course distribution table */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fafbff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={15} color="#3b82f6" /> Course Distribution
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{courses.length} courses</span>
        </div>

        {courses.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.85rem' }}>No data available</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.855rem' }}>
            <thead>
              <tr style={{ background: '#fafbff' }}>
                {['#', 'Course', 'Students', 'Share', 'Distribution'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 1.25rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1.5px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => {
                const pct  = total > 0 ? Math.round((c.count / total) * 100) : 0
                const barW = Math.round((c.count / max) * 100)
                const BARS = ['linear-gradient(90deg,#2563eb,#60a5fa)','linear-gradient(90deg,#059669,#34d399)','linear-gradient(90deg,#4f46e5,#818cf8)','linear-gradient(90deg,#d97706,#fbbf24)','linear-gradient(90deg,#e11d48,#fb7185)','linear-gradient(90deg,#7c3aed,#a78bfa)','linear-gradient(90deg,#0891b2,#22d3ee)']
                return (
                  <tr key={c.course} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.8rem 1.25rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.78rem' }}>{i + 1}</td>
                    <td style={{ padding: '0.8rem 1.25rem', fontWeight: 600, color: '#0f172a' }}>{c.course}</td>
                    <td style={{ padding: '0.8rem 1.25rem', fontWeight: 700, color: '#1e293b' }}>{c.count}</td>
                    <td style={{ padding: '0.8rem 1.25rem' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.72rem', padding: '0.18rem 0.5rem', borderRadius: 99 }}>{pct}%</span>
                    </td>
                    <td style={{ padding: '0.8rem 1.25rem', minWidth: 120 }}>
                      <div style={{ background: '#f1f5f9', borderRadius: 99, height: 6 }}>
                        <div style={{ width: `${barW}%`, height: '100%', borderRadius: 99, background: BARS[i % 7], transition: 'width 0.6s ease' }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
