import { useState, useEffect, useCallback, useRef } from 'react'
import { Users, BookOpen, Calendar, TrendingUp, Award, Plus } from 'lucide-react'

const DEFAULT_PREFERENCES = {
  theme: 'light',
  compactMode: false,
}

function loadPreferences() {
  try {
    const raw = localStorage.getItem('smartstudent-preferences')
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES
  } catch {
    return DEFAULT_PREFERENCES
  }
}

import Sidebar       from './components/Sidebar.jsx'
import StudentTable  from './components/StudentTable.jsx'
import StudentForm   from './components/StudentForm.jsx'
import ViewModal     from './components/ViewModal.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import Toast         from './components/Toast.jsx'
import CoursesPage   from './components/CoursesPage.jsx'
import ReportsPage   from './components/ReportsPage.jsx'
import SettingsPage  from './components/SettingsPage.jsx'

import {
  fetchStudents,
  fetchStats,
  createStudent,
  updateStudent,
  deleteStudent,
} from './services/studentService.js'

import './styles.css'

const PAGE_SIZE = 10
let _tid = 0
const mkToast = (type, message) => ({ id: ++_tid, type, message })

export default function App() {
  /* ── active page (sidebar navigation) ─── */
  const [activePage, setActivePage] = useState('dashboard')
  const [preferences, setPreferences] = useState(() => loadPreferences())

  useEffect(() => {
    localStorage.setItem('smartstudent-preferences', JSON.stringify(preferences))
  }, [preferences])

  const handleNavigate = (page) => {
    if (page === 'students') {
      setActivePage('dashboard')
      setFormOpen(true)
      setEditStudent(null)
      setFormApiError(null)
      return
    }

    setActivePage(page)
  }
  const [listData,     setListData]     = useState(null)
  const [listLoading,  setListLoading]  = useState(true)
  const [listError,    setListError]    = useState(null)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [courseFilter, setCourseFilter] = useState('')

  /* ── stats ─────────────────────────────── */
  const [stats, setStats] = useState(null)

  /* ── modal state ───────────────────────── */
  const [formOpen,     setFormOpen]     = useState(false)
  const [editStudent,  setEditStudent]  = useState(null)
  const [viewStudent,  setViewStudent]  = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  /* ── request flags ─────────────────────── */
  const [formLoading,   setFormLoading]   = useState(false)
  const [formApiError,  setFormApiError]  = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* ── toasts ────────────────────────────── */
  const [toasts, setToasts] = useState([])
  const addToast    = useCallback((t, m) => setToasts(p => [...p, mkToast(t, m)]), [])
  const removeToast = useCallback((id)   => setToasts(p => p.filter(t => t.id !== id)), [])

  /* ── debounced search ──────────────────── */
  const searchTimer = useRef(null)
  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setPage(1), 400)
  }
  const handleCourseFilter = (val) => { setCourseFilter(val); setPage(1) }

  /* ── data loaders ──────────────────────── */
  const loadStudents = useCallback(async () => {
    setListLoading(true); setListError(null)
    try {
      setListData(await fetchStudents({ page, pageSize: PAGE_SIZE, search, course: courseFilter }))
    } catch (err) {
      setListError(err.message || 'Failed to load students.')
    } finally { setListLoading(false) }
  }, [page, search, courseFilter])

  const loadStats = useCallback(async () => {
    try { setStats(await fetchStats()) } catch (_) {}
  }, [])

  useEffect(() => { loadStudents() }, [loadStudents])
  useEffect(() => { loadStats()    }, [loadStats])

  /* ── helpers ───────────────────────────── */
  const courseList = stats?.students_per_course?.map(r => r.course) ?? []
  const maxCount   = Math.max(...(stats?.students_per_course?.map(r => r.count) ?? [1]), 1)
  const fmt        = (d) => d ? new Date(d).toLocaleDateString('en-IN', { month:'short', year:'numeric' }) : '…'

  /* ── save ──────────────────────────────── */
  const handleSave = async (payload, isEdit) => {
    setFormLoading(true); setFormApiError(null)
    try {
      if (isEdit) {
        await updateStudent(editStudent.id, payload)
        addToast('success', `${payload.name} updated.`)
      } else {
        await createStudent(payload)
        addToast('success', `${payload.name} registered.`)
      }
      setFormOpen(false); setEditStudent(null)
      await Promise.all([loadStudents(), loadStats()])
    } catch (err) {
      setFormApiError(err.message || 'Something went wrong.')
    } finally { setFormLoading(false) }
  }

  /* ── delete ────────────────────────────── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteStudent(deleteTarget.id)
      addToast('success', `${deleteTarget.name} deleted.`)
      setDeleteTarget(null)
      const maxPage = Math.max(1, Math.ceil(((listData?.total ?? 1) - 1) / PAGE_SIZE))
      if (page > maxPage) setPage(maxPage)
      await Promise.all([loadStudents(), loadStats()])
    } catch (err) {
      addToast('error', err.message || 'Delete failed.')
      setDeleteTarget(null)
    } finally { setDeleteLoading(false) }
  }

  const openEdit  = (s) => { setViewStudent(null); setEditStudent(s); setFormApiError(null); setFormOpen(true) }
  const openAdd   = ()  => { setEditStudent(null);  setFormApiError(null); setFormOpen(true) }
  const closeForm = ()  => { if (formLoading) return; setFormOpen(false); setEditStudent(null); setFormApiError(null) }

  /* ────────────────────────────────────────
     RENDER
     Structure:
       <div.app-layout>
         <Sidebar />          ← fixed left, width=240px
         <div.main-content>   ← margin-left:240px, fills rest
           <header.top-header>   ← sticky, inside main-content
           <div.page-body>
             …content…
           </div>
         </div>
       </div>
  ─────────────────────────────────────── */
  return (
    <div className={`app-layout app-shell ${preferences.theme === 'dark' ? 'theme-dark' : 'theme-light'} ${preferences.compactMode ? 'compact-mode' : ''}`}>

      {/* ── Fixed sidebar ─────────────────── */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        totalStudents={stats?.total_students ?? 0}
      />

      {/* ── Main content (everything right of sidebar) ── */}
      <div className="main-content">

        {/* Top header — sticky, INSIDE main-content so it aligns correctly */}
        <header className="top-header">
          <div className="top-header-left">
            <h1 className="top-header-title">
              {activePage === 'dashboard' && 'Student Dashboard'}
              {activePage === 'courses'   && 'Courses'}
              {activePage === 'reports'   && 'Reports'}
              {activePage === 'settings'  && 'Settings'}
            </h1>
            <p className="top-header-sub">
              {activePage === 'dashboard' && 'Manage and monitor all student records'}
              {activePage === 'courses'   && 'All programmes with enrolled student counts'}
              {activePage === 'reports'   && 'Analytics summary from live student data'}
              {activePage === 'settings'  && 'Application information and API reference'}
            </p>
          </div>
          <div className="top-header-right">
            <span className="top-header-badge">SmartStudent Hub v1.0</span>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={14} strokeWidth={2.5} />
              Add Student
            </button>
          </div>
        </header>

        {/* Page body */}
        <div className="page-body">

          {/* ── Non-dashboard pages ─────────────── */}
          {activePage === 'courses'  && <CoursesPage  stats={stats} />}
          {activePage === 'reports'  && <ReportsPage  stats={stats} preferences={preferences} />}
          {activePage === 'settings' && <SettingsPage preferences={preferences} onPreferenceChange={setPreferences} />}

          {/* ── Dashboard (default) ─────────────── */}
          {activePage === 'dashboard' && (<>

          {/* ═══ HERO STAT STRIP ══════════════════ */}
          <div className="hero-strip">
            <div className="hero-stat">
              <div className="hero-stat-icon"><Users size={17} color="rgba(255,255,255,.9)" /></div>
              <div className="hero-stat-value">{stats?.total_students ?? '…'}</div>
              <div className="hero-stat-label">Total Students</div>
              <div className="hero-stat-sub">registered records</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon"><BookOpen size={17} color="rgba(255,255,255,.9)" /></div>
              <div className="hero-stat-value">{stats?.courses_offered ?? '…'}</div>
              <div className="hero-stat-label">Courses Offered</div>
              <div className="hero-stat-sub">distinct programmes</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon"><TrendingUp size={17} color="rgba(255,255,255,.9)" /></div>
              <div className="hero-stat-value">{fmt(stats?.newest_enrollment)}</div>
              <div className="hero-stat-label">Latest Enrollment</div>
              <div className="hero-stat-sub">most recent entry</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon"><Calendar size={17} color="rgba(255,255,255,.9)" /></div>
              <div className="hero-stat-value">{fmt(stats?.oldest_enrollment)}</div>
              <div className="hero-stat-label">First Enrollment</div>
              <div className="hero-stat-sub">oldest record</div>
            </div>
          </div>

          {/* ═══ BREAKDOWN + QUICK STATS ══════════ */}
          <div className="stats-row">

            {/* Course breakdown */}
            <div className="breakdown-card">
              <div className="card-header">
                <div className="card-title">
                  <div className="card-title-icon" style={{ background: 'linear-gradient(135deg,#eff6ff,#e0e7ff)' }}>
                    <Award size={14} color="#3b82f6" />
                  </div>
                  Students by Course
                </div>
                <span style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 600 }}>
                  {stats?.courses_offered ?? 0} courses
                </span>
              </div>

              {!stats || stats.students_per_course.length === 0
                ? <p style={{ fontSize: '.82rem', color: '#94a3b8', textAlign: 'center', padding: '1.5rem 0' }}>No data yet</p>
                : stats.students_per_course.map((row, i) => {
                    const idx = i % 7
                    const pct = Math.round((row.count / maxCount) * 100)
                    return (
                      <div className="course-row" key={row.course} style={{ animationDelay: `${i * 55}ms` }}>
                        <span className={`course-dot dot-${idx}`} />
                        <span className="course-name-text" title={row.course}>{row.course}</span>
                        <div className="bar-track">
                          <div className={`bar-fill fill-${idx}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="course-count-badge">{row.count}</span>
                      </div>
                    )
                  })
              }
            </div>

            {/* Quick summary */}
            <div className="quick-stats-card">
              <div className="card-header" style={{ marginBottom: '0.3rem' }}>
                <div className="card-title">
                  <div className="card-title-icon" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
                    <TrendingUp size={14} color="#10b981" />
                  </div>
                  Quick Summary
                </div>
              </div>
              {[
                { bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', icon: <Users size={17} color="#2563eb" />,    label: 'Total Enrolled',    val: `${stats?.total_students ?? '—'} students` },
                { bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', icon: <BookOpen size={17} color="#10b981" />, label: 'Courses Running',    val: `${stats?.courses_offered ?? '—'} programmes` },
                { bg: 'linear-gradient(135deg,#faf5ff,#ede9fe)', icon: <TrendingUp size={17} color="#7c3aed" />,label: 'Newest Enrollment', val: fmt(stats?.newest_enrollment) },
                { bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', icon: <Calendar size={17} color="#d97706" />, label: 'Oldest Enrollment',  val: fmt(stats?.oldest_enrollment) },
                { bg: 'linear-gradient(135deg,#fff1f2,#ffe4e6)', icon: <Award size={17} color="#e11d48" />,    label: 'Top Course',         val: stats?.students_per_course?.[0]?.course ?? '—' },
              ].map(({ bg, icon, label, val }) => (
                <div className="quick-stat-row" key={label}>
                  <div className="quick-stat-icon" style={{ background: bg }}>{icon}</div>
                  <div className="quick-stat-text">
                    <label>{label}</label>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ STUDENT TABLE ════════════════════ */}
          <StudentTable
            data={listData}
            loading={listLoading}
            error={listError}
            search={search}
            onSearch={handleSearch}
            courseFilter={courseFilter}
            onCourseFilter={handleCourseFilter}
            courses={courseList}
            page={page}
            onPageChange={setPage}
            onView={(s) => setViewStudent(s)}
            onEdit={openEdit}
            onDelete={(s) => setDeleteTarget(s)}
          />
          </>)}
        </div>
      </div>

      {/* ── Modals & toasts ─────────────────── */}
      {formOpen && (
        <StudentForm
          student={editStudent}
          onSave={handleSave}
          onCancel={closeForm}
          loading={formLoading}
          apiError={formApiError}
        />
      )}
      {viewStudent && (
        <ViewModal student={viewStudent} onClose={() => setViewStudent(null)} onEdit={openEdit} />
      )}
      {deleteTarget && (
        <ConfirmDialog
          student={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
