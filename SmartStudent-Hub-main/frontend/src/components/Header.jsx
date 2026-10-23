import { GraduationCap, LayoutDashboard, Users, BookOpen, BarChart2, Settings } from 'lucide-react'

/**
 * Sidebar + top header bar.
 * Sidebar nav items are display-only (no routing) — cursor: default, no hover pointer.
 * Only "Add Student" button is functional.
 */
export default function Header({ onAddStudent, totalStudents }) {
  return (
    <>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-icon-wrap">
              <GraduationCap size={22} color="#fff" />
            </div>
            <div className="brand-text">
              <span className="brand-name">SmartStudent</span>
              <span className="brand-sub">Hub</span>
            </div>
          </div>
          <p className="brand-tagline">Student Record Management</p>
        </div>

        {/* Nav — visual only, no onClick */}
        <nav className="sidebar-nav">
          <p className="nav-label">MAIN</p>

          {/* Dashboard — marked active */}
          <div className="nav-item nav-active">
            <span className="nav-icon"><LayoutDashboard size={16} /></span>
            <span className="nav-text">Dashboard</span>
          </div>

          <div className="nav-item">
            <span className="nav-icon"><Users size={16} /></span>
            <span className="nav-text">Students</span>
            {totalStudents > 0 && (
              <span className="nav-badge">{totalStudents}</span>
            )}
          </div>

          <div className="nav-item">
            <span className="nav-icon"><BookOpen size={16} /></span>
            <span className="nav-text">Courses</span>
          </div>

          <p className="nav-label" style={{ marginTop: '1rem' }}>ANALYTICS</p>

          <div className="nav-item">
            <span className="nav-icon"><BarChart2 size={16} /></span>
            <span className="nav-text">Reports</span>
          </div>

          <p className="nav-label" style={{ marginTop: '1rem' }}>SYSTEM</p>

          <div className="nav-item">
            <span className="nav-icon"><Settings size={16} /></span>
            <span className="nav-text">Settings</span>
          </div>
        </nav>

        {/* Footer — no company/internship mention */}
        <div className="sidebar-footer">
          <div className="sidebar-version">
            <GraduationCap size={13} style={{ opacity: 0.4 }} />
            <span>SmartStudent Hub · v1.0</span>
          </div>
        </div>
      </aside>

      {/* ── Top header bar (sits inside .main-content) ── */}
      <header className="top-header">
        <div className="header-left">
          <h1 className="header-title">Student Dashboard</h1>
          <p className="header-sub">Manage and monitor all student records</p>
        </div>
        <div className="header-right">
          <span className="header-badge">v1.0</span>
          <button className="btn btn-primary" onClick={onAddStudent}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Student
          </button>
        </div>
      </header>
    </>
  )
}
