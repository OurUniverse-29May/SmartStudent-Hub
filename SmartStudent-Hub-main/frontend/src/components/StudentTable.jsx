import { Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Users } from 'lucide-react'

// Stable colour index from course name hash
const TAG_COUNT = 7
function tagIdx(course) {
  if (!course) return 0
  let h = 0
  for (let i = 0; i < course.length; i++) h = (h * 31 + course.charCodeAt(i)) & 0xffff
  return h % TAG_COUNT
}

// Avatar gradient palette
const AVATAR_GRADS = [
  'linear-gradient(135deg,#1e3a8a,#3b82f6)',
  'linear-gradient(135deg,#065f46,#10b981)',
  'linear-gradient(135deg,#4338ca,#818cf8)',
  'linear-gradient(135deg,#92400e,#f59e0b)',
  'linear-gradient(135deg,#9f1239,#f43f5e)',
  'linear-gradient(135deg,#6b21a8,#a78bfa)',
  'linear-gradient(135deg,#164e63,#22d3ee)',
]
function avatarGrad(name) {
  if (!name) return AVATAR_GRADS[0]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_GRADS[h % AVATAR_GRADS.length]
}
function initials(name='') {
  return name.split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()??'').join('')
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })
}

export default function StudentTable({
  data, loading, error,
  search, onSearch,
  courseFilter, onCourseFilter,
  courses=[],
  page, onPageChange,
  onView, onEdit, onDelete,
}) {
  const students   = data?.students    ?? []
  const total      = data?.total       ?? 0
  const totalPages = data?.total_pages ?? 1
  const pageSize   = data?.page_size   ?? 10

  function pageNums() {
    const s = Math.max(1, page-2), e = Math.min(totalPages, page+2)
    return Array.from({length: e-s+1}, (_,i) => s+i)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrapper">
          <span className="search-icon-wrap"><Search size={15}/></span>
          <input
            type="text"
            placeholder="Search by name, course, or email…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={courseFilter} onChange={(e) => onCourseFilter(e.target.value)}>
          <option value="">All Courses</option>
          {courses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table card */}
      <div className="table-card">
        <div className="table-card-header">
          <div className="table-card-title">
            <div className="table-card-title-icon">
              <Users size={16}/>
            </div>
            Student Directory
          </div>
          {!loading && !error && (
            <span className="record-pill">
              {total} {total === 1 ? 'student' : 'students'}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="spinner-wrap">
            <div className="spinner"/>
            <p style={{fontSize:'0.875rem',color:'#64748b'}}>Loading students…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="state-container">
            <div className="state-icon-wrap" style={{background:'#fff1f2',color:'#e11d48'}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="state-title">Could not load students</div>
            <p className="state-desc">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && students.length === 0 && (
          <div className="state-container">
            <div className="state-icon-wrap" style={{background:'#f0f4ff'}}>
              <Users size={32} color="#93c5fd" strokeWidth={1.5}/>
            </div>
            <div className="state-title">
              {search || courseFilter ? 'No students match your search' : 'No students yet'}
            </div>
            <p className="state-desc">
              {search || courseFilter
                ? 'Try clearing the search or filter.'
                : 'Click "Add Student" to register the first student.'}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && students.length > 0 && (
          <div className="table-wrapper">
            <table className="mobile-cards">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Course</th>
                  <th>Enrolled</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const idx  = tagIdx(s.course)
                  const grad = avatarGrad(s.name)
                  return (
                    <tr key={s.id}>
                      <td data-label="Student">
                        <div className="student-cell">
                          <div className="student-avatar" style={{background: grad}}>
                            {initials(s.name)}
                          </div>
                          <div className="student-info">
                            <div className="s-name">{s.name}</div>
                            <div className="s-id">#{s.id}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Email">
                        <a href={`mailto:${s.email}`}
                          style={{color:'#2563eb',textDecoration:'none',fontSize:'0.82rem',fontWeight:500}}
                          onClick={(e)=>e.stopPropagation()}>
                          {s.email}
                        </a>
                      </td>
                      <td data-label="Phone" style={{fontSize:'0.82rem',color:'#475569'}}>{s.phone}</td>
                      <td data-label="Course">
                        <span className={`course-tag tag-${idx}`} title={s.course}>{s.course}</span>
                      </td>
                      <td data-label="Enrolled" style={{fontSize:'0.82rem',color:'#475569',whiteSpace:'nowrap'}}>
                        {fmtDate(s.enrollment_date)}
                      </td>
                      <td data-label="Actions">
                        <div className="actions-cell">
                          <button className="action-btn view-btn" title="View details" onClick={()=>onView(s)}>
                            <Eye size={14}/>
                          </button>
                          <button className="action-btn edit-btn" title="Edit" onClick={()=>onEdit(s)}>
                            <Pencil size={14}/>
                          </button>
                          <button className="action-btn del-btn" title="Delete" onClick={()=>onDelete(s)}>
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination-bar">
            <span className="page-info-text">
              Showing {Math.min((page-1)*pageSize+1, total)}–{Math.min(page*pageSize, total)} of {total} students
            </span>
            <div className="page-controls">
              <button className="page-btn" onClick={()=>onPageChange(page-1)} disabled={page===1} title="Previous">
                <ChevronLeft size={14}/>
              </button>
              {pageNums().map((n) => (
                <button key={n} className={`page-btn${n===page?' active':''}`} onClick={()=>onPageChange(n)}>{n}</button>
              ))}
              <button className="page-btn" onClick={()=>onPageChange(page+1)} disabled={page===totalPages} title="Next">
                <ChevronRight size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
