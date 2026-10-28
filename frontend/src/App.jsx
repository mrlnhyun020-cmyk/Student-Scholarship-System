
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  GraduationCap, Search, Plus, RefreshCw, Users, CheckCircle2,
  Clock3, XCircle, Download, ChevronDown, BookOpen, Menu, X,
  AlertCircle, Filter, LoaderCircle, Sparkles, Pencil, Trash2, Award
} from 'lucide-react'
import {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  loginUser,
  registerUser,
  getMyProfile,
  getPublishedScholarships,
  getMyApplications,
  submitApplication,
  getScholarships,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  getAllApplications,
  updateApplicationStatus,
  openApplicationDocument,
} from './api'

const initialForm = {
  studentId: '',
  fullName: '',
  email: '',
  course: '',
  yearLevel: '',
  scholarshipType: '',
  scholarshipStatus: 'Pending',
}

const statuses = ['Pending', 'Approved', 'Rejected']
const courses = ['BSIT', 'BSCS', 'BSBA', 'BSED', 'BEED', 'BSHM', 'BSCRIM', 'Other']
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']

const initialScholarshipForm = {
  title: '', provider: '', description: '', benefits: '', eligibility: '',
  deadline: '', requiredDocuments: '', status: 'Draft',
}

function statusClass(status) {
  if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
  if (status === 'Rejected') return 'bg-rose-50 text-rose-700 ring-rose-600/15'
  return 'bg-amber-50 text-amber-700 ring-amber-600/15'
}

function normalizeStudent(s) {
  return { ...s, _id: s._id || s.id || `${s.studentId}-${s.email}` }
}

function StatCard({ label, value, note, icon: Icon, tint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{note}</p>
        </div>
        <div className={`rounded-xl p-3 ${tint}`}><Icon size={21} /></div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}{required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  )
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('scholartrack-auth') || 'null')
    } catch {
      return null
    }
  })
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '' })
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [students, setStudents] = useState([])
  const [studentProfile, setStudentProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [studentPage, setStudentPage] = useState('browse')
  const [publishedScholarships, setPublishedScholarships] = useState([])
  const [publishedLoading, setPublishedLoading] = useState(false)
  const [publishedError, setPublishedError] = useState('')
  const [myApplications, setMyApplications] = useState([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [applicationsError, setApplicationsError] = useState('')
  const [applicationScholarship, setApplicationScholarship] = useState(null)
  const [applicationSaving, setApplicationSaving] = useState(false)
  const [applicationNotice, setApplicationNotice] = useState('')
  const [applicationForm, setApplicationForm] = useState({ course: '', yearLevel: '', gradeAverage: '', statement: '' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [adminPage, setAdminPage] = useState('students')
  const [adminApplications, setAdminApplications] = useState([])
  const [adminApplicationsLoading, setAdminApplicationsLoading] = useState(false)
  const [adminApplicationsError, setAdminApplicationsError] = useState('')
  const [reviewingApplicationId, setReviewingApplicationId] = useState('')
  const [scholarships, setScholarships] = useState([])
  const [scholarshipsLoading, setScholarshipsLoading] = useState(false)
  const [scholarshipModalOpen, setScholarshipModalOpen] = useState(false)
  const [editingScholarship, setEditingScholarship] = useState(null)
  const [scholarshipForm, setScholarshipForm] = useState(initialScholarshipForm)
  const [scholarshipSaving, setScholarshipSaving] = useState(false)
  const [scholarshipDeletingId, setScholarshipDeletingId] = useState('')

  const loadMyApplications = useCallback(async () => {
    setApplicationsLoading(true)
    setApplicationsError('')
    try {
      const result = await getMyApplications(auth?.token)
      const rows = Array.isArray(result) ? result : (result.data || result.applications || [])
      setMyApplications(rows)
    } catch (e) {
      setApplicationsError(e.message || 'Could not load your applications.')
    } finally {
      setApplicationsLoading(false)
    }
  }, [auth?.token])

 
async function handleSubmitApplication(event) {
  event.preventDefault()
  if (!applicationScholarship) return

  setApplicationSaving(true)
  setApplicationsError('')
  setApplicationNotice('')

  try {
    const result = await submitApplication({
      scholarshipId:
        applicationScholarship._id || applicationScholarship.id,
      course: applicationForm.course.trim(),
      yearLevel: applicationForm.yearLevel,
      gradeAverage: Number(applicationForm.gradeAverage),
      statement: applicationForm.statement.trim(),

      // Selected files will be added to applicationForm.documents.
      documents: applicationForm.documents || [],
    }, auth?.token)

    setApplicationNotice(
      result.message || 'Application submitted successfully.'
    )

    setApplicationScholarship(null)
    setApplicationForm({
      course: '',
      yearLevel: '',
      gradeAverage: '',
      statement: '',
      documents: [],
    })

    await loadMyApplications()
    setStudentPage('applications')
  } catch (e) {
    setApplicationsError(
      e.message || 'Could not submit your application.'
    )
  } finally {
    setApplicationSaving(false)
  }
}


  useEffect(() => {
    if (auth?.user?.role === 'student' && auth?.token) {
      loadMyApplications()
    } else {
      setMyApplications([])
      setApplicationsError('')
    }
  }, [auth?.token, auth?.user?.role, loadMyApplications])

  const loadScholarships = useCallback(async () => {
    setScholarshipsLoading(true)
    setError('')
    try {
      const result = await getScholarships(auth?.token)
      const rows = Array.isArray(result) ? result : (result.data || result.scholarships || [])
      setScholarships(rows)
    } catch (e) {
      setError(e.message || 'Could not load scholarships.')
    } finally {
      setScholarshipsLoading(false)
    }
  }, [auth?.token])

  const loadAdminApplications = useCallback(async () => {
  setAdminApplicationsLoading(true)
  setAdminApplicationsError('')

  try {
    const result = await getAllApplications(auth?.token)
    const rows = Array.isArray(result)
      ? result
      : (result.data || result.applications || [])

    setAdminApplications(rows)
  } catch (e) {
    setAdminApplicationsError(
      e.message || 'Could not load student applications.'
    )
  } finally {
    setAdminApplicationsLoading(false)
  }
}, [auth?.token])

async function handleApplicationReview(applicationId, status) {
  const feedback = window.prompt(
    `Enter feedback for this ${status.toLowerCase()} decision (optional):`
  )

  if (feedback === null) return

  setReviewingApplicationId(applicationId)
  setAdminApplicationsError('')

  try {
    await updateApplicationStatus(
      applicationId,
      status,
      feedback,
      auth?.token
    )

    await loadAdminApplications()
  } catch (e) {
    setAdminApplicationsError(
      e.message || 'Could not update the application.'
    )
  } finally {
    setReviewingApplicationId('')
  }
}

  function openAddScholarship() {
    setError('')
    setNotice('')
    setEditingScholarship(null)
    setScholarshipForm({ ...initialScholarshipForm })
    setScholarshipModalOpen(true)
  }

  function openEditScholarship(item) {
    setError('')
    setNotice('')
    setEditingScholarship(item)
    setScholarshipForm({
      title: item.title || '',
      provider: item.provider || '',
      description: item.description || '',
      benefits: item.benefits || '',
      eligibility: item.eligibility || '',
      deadline: item.deadline ? new Date(item.deadline).toISOString().slice(0, 10) : '',
      requiredDocuments: Array.isArray(item.requiredDocuments) ? item.requiredDocuments.join(', ') : '',
      status: item.status || 'Draft',
    })
    setScholarshipModalOpen(true)
  }

  async function handleSaveScholarship(event) {
    event.preventDefault()
    setScholarshipSaving(true)
    setError('')
    setNotice('')
    const data = {
      title: scholarshipForm.title.trim(),
      provider: scholarshipForm.provider.trim(),
      description: scholarshipForm.description.trim(),
      benefits: scholarshipForm.benefits.trim(),
      eligibility: scholarshipForm.eligibility.trim(),
      deadline: scholarshipForm.deadline,
      requiredDocuments: scholarshipForm.requiredDocuments.split(',').map(value => value.trim()).filter(Boolean),
      status: scholarshipForm.status,
    }
    try {
      if (editingScholarship) {
        await updateScholarship(editingScholarship._id, data, auth?.token)
        setNotice('Scholarship updated successfully.')
      } else {
        await createScholarship(data, auth?.token)
        setNotice('Scholarship created successfully.')
      }
      setScholarshipModalOpen(false)
      setEditingScholarship(null)
      setScholarshipForm({ ...initialScholarshipForm })
      await loadScholarships()
    } catch (e) {
      setError(e.message || 'Could not save scholarship.')
    } finally {
      setScholarshipSaving(false)
    }
  }

  async function handleDeleteScholarship(item) {
    if (!window.confirm(`Delete the scholarship “${item.title}”? This cannot be undone.`)) return
    setError('')
    setNotice('')
    setScholarshipDeletingId(item._id)
    try {
      await deleteScholarship(item._id, auth?.token)
      setNotice('Scholarship deleted successfully.')
      await loadScholarships()
    } catch (e) {
      setError(e.message || 'Could not delete scholarship.')
    } finally {
      setScholarshipDeletingId('')
    }
  }

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getStudents(auth?.token)
      const rows = Array.isArray(result) ? result : (result.data || result.students || [])
      setStudents(rows.map(normalizeStudent))
    } catch (e) {
      setError(e.message || 'Could not load students.')
    } finally {
      setLoading(false)
    }
  }, [auth?.token])

  useEffect(() => {
    if (auth?.user?.role === 'admin' && auth?.token) {
      loadStudents()
    } else {
      setStudents([])
      setLoading(false)
    }
  }, [auth, loadStudents])

  useEffect(() => {
    if (auth?.user?.role !== 'student' || !auth?.token) {
      setStudentProfile(null)
      setProfileError('')
      setProfileLoading(false)
      return
    }

    let cancelled = false
    setProfileLoading(true)
    setProfileError('')

    getMyProfile(auth.token)
      .then((result) => {
        if (!cancelled) {
          setStudentProfile(result.data || null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setProfileError(e.message || 'Could not load your scholarship profile.')
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [auth?.token, auth?.user?.role])

  useEffect(() => {
    if (auth?.user?.role !== 'student' || !auth?.token) {
      setPublishedScholarships([])
      setPublishedError('')
      setPublishedLoading(false)
      return
    }

    let cancelled = false
    setPublishedLoading(true)
    setPublishedError('')

    getPublishedScholarships(auth.token)
      .then((result) => {
        if (cancelled) return
        const rows = Array.isArray(result)
          ? result
          : (result.data || result.scholarships || [])
        setPublishedScholarships(rows)
      })
      .catch((e) => {
        if (!cancelled) setPublishedError(e.message || 'Could not load published scholarships.')
      })
      .finally(() => {
        if (!cancelled) setPublishedLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [auth?.token, auth?.user?.role])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter((s) => {
      const matchesSearch = !q || [
        s.studentId, s.fullName, s.email, s.course,
        s.scholarshipType, s.scholarshipStatus
      ].some(v => String(v || '').toLowerCase().includes(q))

      const matchesStatus =
        statusFilter === 'All statuses' ||
        (s.scholarshipStatus || 'Pending') === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [students, search, statusFilter])

  const counts = useMemo(() => ({
    total: students.length,
    approved: students.filter(s => s.scholarshipStatus === 'Approved').length,
    pending: students.filter(s => !s.scholarshipStatus || s.scholarshipStatus === 'Pending').length,
    rejected: students.filter(s => s.scholarshipStatus === 'Rejected').length,
  }), [students])

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function openAddModal() {
    setError('')
    setNotice('')
    setEditingStudent(null)
    setForm({ ...initialForm })
    setModalOpen(true)
  }

  function handleEdit(student) {
    setError('')
    setNotice('')
    setEditingStudent(student)
    setForm({
      studentId: student.studentId || '',
      fullName: student.fullName || '',
      email: student.email || '',
      course: student.course || '',
      yearLevel: student.yearLevel || '',
      scholarshipType: student.scholarshipType || '',
      scholarshipStatus: student.scholarshipStatus || 'Pending',
    })
    setModalOpen(true)
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    const studentData = {
      studentId: form.studentId.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      course: form.course,
      yearLevel: form.yearLevel,
      scholarshipType: form.scholarshipType.trim(),
      scholarshipStatus: form.scholarshipStatus,
    }

    try {
      if (editingStudent) {
        await updateStudent(editingStudent._id, studentData, auth?.token)
        setNotice('Student record updated successfully.')
      } else {
        await createStudent(studentData, auth?.token)
        setNotice('Student record added successfully.')
      }

      setModalOpen(false)
      setEditingStudent(null)
      setForm({ ...initialForm })
      await loadStudents()
    } catch (e) {
      setError(e.message || 'Could not save student.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(student) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.fullName || student.studentId}? This cannot be undone.`
    )
    if (!confirmed) return

    setError('')
    setNotice('')
    setDeletingId(student._id)

    try {
      await deleteStudent(student._id, auth?.token)
      setNotice('Student record deleted successfully.')
      await loadStudents()
    } catch (e) {
      setError(e.message || 'Could not delete student.')
    } finally {
      setDeletingId('')
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setAuthBusy(true)
    setAuthError('')

    try {
      if (authMode === 'register') {
        await registerUser({
          fullName: authForm.fullName.trim(),
          email: authForm.email.trim(),
          password: authForm.password,
        })
        setAuthMode('login')
        setAuthForm(prev => ({ ...prev, password: '' }))
        setAuthError('Account created. Please log in with your new account.')
      } else {
        const result = await loginUser({
          email: authForm.email.trim(),
          password: authForm.password,
        })
        const nextAuth = { token: result.token, user: result.data }
        sessionStorage.setItem('scholartrack-auth', JSON.stringify(nextAuth))
        setAuth(nextAuth)
        setAuthForm({ fullName: '', email: '', password: '' })
      }
    } catch (e) {
      setAuthError(e.message || 'Authentication failed. Please try again.')
    } finally {
      setAuthBusy(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('scholartrack-auth')
    setAuth(null)
    setStudents([])
    setError('')
    setNotice('')
    setAuthError('')
    setAuthMode('login')
  }

  function exportCsv() {
    const headers = [
      'Student ID', 'Full Name', 'Email', 'Course',
      'Year Level', 'Scholarship Type', 'Status'
    ]
    const keys = [
      'studentId', 'fullName', 'email', 'course',
      'yearLevel', 'scholarshipType', 'scholarshipStatus'
    ]
    const escape = v => `"${String(v ?? '').replaceAll('"', '""')}"`
    const csv = [
      headers.map(escape).join(','),
      ...filtered.map(s => keys.map(k => escape(s[k])).join(','))
    ].join('\r\n')

    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'scholarship-students.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!auth?.token || !auth?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
          <div className="hidden flex-col justify-between bg-slate-950 p-10 text-white md:flex">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500"><GraduationCap size={27} /></div>
              <div><p className="text-xl font-bold">Scholar<span className="text-blue-400">Track</span></p><p className="text-sm text-slate-400">Scholarship management</p></div>
            </div>
            <div><p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Your future, organized</p><h1 className="mt-4 text-4xl font-bold leading-tight">Manage scholarship records with confidence.</h1><p className="mt-4 leading-7 text-slate-400">A central place for scholarship administration and student access.</p></div>
            <p className="text-xs text-slate-500">React · Express · MongoDB</p>
          </div>
          <div className="p-6 sm:p-10">
            <div className="mb-8 flex items-center gap-3 md:hidden"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white"><GraduationCap size={24} /></div><div><p className="font-bold">ScholarTrack</p><p className="text-xs text-slate-500">Scholarship management</p></div></div>
            <p className="text-sm font-semibold text-blue-600">WELCOME TO SCHOLARTRACK</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{authMode === 'login' ? 'Sign in to your account' : 'Create a student account'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{authMode === 'login' ? 'Enter your email and password to continue.' : 'Registration creates a student account. Admin access is assigned separately.'}</p>
            <form onSubmit={handleAuthSubmit} className="mt-7 space-y-4">
              {authMode === 'register' && <Field label="Full name" required><input className="form-input" autoComplete="name" required value={authForm.fullName} onChange={e => setAuthForm(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Your full name" /></Field>}
              <Field label="Email address" required><input className="form-input" type="email" autoComplete="email" required value={authForm.email} onChange={e => setAuthForm(prev => ({ ...prev, email: e.target.value }))} placeholder="you@example.com" /></Field>
              <Field label="Password" required><input className="form-input" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={8} required value={authForm.password} onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))} placeholder="At least 8 characters" /></Field>
              {authError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{authError}</div>}
              <button disabled={authBusy} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">{authBusy && <LoaderCircle size={17} className="animate-spin" />}{authBusy ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}</button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">{authMode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button type="button" className="font-semibold text-blue-600 hover:text-blue-700" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }}>{authMode === 'login' ? 'Register as student' : 'Sign in'}</button></p>
          </div>
        </div>
      </div>
    )
  }

  if (auth.user.role !== 'admin') {
    const scholarship = studentProfile?.scholarship

    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white"><GraduationCap size={26} /></div>
              <div><p className="text-lg font-bold">Scholar<span className="text-blue-600">Track</span></p><p className="text-sm text-slate-500">Student portal</p></div>
            </div>
            <button onClick={handleLogout} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Log out</button>
          </header>

          <section className="mt-6 rounded-2xl bg-slate-950 p-7 text-white shadow-sm sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">Student dashboard</p>
            <h1 className="mt-3 text-3xl font-bold">Welcome, {studentProfile?.user?.fullName || auth.user.fullName}!</h1>
            <p className="mt-2 text-slate-300">Browse scholarship opportunities and review your scholarship record.</p>
            <p className="mt-4 text-sm text-slate-400">Signed in as {studentProfile?.user?.email || auth.user.email}</p>
          </section>

          <nav className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm" aria-label="Student pages">
            <button onClick={() => setStudentPage('browse')} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${studentPage === 'browse' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span className="inline-flex items-center gap-2"><Search size={16} /> Browse scholarships</span>
            </button>
            <button onClick={() => setStudentPage('record')} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${studentPage === 'record' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span className="inline-flex items-center gap-2"><BookOpen size={16} /> My scholarship record</span>
            </button>
            <button onClick={() => { setStudentPage('applications'); loadMyApplications(); }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${studentPage === 'applications' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span className="inline-flex items-center gap-2"><BookOpen size={16} /> My applications</span>
            </button>
          </nav>

          {studentPage === 'browse' ? (
            <section className="mt-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Available scholarships</h2>
                  <p className="mt-1 text-sm text-slate-500">Explore published opportunities before their deadlines.</p>
                </div>
                <button onClick={() => {
                  setPublishedLoading(true)
                  setPublishedError('')
                  getPublishedScholarships(auth.token)
                    .then(result => setPublishedScholarships(Array.isArray(result) ? result : (result.data || result.scholarships || [])))
                    .catch(e => setPublishedError(e.message || 'Could not load published scholarships.'))
                    .finally(() => setPublishedLoading(false))
                }} disabled={publishedLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  <RefreshCw size={15} className={publishedLoading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>

              {publishedError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{publishedError}</div>}

              {publishedLoading ? (
                <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm"><LoaderCircle size={25} className="mx-auto animate-spin text-blue-600" /><p className="mt-3 text-sm">Loading available scholarships...</p></div>
              ) : publishedScholarships.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <Award size={32} className="mx-auto text-slate-300" />
                  <h3 className="mt-3 font-bold text-slate-800">No scholarships available right now</h3>
                  <p className="mt-1 text-sm text-slate-500">Published opportunities with open deadlines will appear here. Please check again later.</p>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {publishedScholarships.map((item) => (
                    <article key={item._id || item.id || item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><Award size={14} /> Scholarship opportunity</div>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Published</span>
                      </div>
                      <h3 className="mt-4 text-xl font-bold text-slate-900">{item.title || 'Untitled scholarship'}</h3>
                      <p className="mt-1 text-sm font-medium text-slate-500">Provider: {item.provider || 'Not specified'}</p>
                      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{item.description || 'No description provided.'}</p>
                      <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
                        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Benefits</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{item.benefits || 'Contact the provider for details.'}</p></div>
                        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Eligibility</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{item.eligibility || 'Check with the provider for eligibility requirements.'}</p></div>
                        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Required documents</p>
                          {Array.isArray(item.requiredDocuments) && item.requiredDocuments.length > 0
                            ? <ul className="mt-1 list-inside list-disc text-sm leading-6 text-slate-700">{item.requiredDocuments.map((doc, index) => <li key={`${doc}-${index}`}>{doc}</li>)}</ul>
                            : <p className="mt-1 text-sm text-slate-700">No documents listed.</p>}
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><Clock3 size={16} className="shrink-0 text-blue-600" /><span>Deadline: <strong>{item.deadline ? new Date(item.deadline).toLocaleDateString() : 'Not specified'}</strong></span></div>
                      </div>
                      {(() => {
                        const scholarshipId = String(item._id || item.id || '')
                        const alreadyApplied = myApplications.some((app) => {
                          const appliedScholarship = app.scholarship
                          const appliedId = appliedScholarship && typeof appliedScholarship === 'object'
                            ? (appliedScholarship._id || appliedScholarship.id)
                            : appliedScholarship
                          return String(appliedId || app.scholarshipId || '') === scholarshipId
                        })
                        return (
                          <button
                            type="button"
                            disabled={alreadyApplied || applicationsLoading}
                            onClick={() => {
                              setApplicationScholarship(item)
                              setApplicationNotice('')
                              setApplicationsError('')
                              setApplicationForm({
                                course: studentProfile?.scholarship?.course || '',
                                yearLevel: studentProfile?.scholarship?.yearLevel || '',
                                gradeAverage: '',
                                statement: ''
                              })
                            }}
                            className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold ${
                              alreadyApplied
                                ? 'cursor-not-allowed border border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60'
                            }`}
                          >
                            {alreadyApplied ? 'Applied' : applicationsLoading ? 'Checking applications...' : 'Apply now'}
                          </button>
                        )
                      })()}
                      {applicationScholarship && (applicationScholarship._id || applicationScholarship.id) === (item._id || item.id) && (
                        <form onSubmit={handleSubmitApplication} className="mt-4 space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                          <h4 className="font-bold text-slate-900">Apply for {item.title}</h4>
                          <Field label="Course" required><input className="form-input" required value={applicationForm.course} onChange={e => setApplicationForm(prev => ({ ...prev, course: e.target.value }))} placeholder="e.g. BSIT" /></Field>
                          <Field label="Year level" required><select className="form-input" required value={applicationForm.yearLevel} onChange={e => setApplicationForm(prev => ({ ...prev, yearLevel: e.target.value }))}><option value="">Select year level</option>{years.map(year => <option key={year} value={year}>{year}</option>)}</select></Field>
                          <Field label="Grade average (0–100)" required><input className="form-input" type="number" min="0" max="100" step="0.01" required value={applicationForm.gradeAverage} onChange={e => setApplicationForm(prev => ({ ...prev, gradeAverage: e.target.value }))} placeholder="e.g. 88.5" /></Field>
                          <Field label="Why are you applying?" required><textarea className="form-input min-h-28" required maxLength={2000} value={applicationForm.statement} onChange={e => setApplicationForm(prev => ({ ...prev, statement: e.target.value }))} placeholder="Briefly explain your goals and why you should be considered." /></Field>
                          
                          {/* Required document uploads */}
                          <div className="space-y-4">
                            <h5 className="font-semibold text-slate-900">Required documents</h5>
                            <p className="text-sm text-slate-600">
                              Upload each document required for this scholarship. PDF, JPG, JPEG, or PNG only; maximum 5 MB per file.
                            </p>

                            {(item.requiredDocuments || []).map((documentName, index) => (
                              <Field key={documentName} label={documentName} required>
                                <input
                                  className="form-input"
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                  required
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] || null;

                                    setApplicationForm((prev) => {
                                      const documents = [...(prev.documents || [])];
                                      documents[index] = { documentName, file };
                                      return { ...prev, documents };
                                    });
                                  }}
                                />
                              </Field>
                            ))}
                          </div>

                          {applicationsError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{applicationsError}</div>}
                          <div className="flex flex-wrap gap-2"><button disabled={applicationSaving} type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{applicationSaving ? 'Submitting...' : 'Submit application'}</button><button type="button" onClick={() => setApplicationScholarship(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button></div>
                        </form>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : studentPage === 'applications' ? (
            <section className="mt-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold text-slate-900">My applications</h2><p className="mt-1 text-sm text-slate-500">Track the scholarships you have applied for.</p></div><button onClick={loadMyApplications} disabled={applicationsLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"><RefreshCw size={15} className={applicationsLoading ? 'animate-spin' : ''} /> Refresh</button></div>
              {applicationNotice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{applicationNotice}</div>}
              {applicationsError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{applicationsError}</div>}
              {applicationsLoading ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm"><LoaderCircle size={25} className="mx-auto animate-spin text-blue-600" /><p className="mt-3 text-sm">Loading your applications...</p></div> : myApplications.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"><BookOpen size={32} className="mx-auto text-slate-300" /><h3 className="mt-3 font-bold text-slate-800">No applications yet</h3><p className="mt-1 text-sm text-slate-500">Browse scholarships and select Apply now to submit your first application.</p><button onClick={() => setStudentPage('browse')} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Browse scholarships</button></div> : <div className="space-y-4">{myApplications.map(app => <article key={app._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">{app.scholarship?.title || 'Scholarship'}</h3><p className="mt-1 text-sm text-slate-500">{app.scholarship?.provider || 'Provider not available'} · Submitted {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'date unavailable'}</p></div><span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${statusClass(app.status || 'Pending')}`}>{app.status || 'Pending'}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</p><p className="mt-1 font-medium">{app.course}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Grade average</p><p className="mt-1 font-medium">{app.gradeAverage}</p></div></div>{app.adminFeedback && <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-800"><strong>Admin feedback:</strong> {app.adminFeedback}</p>}</article>)}</div>}
            </section>
          ) : (
            <>
              {profileLoading && <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-6 text-slate-600 shadow-sm"><LoaderCircle size={20} className="animate-spin text-blue-600" /> Loading your scholarship details...</div>}
              {profileError && <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p className="font-semibold">Unable to load scholarship details</p><p className="mt-1">{profileError}</p></div>}
              {!profileLoading && !profileError && (scholarship ? (
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="text-sm font-medium text-slate-500">Your scholarship record</p><h2 className="mt-1 text-xl font-bold text-slate-900">{scholarship.fullName}</h2></div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${statusClass(scholarship.scholarshipStatus || 'Pending')}`}>{scholarship.scholarshipStatus || 'Pending'}</span>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[
                      ['Student ID', scholarship.studentId],
                      ['Email address', scholarship.email],
                      ['Course', scholarship.course],
                      ['Year level', scholarship.yearLevel],
                      ['Scholarship type', scholarship.scholarshipType],
                    ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 font-semibold text-slate-900">{value || 'Not provided'}</p></div>)}
                  </div>
                </section>
              ) : (
                <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                  <h2 className="font-bold">No scholarship record linked yet</h2>
                  <p className="mt-2 text-sm leading-6">Your account is active, but we couldn't find a scholarship record with the same email address. Ask the administrator to add or update your student record so its email matches your login email ({studentProfile?.user?.email || auth.user.email}).</p>
                </section>
              ))}
            </>
          )}

          <footer className="py-6 text-center text-xs text-slate-400">ScholarTrack · Student Scholarship System</footer>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-950 px-5 py-6 text-white transition-transform lg:translate-x-0 ${mobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-900/40">
            <GraduationCap size={25} />
          </div>
          <div>
            <p className="font-bold tracking-tight">Scholar<span className="text-blue-400">Track</span></p>
            <p className="mt-0.5 text-xs text-slate-400">Scholarship management</p>
          </div>
          <button onClick={() => setMobileMenu(false)} className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-800 lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
        <div className="space-y-2">
          <button onClick={() => { setAdminPage('students'); setMobileMenu(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${adminPage === 'students' ? 'bg-blue-600 shadow-lg shadow-blue-950/30' : 'text-slate-300 hover:bg-slate-800'}`}>
            <BookOpen size={18} /> Student records
          </button>
          <button onClick={() => { setAdminPage('scholarships'); setMobileMenu(false); loadScholarships(); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${adminPage === 'scholarships' ? 'bg-blue-600 shadow-lg shadow-blue-950/30' : 'text-slate-300 hover:bg-slate-800'}`}>
            <Award size={18} /> Manage scholarships
          </button>

          <button
            onClick={() => {
              setAdminPage('applications')
              setMobileMenu(false)
              loadAdminApplications()
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            <BookOpen size={18} /> Manage applications
          </button>
        </div>

        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={16} className="text-blue-400" /> Project workspace
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">Keep student scholarship information organized in one place.</p>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> API connection checked on load
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <button aria-label="Close sidebar overlay" className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={() => setMobileMenu(false)} />
      )}

      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-7 lg:px-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenu(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
                <Menu size={21} />
              </button>
              <div>
                <p className="text-xs font-medium text-slate-400">WORKSPACE / {adminPage === 'students' ? 'STUDENTS' : adminPage === 'applications' ? 'APPLICATIONS' : 'SCHOLARSHIPS'}</p>
                <h1 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">{adminPage === 'students' ? 'Student records' : adminPage === 'applications' ? 'Manage applications' : 'Manage scholarships'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={adminPage === 'students' ? loadStudents : adminPage === 'applications' ? loadAdminApplications : loadScholarships} disabled={adminPage === 'students' ? loading : adminPage === 'applications' ? adminApplicationsLoading : scholarshipsLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                <RefreshCw size={16} className={(adminPage === 'students' ? loading : adminPage === 'applications' ? adminApplicationsLoading : scholarshipsLoading) ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              {adminPage === 'students' ? (
                <button onClick={openAddModal} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 sm:px-4"><Plus size={17} /> Add student</button>
              ) : (
                <button onClick={openAddScholarship} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 sm:px-4"><Plus size={17} /> Add scholarship</button>
              )}
              <button onClick={handleLogout} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Log out</button>
            </div>
          </div>
        </header>

        {adminPage === 'students' ? (
        <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Student administration
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Manage scholarships</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">View student records and keep track of scholarship applications and their current status.</p>
            </div>
            <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:self-auto">
              <Download size={16} /> Export CSV
            </button>
          </div>

          {error && (
            <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-1 leading-5">{error}</p>
              </div>
              <button onClick={() => setError('')} aria-label="Dismiss error"><X size={17} /></button>
            </div>
          )}

          {notice && (
            <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800">
              <CheckCircle2 size={18} /> {notice}
              <button className="ml-auto" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button>
            </div>
          )}

          <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total students" value={counts.total} note="All records in the database" icon={Users} tint="bg-blue-50 text-blue-700" />
            <StatCard label="Approved" value={counts.approved} note="Scholarships approved" icon={CheckCircle2} tint="bg-emerald-50 text-emerald-700" />
            <StatCard label="Pending review" value={counts.pending} note="Awaiting a decision" icon={Clock3} tint="bg-amber-50 text-amber-700" />
            <StatCard label="Rejected" value={counts.rejected} note="Applications not approved" icon={XCircle} tint="bg-rose-50 text-rose-700" />
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h3 className="font-bold text-slate-900">All students</h3>
                <p className="mt-1 text-sm text-slate-500">{filtered.length} {filtered.length === 1 ? 'record' : 'records'} shown</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 sm:w-64">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
                </div>
                <div className="relative">
                  <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:w-44">
                    {['All statuses', ...statuses].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1020px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Course / Year</th>
                    <th className="px-4 py-3.5">Scholarship</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Student ID</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="6" className="px-6 py-16 text-center"><LoaderCircle className="mx-auto animate-spin text-blue-600" size={25} /><p className="mt-3 text-sm text-slate-500">Loading student records...</p></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Users size={22} /></div>
                        <p className="mt-3 font-semibold text-slate-700">{students.length === 0 ? 'No students yet' : 'No matching students'}</p>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{students.length === 0 ? 'Add your first student record to start building your scholarship list.' : 'Try a different search term or status filter.'}</p>
                        {students.length === 0 && <button onClick={openAddModal} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16} /> Add first student</button>}
                      </td>
                    </tr>
                  ) : filtered.map((s, i) => (
                    <tr key={s._id} className="transition hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700'][i % 4]}`}>
                            {(s.fullName || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{s.fullName || 'Unnamed student'}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{s.email || 'No email provided'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-700">{s.course || '—'}</p>
                        <p className="mt-1 text-xs text-slate-500">{s.yearLevel || 'Year not specified'}</p>
                      </td>
                      <td className="px-4 py-4"><span className="inline-flex max-w-52 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">{s.scholarshipType || 'Not specified'}</span></td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusClass(s.scholarshipStatus || 'Pending')}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />{s.scholarshipStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs font-medium text-slate-500">{s.studentId || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => handleEdit(s)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                            <Pencil size={13} /> Edit
                          </button>
                          <button type="button" disabled={deletingId === s._id} onClick={() => handleDelete(s)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                            {deletingId === s._id ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>Showing {filtered.length} of {students.length} student records</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected to Express API</span>
            </div>
          </section>

          <footer className="flex flex-col gap-2 py-7 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} ScholarTrack · Student Scholarship System</span>
            <span>React · Tailwind CSS · Express · MongoDB</span>
          </footer>
        </div>
        ) : adminPage === 'applications' ? (
          <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Student applications</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review applications submitted by students and record an approval or rejection decision.</p>
              </div>
              <button onClick={loadAdminApplications} disabled={adminApplicationsLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50">
                <RefreshCw size={16} className={adminApplicationsLoading ? 'animate-spin' : ''} /> Refresh applications
              </button>
            </div>

            {adminApplicationsError && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{adminApplicationsError}</div>}

            {adminApplicationsLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                <LoaderCircle className="mx-auto animate-spin text-blue-600" size={25} />
                <p className="mt-3 text-sm">Loading student applications...</p>
              </div>
            ) : adminApplications.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <BookOpen size={30} className="mx-auto text-slate-300" />
                <p className="mt-3 font-semibold text-slate-800">No applications found</p>
                <p className="mt-1 text-sm text-slate-500">Applications submitted by students will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {adminApplications.map((app) => (
                  <article key={app._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{app.scholarship?.title || 'Scholarship application'}</h3>
                        <p className="mt-1 text-sm text-slate-500">Applicant: {app.student?.fullName || app.student?.email || 'Student information unavailable'}</p>
                        <p className="mt-1 text-sm text-slate-500">{app.student?.email || ''}</p>
                      </div>
                      <span className={`inline-flex h-fit items-center rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${statusClass(app.status || 'Pending')}`}>{app.status || 'Pending'}</span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</p><p className="mt-1 font-medium text-slate-800">{app.course || 'Not provided'}</p></div>
                      <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Year level</p><p className="mt-1 font-medium text-slate-800">{app.yearLevel || 'Not provided'}</p></div>
                      <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Grade average</p><p className="mt-1 font-medium text-slate-800">{app.gradeAverage ?? 'Not provided'}</p></div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-100 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Applicant's statement</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{app.statement || 'No statement provided.'}</p>
                    </div>

                    
                      {Array.isArray(app.documents) && app.documents.length > 0 && (
                        <div className="mt-4 rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Submitted documents
                          </p>

                          <ul className="mt-3 space-y-3">
                            {app.documents.map((doc, index) => (
                              <li
                                key={doc._id || index}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {doc.documentName || 'Uploaded document'}
                                  </p>
                                  <p className="break-all text-xs text-slate-500">
                                    {doc.originalName || 'File uploaded'}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await openApplicationDocument(
                                        app._id,
                                        doc._id,
                                        auth?.token
                                      )
                                    } catch (error) {
                                      window.alert(
                                        error.message || 'Unable to open document.'
                                      )
                                    }
                                  }}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                  Open document
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}


                    {app.adminFeedback && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800"><strong>Admin feedback:</strong> {app.adminFeedback}</p>}

                    {(!app.status || app.status === 'Pending') && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" disabled={reviewingApplicationId === app._id} onClick={() => handleApplicationReview(app._id, 'Approved')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                          {reviewingApplicationId === app._id ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Approve
                        </button>
                        <button type="button" disabled={reviewingApplicationId === app._id} onClick={() => handleApplicationReview(app._id, 'Rejected')} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                          <XCircle size={15} /> Reject
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
            <footer className="py-7 text-xs text-slate-400">ScholarTrack · Student Scholarship System</footer>
          </div>
        ) : (
          <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><Award size={14} /> Scholarship opportunities</div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Manage Scholarships</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create opportunities for students to browse. Only published scholarships with deadlines today or in the future appear in the student-facing API.</p>
              </div>
              <button onClick={openAddScholarship} className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Plus size={16} /> Add scholarship</button>
            </div>

            {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={19} className="mt-0.5 shrink-0" /><p className="flex-1">{error}</p><button onClick={() => setError('')} aria-label="Dismiss error"><X size={17} /></button></div>}
            {notice && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800"><CheckCircle2 size={18} /> {notice}<button className="ml-auto" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard label="Total opportunities" value={scholarships.length} note="All scholarship records" icon={Award} tint="bg-blue-50 text-blue-700" />
              <StatCard label="Published" value={scholarships.filter(item => item.status === 'Published' && new Date(item.deadline) >= new Date(new Date().toDateString())).length} note="Visible to eligible students" icon={CheckCircle2} tint="bg-emerald-50 text-emerald-700" />
              <StatCard label="Draft / closed" value={scholarships.filter(item => item.status !== 'Published' || new Date(item.deadline) < new Date(new Date().toDateString())).length} note="Not currently available to apply" icon={Clock3} tint="bg-amber-50 text-amber-700" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
              <div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-bold text-slate-900">All scholarship opportunities</h3><p className="mt-1 text-sm text-slate-500">{scholarships.length} {scholarships.length === 1 ? 'scholarship' : 'scholarships'} in your database</p></div>
              {scholarshipsLoading ? <div className="p-12 text-center text-slate-500"><LoaderCircle className="mx-auto animate-spin text-blue-600" size={24} /><p className="mt-3 text-sm">Loading scholarships...</p></div> : scholarships.length === 0 ? <div className="p-12 text-center"><Award size={30} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No scholarships created yet</p><p className="mt-1 text-sm text-slate-500">Add your first opportunity to begin building the scholarship catalog.</p><button onClick={openAddScholarship} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={15} /> Add scholarship</button></div> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left"><thead><tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500"><th className="px-6 py-3.5">Scholarship</th><th className="px-4 py-3.5">Provider</th><th className="px-4 py-3.5">Deadline</th><th className="px-4 py-3.5">Status</th><th className="px-6 py-3.5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{scholarships.map(item => <tr key={item._id} className="hover:bg-slate-50/70"><td className="px-6 py-4"><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 max-w-md truncate text-xs text-slate-500">{item.description}</p></td><td className="px-4 py-4 text-sm text-slate-700">{item.provider}</td><td className="px-4 py-4 text-sm text-slate-700">{item.deadline ? new Date(item.deadline).toLocaleDateString() : '—'}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : item.status === 'Closed' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700'}`}>{item.status || 'Draft'}</span></td><td className="px-6 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEditScholarship(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"><Pencil size={13} /> Edit</button><button disabled={scholarshipDeletingId === item._id} onClick={() => handleDeleteScholarship(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{scholarshipDeletingId === item._id ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete</button></div></td></tr>)}</tbody></table></div>
              )}
              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-500 sm:px-6">Connected to the Express scholarship API</div>
            </section>
            <footer className="flex flex-col gap-2 py-7 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} ScholarTrack · Student Scholarship System</span><span>React · Tailwind CSS · Express · MongoDB</span></footer>
          </div>
        )}
      </main>

      {scholarshipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget && !scholarshipSaving) setScholarshipModalOpen(false) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="scholarship-modal-title" className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600"><Award size={14} /> Scholarship opportunity</div><h2 id="scholarship-modal-title" className="text-xl font-bold text-slate-900">{editingScholarship ? 'Edit scholarship' : 'Add scholarship'}</h2><p className="mt-1 text-sm text-slate-500">Published scholarships with future deadlines can be shown to students.</p></div><button onClick={() => { if (!scholarshipSaving) setScholarshipModalOpen(false) }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X size={20} /></button></div>
            <form onSubmit={handleSaveScholarship} className="max-h-[75vh] overflow-y-auto p-6"><div className="grid gap-4 sm:grid-cols-2">
              <Field label="Scholarship title" required><input required className="form-input" value={scholarshipForm.title} onChange={e => setScholarshipForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Academic Excellence Scholarship" /></Field>
              <Field label="Provider / sponsor" required><input required className="form-input" value={scholarshipForm.provider} onChange={e => setScholarshipForm(prev => ({ ...prev, provider: e.target.value }))} placeholder="e.g. University or foundation" /></Field>
              <div className="sm:col-span-2"><Field label="Description" required><textarea required rows={3} className="form-input" value={scholarshipForm.description} onChange={e => setScholarshipForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe this scholarship opportunity" /></Field></div>
              <Field label="Benefits" required><textarea required rows={3} className="form-input" value={scholarshipForm.benefits} onChange={e => setScholarshipForm(prev => ({ ...prev, benefits: e.target.value }))} placeholder="e.g. Tuition assistance" /></Field>
              <Field label="Eligibility requirements" required><textarea required rows={3} className="form-input" value={scholarshipForm.eligibility} onChange={e => setScholarshipForm(prev => ({ ...prev, eligibility: e.target.value }))} placeholder="Who can apply?" /></Field>
              <Field label="Application deadline" required><input required type="date" min={new Date().toISOString().slice(0, 10)} className="form-input" value={scholarshipForm.deadline} onChange={e => setScholarshipForm(prev => ({ ...prev, deadline: e.target.value }))} /></Field>
              <Field label="Status" required><select required className="form-input" value={scholarshipForm.status} onChange={e => setScholarshipForm(prev => ({ ...prev, status: e.target.value }))}><option value="Draft">Draft</option><option value="Published">Published</option><option value="Closed">Closed</option></select></Field>
              <div className="sm:col-span-2"><Field label="Required documents (separate each with a comma)"><textarea rows={2} className="form-input" value={scholarshipForm.requiredDocuments} onChange={e => setScholarshipForm(prev => ({ ...prev, requiredDocuments: e.target.value }))} placeholder="e.g. Certificate of enrollment, Transcript of records, Valid ID" /></Field></div>
            </div><div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" disabled={scholarshipSaving} onClick={() => setScholarshipModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button disabled={scholarshipSaving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{scholarshipSaving ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={17} />}{scholarshipSaving ? 'Saving...' : editingScholarship ? 'Save changes' : 'Create scholarship'}</button></div></form>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget && !saving) setModalOpen(false) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  {editingStudent ? <Pencil size={14} /> : <Plus size={14} />}
                  {editingStudent ? 'Edit record' : 'New record'}
                </div>
                <h2 id="modal-title" className="text-xl font-bold text-slate-900">{editingStudent ? 'Edit student' : 'Add a student'}</h2>
                <p className="mt-1 text-sm text-slate-500">Enter the student and scholarship details below.</p>
              </div>
              <button onClick={() => { if (!saving) setModalOpen(false) }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close dialog"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Student ID" required><input required value={form.studentId} onChange={e => updateForm('studentId', e.target.value)} placeholder="e.g. STU006" className="form-input" /></Field>
                <Field label="Full name" required><input required value={form.fullName} onChange={e => updateForm('fullName', e.target.value)} placeholder="Student's full name" className="form-input" /></Field>
                <Field label="Email address" required><input required type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="student@example.com" className="form-input" /></Field>
                <Field label="Course" required><select required value={form.course} onChange={e => updateForm('course', e.target.value)} className="form-input"><option value="">Select course</option>{courses.map(c => <option key={c}>{c}</option>)}</select></Field>
                <Field label="Year level" required><select required value={form.yearLevel} onChange={e => updateForm('yearLevel', e.target.value)} className="form-input"><option value="">Select year level</option>{years.map(y => <option key={y}>{y}</option>)}</select></Field>
                <Field label="Scholarship type" required><input required value={form.scholarshipType} onChange={e => updateForm('scholarshipType', e.target.value)} placeholder="e.g. Academic" className="form-input" /></Field>
                <div className="sm:col-span-2"><Field label="Application status" required><select required value={form.scholarshipStatus} onChange={e => updateForm('scholarshipStatus', e.target.value)} className="form-input">{statuses.map(s => <option key={s}>{s}</option>)}</select></Field></div>
              </div>

              {error && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button disabled={saving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? <LoaderCircle size={17} className="animate-spin" /> : editingStudent ? <Pencil size={17} /> : <Plus size={17} />}
                  {saving ? 'Saving...' : editingStudent ? 'Save changes' : 'Save student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
