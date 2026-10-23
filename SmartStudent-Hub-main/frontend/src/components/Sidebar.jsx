import { GraduationCap, LayoutDashboard, Users, BookOpen, BarChart2, Settings } from 'lucide-react'

/**
 * Sidebar — fully functional nav.
 * Props:
 *   activePage      : string  — 'dashboard' | 'students' | 'courses' | 'reports' | 'settings'
 *   onNavigate      : (page: string) => void
 *   totalStudents   : number
 */
export default function Sidebar({ activePage, onNavigate, totalStudents }) {
  const items = [
    {
      section: 'MAIN',
      links: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { id: 'students',  label: 'Students',  icon: <Users size={16} />, badge: totalStudents > 0 ? totalStudents : null },
        { id: 'courses',   label: 'Courses',   icon: <BookOpen size={16} /> },
      ],
    },
    {
      section: 'ANALYTICS',
      links: [
        { id: 'reports', label: 'Reports', icon: <BarChart2 size={16} /> },
      ],
    },
    {
      section: 'SYSTEM',
      links: [
        { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
      ],
    },
  ]

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <div className="brand-icon-wrap">
            <GraduationCap size={20} color="#fff" />
          </div>
          <div className="brand-text">
            <span className="brand-name">SmartStudent</span>
            <span className="brand-sub">Hub</span>
          </div>
        </div>
        <p className="brand-tagline">Student Record Management</p>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {items.map(({ section, links }) => (
          <div key={section}>
            <p className="nav-section-label">{section}</p>
            {links.map(({ id, label, icon, badge }) => (
              <button
                key={id}
                className={`nav-item${activePage === id ? ' nav-active' : ''}`}
                onClick={() => onNavigate(id)}
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-text">{label}</span>
                {badge && <span className="nav-badge">{badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-version">
          <GraduationCap size={12} style={{ opacity: 0.35 }} />
          <span>SmartStudent Hub · v1.0</span>
        </div>
      </div>
    </aside>
  )
}
