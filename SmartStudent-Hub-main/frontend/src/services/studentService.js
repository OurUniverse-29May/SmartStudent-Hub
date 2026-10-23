/**
 * studentService.js
 *
 * All HTTP calls to the FastAPI backend.
 * Base URL is proxied through Vite → /api/* → http://127.0.0.1:8000/*
 *
 * Backend routes (never modified):
 *   POST   /students/
 *   GET    /students/?page&page_size&search&name&course&email
 *   GET    /students/{id}
 *   PUT    /students/{id}
 *   DELETE /students/{id}
 *   GET    /stats
 *
 * Response shapes (from schemas.py):
 *   StudentResponse : { id, name, date_of_birth, email, phone, course,
 *                       address, enrollment_date, created_at, updated_at }
 *   PaginatedStudents: { total, page, page_size, total_pages, students[] }
 *   DashboardStats  : { total_students, courses_offered,
 *                       students_per_course[{course,count}],
 *                       newest_enrollment, oldest_enrollment }
 *   DELETE response : { message, deleted_id }
 *   Error response  : { detail: string }
 */

const BASE = '/api'

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Unwrap a fetch response.
 * On non-2xx, parse the FastAPI { detail } error and throw it as an Error.
 */
async function handleResponse(res) {
  if (res.ok) {
    // 204 No Content or empty body
    const text = await res.text()
    return text ? JSON.parse(text) : null
  }
  let message = `HTTP ${res.status}`
  try {
    const err = await res.json()
    if (err.detail) {
      // FastAPI validation errors return detail as an array
      if (Array.isArray(err.detail)) {
        message = err.detail.map((e) => e.msg || JSON.stringify(e)).join('; ')
      } else {
        message = err.detail
      }
    }
  } catch (_) {
    // couldn't parse body — keep the status message
  }
  throw new Error(message)
}

// ── API calls ───────────────────────────────────────────────────────────────

/**
 * GET /students/
 * Supports: page, page_size, search, name, course, email
 * Returns: PaginatedStudents
 */
export async function fetchStudents({ page = 1, pageSize = 10, search = '', course = '' } = {}) {
  const params = new URLSearchParams()
  params.set('page', page)
  params.set('page_size', pageSize)
  if (search.trim()) params.set('search', search.trim())
  if (course.trim()) params.set('course', course.trim())

  const res = await fetch(`${BASE}/students/?${params}`)
  return handleResponse(res)
}

/**
 * GET /students/{id}
 * Returns: StudentResponse
 */
export async function fetchStudentById(id) {
  const res = await fetch(`${BASE}/students/${id}`)
  return handleResponse(res)
}

/**
 * Fetch every student record across pages for exports and bulk actions.
 */
export async function fetchAllStudents({ pageSize = 200 } = {}) {
  const firstPage = await fetchStudents({ page: 1, pageSize })
  const pages = Math.max(1, firstPage.total_pages ?? 1)
  if (pages <= 1) return firstPage.students

  const remainingRequests = []
  for (let page = 2; page <= pages; page += 1) {
    remainingRequests.push(fetchStudents({ page, pageSize }))
  }

  const rest = await Promise.all(remainingRequests)
  return [firstPage.students, ...rest.map((item) => item.students)].flat()
}

/**
 * Export all students as a CSV file.
 */
export async function exportStudentsCsv() {
  const students = await fetchAllStudents({ pageSize: 200 })
  const headers = [
    'id',
    'name',
    'date_of_birth',
    'email',
    'phone',
    'course',
    'address',
    'enrollment_date',
    'created_at',
    'updated_at',
  ]

  const toCsvCell = (value) => {
    const text = value == null ? '' : String(value)
    return `"${text.replace(/"/g, '""')}"`
  }

  const rows = students.map((student) => headers.map((header) => toCsvCell(student[header])).join(','))
  const csvText = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'students-export.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * POST /students/
 * Body: StudentCreate (all fields required except address)
 * Returns: StudentResponse (201)
 */
export async function createStudent(data) {
  const res = await fetch(`${BASE}/students/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

/**
 * PUT /students/{id}
 * Body: StudentUpdate (all fields required)
 * Returns: StudentResponse (200)
 */
export async function updateStudent(id, data) {
  const res = await fetch(`${BASE}/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

/**
 * DELETE /students/{id}
 * Returns: { message, deleted_id }
 */
export async function deleteStudent(id) {
  const res = await fetch(`${BASE}/students/${id}`, { method: 'DELETE' })
  return handleResponse(res)
}

/**
 * GET /stats
 * Returns: DashboardStats
 */
export async function fetchStats() {
  const res = await fetch(`${BASE}/stats`)
  return handleResponse(res)
}
