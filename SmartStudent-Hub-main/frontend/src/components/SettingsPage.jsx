import { GraduationCap, Database, Code2, Server, Shield, Info, Sun, Moon, Rows3, PanelLeftOpen } from 'lucide-react'

/**
 * SettingsPage — app information, local UI preferences, and API reference.
 */
const STACK = [
  { label: 'Frontend',  value: 'React 18 + Vite',         icon: <Code2   size={16} color="#3b82f6" />, bg: '#eff6ff' },
  { label: 'Backend',   value: 'Python + FastAPI',         icon: <Server  size={16} color="#10b981" />, bg: '#f0fdf4' },
  { label: 'Database',  value: 'SQLite + SQLAlchemy',      icon: <Database size={16} color="#7c3aed" />, bg: '#faf5ff' },
  { label: 'Validation',value: 'Pydantic v2',              icon: <Shield  size={16} color="#d97706" />, bg: '#fffbeb' },
]

const API_ENDPOINTS = [
  { method: 'GET',    path: '/students/',        desc: 'List students (paginated, filterable)' },
  { method: 'POST',   path: '/students/',        desc: 'Register a new student' },
  { method: 'GET',    path: '/students/{id}',    desc: 'Get student by ID' },
  { method: 'PUT',    path: '/students/{id}',    desc: 'Full update of a student' },
  { method: 'PATCH',  path: '/students/{id}',    desc: 'Partial update of a student' },
  { method: 'DELETE', path: '/students/{id}',    desc: 'Delete a student' },
  { method: 'GET',    path: '/stats',            desc: 'Dashboard statistics' },
]

const METHOD_COLORS = {
  GET:    { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  POST:   { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  PUT:    { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  PATCH:  { bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' },
  DELETE: { bg: '#fff1f2', color: '#9f1239', border: '#fecdd3' },
}

export default function SettingsPage({ preferences, onPreferenceChange }) {
  const setPreference = (key, value) => {
    onPreferenceChange((current) => ({ ...current, [key]: value }))
  }

  const preferenceCards = [
    {
      key: 'theme',
      label: 'Theme',
      value: preferences.theme === 'dark' ? 'Dark mode' : 'Light mode',
      icon: preferences.theme === 'dark' ? <Moon size={16} color="#1e293b" /> : <Sun size={16} color="#d97706" />,
      action: (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPreference('theme', preferences.theme === 'dark' ? 'light' : 'dark')}
        >
          {preferences.theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        </button>
      ),
    },
    {
      key: 'compactMode',
      label: 'Density',
      value: preferences.compactMode ? 'Compact layout' : 'Comfortable layout',
      icon: <Rows3 size={16} color="#2563eb" />,
      action: (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPreference('compactMode', !preferences.compactMode)}
        >
          {preferences.compactMode ? 'Expand layout' : 'Compact layout'}
        </button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Settings</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Application information, dashboard preferences, and API reference</p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg,#1e3a8a,#2563eb,#3b82f6)',
        borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1.1rem',
        boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
      }}>
        <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.15)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GraduationCap size={26} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>SmartStudent Hub</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Student Record Management System · Version 1.0.0</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
            Backend: <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}>
              http://127.0.0.1:8000/docs ↗
            </a>
          </div>
        </div>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        padding: '1.35rem 1.5rem', marginBottom: '1.25rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <PanelLeftOpen size={15} color="#3b82f6" /> Workspace Preferences
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '0.8rem' }}>
          {preferenceCards.map(({ key, label, value, icon, action }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: '#f8fafc', borderRadius: 10, padding: '0.8rem 0.9rem', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ width: 32, height: 32, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{value}</div>
                </div>
              </div>
              {action}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        padding: '1.35rem 1.5rem', marginBottom: '1.25rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={15} color="#3b82f6" /> Technology Stack
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.75rem' }}>
          {STACK.map(({ label, value, icon, bg }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: '#f8fafc', borderRadius: 8, padding: '0.7rem 0.9rem', border: '1px solid #f1f5f9' }}>
              <div style={{ width: 32, height: 32, background: bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fafbff' }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Server size={15} color="#3b82f6" /> API Endpoints
          </span>
        </div>
        <div style={{ padding: '0.5rem 0' }}>
          {API_ENDPOINTS.map(({ method, path, desc }) => {
            const c = METHOD_COLORS[method]
            return (
              <div key={method + path} style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.7rem 1.5rem', borderBottom: '1px solid #f8fafc',
              }}>
                <span style={{
                  background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                  fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem',
                  borderRadius: 6, minWidth: 52, textAlign: 'center', letterSpacing: '0.04em',
                  flexShrink: 0,
                }}>{method}</span>
                <code style={{ fontSize: '0.8rem', color: '#3b82f6', fontFamily: 'monospace', fontWeight: 600, minWidth: 160 }}>{path}</code>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{desc}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
