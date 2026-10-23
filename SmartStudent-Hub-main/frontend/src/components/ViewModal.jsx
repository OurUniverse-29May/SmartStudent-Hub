import { X, Mail, Phone, MapPin, Calendar, Clock, BookOpen, Hash } from 'lucide-react'

export default function ViewModal({ student, onClose, onEdit }) {
  if (!student) return null

  const initials = student.name
    .split(' ').slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '').join('')

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  const fmtDt = (d) => d
    ? new Date(d).toLocaleString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-header-icon" style={{ background: 'linear-gradient(135deg,#eff6ff,#e0e7ff)' }}>
              <BookOpen size={18} color="#3b82f6" />
            </div>
            <div>
              <div className="modal-title">Student Profile</div>
              <div className="modal-subtitle">ID #{student.id}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Hero row */}
          <div className="view-hero">
            <div className="view-avatar">{initials}</div>
            <div>
              <div className="view-hero-name">{student.name}</div>
              <div className="view-hero-id">Student ID: #{student.id}</div>
              <div className="view-hero-course">{student.course}</div>
            </div>
          </div>

          {/* Personal */}
          <div className="view-section">
            <div className="view-section-title">Personal Information</div>
            <div className="view-grid">
              <div className="view-field">
                <label><Mail size={10} style={{display:'inline',marginRight:3}} />Email</label>
                <span style={{color:'#2563eb',fontSize:'0.82rem'}}>{student.email}</span>
              </div>
              <div className="view-field">
                <label><Phone size={10} style={{display:'inline',marginRight:3}} />Phone</label>
                <span>{student.phone}</span>
              </div>
              <div className="view-field">
                <label><Calendar size={10} style={{display:'inline',marginRight:3}} />Date of Birth</label>
                <span>{fmtDate(student.date_of_birth)}</span>
              </div>
              <div className="view-field" style={{gridColumn:'1/-1'}}>
                <label><MapPin size={10} style={{display:'inline',marginRight:3}} />Address</label>
                <span>{student.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* Academic */}
          <div className="view-section">
            <div className="view-section-title">Academic Information</div>
            <div className="view-grid">
              <div className="view-field" style={{gridColumn:'1/-1'}}>
                <label><BookOpen size={10} style={{display:'inline',marginRight:3}} />Course / Programme</label>
                <span>{student.course}</span>
              </div>
              <div className="view-field">
                <label><Calendar size={10} style={{display:'inline',marginRight:3}} />Enrollment Date</label>
                <span>{fmtDate(student.enrollment_date)}</span>
              </div>
            </div>
          </div>

          {/* Record meta */}
          <div className="view-section">
            <div className="view-section-title">Record Metadata</div>
            <div className="view-grid">
              <div className="view-field">
                <label><Clock size={10} style={{display:'inline',marginRight:3}} />Created</label>
                <span style={{fontSize:'0.8rem'}}>{fmtDt(student.created_at)}</span>
              </div>
              <div className="view-field">
                <label><Clock size={10} style={{display:'inline',marginRight:3}} />Last Updated</label>
                <span style={{fontSize:'0.8rem'}}>{fmtDt(student.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}><X size={14} /> Close</button>
          <button className="btn btn-primary" onClick={() => onEdit(student)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit Student
          </button>
        </div>
      </div>
    </div>
  )
}
