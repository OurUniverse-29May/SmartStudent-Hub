import { useState, useEffect } from 'react'
import { X, Save, UserPlus, User, Mail, Phone, BookOpen, MapPin, Calendar, AlertCircle } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Field MUST be defined outside StudentForm to prevent focus loss on re-render.
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', date_of_birth: '', email: '',
  phone: '', course: '', address: '', enrollment_date: '',
}

const COURSE_SUGGESTIONS = [
  'B.Tech Computer Science',
  'B.Tech Mechanical Engineering',
  'B.Tech Electrical Engineering',
  'B.Sc Data Science',
  'M.Sc Data Science',
  'M.Tech Artificial Intelligence',
  'MBA Business Analytics',
]

function validate(f) {
  const e = {}
  const today = new Date(); today.setHours(0,0,0,0)

  if (!f.name.trim())                      e.name = 'Name is required.'
  else if (f.name.trim().length < 2)       e.name = 'At least 2 characters.'
  else if (f.name.trim().length > 120)     e.name = 'Max 120 characters.'

  if (!f.email.trim())                     e.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email.'

  if (!f.phone.trim()) {
    e.phone = 'Phone is required.'
  } else {
    const d = f.phone.replace(/[+\-\s()]/g,'')
    if (!/^\d+$/.test(d))              e.phone = 'Only digits, spaces, hyphens, or +.'
    else if (d.length < 7 || d.length > 15) e.phone = 'Must be 7–15 digits.'
  }

  if (!f.course.trim())                    e.course = 'Course is required.'
  else if (f.course.trim().length < 2)     e.course = 'At least 2 characters.'

  if (!f.date_of_birth) {
    e.date_of_birth = 'Date of birth is required.'
  } else {
    const dob = new Date(f.date_of_birth)
    if (dob >= today) e.date_of_birth = 'Must be in the past.'
    else if ((today - dob) / (1e3*60*60*24*365) > 100) e.date_of_birth = 'Age cannot exceed 100 years.'
  }

  if (!f.enrollment_date) {
    e.enrollment_date = 'Enrollment date is required.'
  } else {
    const ed = new Date(f.enrollment_date)
    const max = new Date(today); max.setDate(max.getDate()+30)
    if (ed > max) e.enrollment_date = 'Not more than 30 days in the future.'
  }

  return e
}

// Standalone Field — stable identity, no re-mount on parent state change
function Field({ id, label, icon, required, type='text', fields, errors, touched, onChange, onBlur, loading, ...rest }) {
  const err = touched[id] && errors[id]
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {icon && <span style={{display:'flex',alignItems:'center',color:'#94a3b8'}}>{icon}</span>}
        {label}
        {required && <span className="req-star">*</span>}
      </label>
      <input
        id={id} name={id} type={type}
        value={fields[id]}
        onChange={onChange}
        onBlur={onBlur}
        className={`form-input${err ? ' has-error' : ''}`}
        disabled={loading}
        autoComplete="off"
        {...rest}
      />
      {err && (
        <span className="field-error">
          <AlertCircle size={12} /> {errors[id]}
        </span>
      )}
    </div>
  )
}

export default function StudentForm({ student, onSave, onCancel, loading, apiError }) {
  const isEdit = Boolean(student)
  const [fields,  setFields]  = useState(EMPTY_FORM)
  const [errors,  setErrors]  = useState({})
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (student) {
      setFields({
        name:            student.name            ?? '',
        date_of_birth:   student.date_of_birth   ?? '',
        email:           student.email           ?? '',
        phone:           student.phone           ?? '',
        course:          student.course          ?? '',
        address:         student.address         ?? '',
        enrollment_date: student.enrollment_date ?? '',
      })
    } else {
      setFields(EMPTY_FORM)
    }
    setErrors({}); setTouched({})
  }, [student])

  function handleChange(e) {
    const { name, value } = e.target
    const updated = { ...fields, [name]: value }
    setFields(updated)
    if (touched[name]) {
      const errs = validate(updated)
      setErrors((p) => ({ ...p, [name]: errs[name] }))
    }
  }

  function handleBlur(e) {
    const { name } = e.target
    setTouched((p) => ({ ...p, [name]: true }))
    setErrors((p) => ({ ...p, [name]: validate(fields)[name] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const allTouched = Object.keys(EMPTY_FORM).reduce((a,k)=>({...a,[k]:true}),{})
    setTouched(allTouched)
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length) return
    await onSave({
      name:            fields.name.trim(),
      date_of_birth:   fields.date_of_birth,
      email:           fields.email.trim().toLowerCase(),
      phone:           fields.phone.trim(),
      course:          fields.course.trim(),
      address:         fields.address.trim() || null,
      enrollment_date: fields.enrollment_date,
    }, isEdit)
  }

  const fp = { fields, errors, touched, onChange: handleChange, onBlur: handleBlur, loading }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-header-icon" style={{
              background: isEdit
                ? 'linear-gradient(135deg,#fffbeb,#fef3c7)'
                : 'linear-gradient(135deg,#eff6ff,#e0e7ff)'
            }}>
              {isEdit
                ? <Save size={17} color="#d97706" />
                : <UserPlus size={17} color="#3b82f6" />
              }
            </div>
            <div>
              <div className="modal-title">{isEdit ? 'Edit Student' : 'Register New Student'}</div>
              <div className="modal-subtitle">
                {isEdit ? `Editing record for ${student.name}` : 'Fill in the student details below'}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onCancel} disabled={loading}><X size={16}/></button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {apiError && (
              <div className="api-error-banner">
                <AlertCircle size={16} style={{flexShrink:0,marginTop:1}} />
                <span>{apiError}</span>
              </div>
            )}

            {/* Personal section */}
            <div className="form-section-label">
              <User size={12} /> Personal Information
            </div>
            <div className="form-grid">
              <Field id="name"          label="Full Name"     required icon={<User size={12}/>}     type="text"  placeholder="e.g. Arjun Sharma"       {...fp} />
              <Field id="email"         label="Email Address" required icon={<Mail size={12}/>}     type="email" placeholder="e.g. arjun@example.com"  {...fp} />
              <Field id="phone"         label="Phone Number"  required icon={<Phone size={12}/>}    type="tel"   placeholder="e.g. +91-9876543210"     {...fp} />
              <Field id="date_of_birth" label="Date of Birth" required icon={<Calendar size={12}/>} type="date"  max={new Date().toISOString().split('T')[0]} {...fp} />
            </div>

            {/* Academic section */}
            <div className="form-section-label">
              <BookOpen size={12} /> Academic Information
            </div>
            <div className="form-grid">
              {/* Course with datalist */}
              <div className="form-group">
                <label className="form-label" htmlFor="course">
                  <span style={{display:'flex',alignItems:'center',color:'#94a3b8'}}><BookOpen size={12}/></span>
                  Course<span className="req-star">*</span>
                </label>
                <input
                  id="course" name="course" type="text"
                  list="course-datalist"
                  value={fields.course}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input${touched.course && errors.course ? ' has-error' : ''}`}
                  placeholder="e.g. B.Tech Computer Science"
                  disabled={loading}
                  autoComplete="off"
                />
                <datalist id="course-datalist">
                  {COURSE_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
                </datalist>
                {touched.course && errors.course && (
                  <span className="field-error"><AlertCircle size={12}/>{errors.course}</span>
                )}
              </div>

              <Field id="enrollment_date" label="Enrollment Date" required icon={<Calendar size={12}/>} type="date" {...fp} />

              <div className="form-group full">
                <label className="form-label" htmlFor="address">
                  <span style={{display:'flex',alignItems:'center',color:'#94a3b8'}}><MapPin size={12}/></span>
                  Address <span className="opt-label">(optional)</span>
                </label>
                <textarea
                  id="address" name="address"
                  className="form-textarea"
                  value={fields.address}
                  onChange={handleChange}
                  placeholder="Home or correspondence address"
                  disabled={loading}
                  rows={2}
                />
              </div>
            </div>

            <p className="req-note">
              Fields marked <span style={{color:'#e11d48'}}>*</span> are required.
            </p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              <X size={14}/> Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {isEdit
                ? <><Save size={14}/>{loading ? 'Saving…' : 'Save Changes'}</>
                : <><UserPlus size={14}/>{loading ? 'Registering…' : 'Register Student'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
