import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  GraduationCap, Search, Plus, RefreshCw, Users, CheckCircle2,
  Clock3, XCircle, Download, ChevronDown, BookOpen, Menu, X,
  AlertCircle, ArrowUpRight, Filter, LoaderCircle, Sparkles
} from 'lucide-react'
import { createStudent, getStudents } from './api'

const initialForm = {
  studentId: '', fullName: '', email: '', course: '', yearLevel: '',
  scholarshipType: '', scholarshipStatus: 'Pending',
}
const statuses = ['Pending', 'Approved', 'Rejected']
const courses = ['BSIT', 'BSCS', 'BSBA', 'BSED', 'BEED', 'BSHM', 'BSCRIM', 'Other']
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']

function statusClass(status) {
  if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
  if (status === 'Rejected') return 'bg-rose-50 text-rose-700 ring-rose-600/15'
  return 'bg-amber-50 text-amber-700 ring-amber-600/15'
}
function normalizeStudent(s) {
  return { ...s, _id: s._id || s.id || `${s.studentId}-${s.email}` }
}
function StatCard({ label, value, note, icon: Icon, tint }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div>
      <div className={`rounded-xl p-3 ${tint}`}><Icon size={21}/></div>
    </div>
  </div>
}
function Field({ label, required, children }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="ml-1 text-rose-500">*</span>}</span>{children}</label>
}

export default function App() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getStudents()
      const rows = Array.isArray(result) ? result : (result.data || result.students || [])
      setStudents(rows.map(normalizeStudent))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadStudents() }, [loadStudents])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students.filter((s) => {
      const matchesSearch = !q || [s.studentId, s.fullName, s.email, s.course, s.scholarshipType, s.scholarshipStatus]
        .some(v => String(v || '').toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'All statuses' || (s.scholarshipStatus || 'Pending') === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [students, search, statusFilter])

  const counts = useMemo(() => ({
    total: students.length,
    approved: students.filter(s => s.scholarshipStatus === 'Approved').length,
    pending: students.filter(s => !s.scholarshipStatus || s.scholarshipStatus === 'Pending').length,
    rejected: students.filter(s => s.scholarshipStatus === 'Rejected').length,
  }), [students])

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  async function handleCreate(event) {
    event.preventDefault()
    setSaving(true); setError(''); setNotice('')
    try {
      await createStudent({
        studentId: form.studentId.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        course: form.course,
        yearLevel: form.yearLevel,
        scholarshipType: form.scholarshipType.trim(),
        scholarshipStatus: form.scholarshipStatus,
      })
      setForm(initialForm)
      setModalOpen(false)
      setNotice('Student record added successfully.')
      await loadStudents()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  function exportCsv() {
    const headers = ['Student ID', 'Full Name', 'Email', 'Course', 'Year Level', 'Scholarship Type', 'Status']
    const keys = ['studentId', 'fullName', 'email', 'course', 'yearLevel', 'scholarshipType', 'scholarshipStatus']
    const escape = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`
    const csv = [headers.map(escape).join(','), ...filtered.map(s => keys.map(k => escape(s[k])).join(','))].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = 'scholarship-students.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return <div className="min-h-screen text-slate-800">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-950 px-5 py-6 text-white transition-transform lg:translate-x-0 ${mobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-900/40"><GraduationCap size={25}/></div>
        <div><p className="font-bold tracking-tight">Scholar<span className="text-blue-400">Track</span></p><p className="mt-0.5 text-xs text-slate-400">Scholarship management</p></div>
        <button onClick={() => setMobileMenu(false)} className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-800 lg:hidden" aria-label="Close menu"><X size={20}/></button>
      </div>
      <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
      <button className="flex items-center gap-3 rounded-xl bg-blue-600 px-3 py-3 text-left text-sm font-semibold shadow-lg shadow-blue-950/30"><BookOpen size={18}/> Scholarship records</button>
      <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-blue-400"/> Project workspace</div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Keep student scholarship information organized in one place.</p>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400"/> API connection checked on load</div>
      </div>
    </aside>

    {mobileMenu && <button aria-label="Close sidebar overlay" className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={() => setMobileMenu(false)}/>}

    <main className="lg:pl-64">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenu(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu size={21}/></button>
            <div><p className="text-xs font-medium text-slate-400">WORKSPACE / STUDENTS</p><h1 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">Scholarship records</h1></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={loadStudents} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/><span className="hidden sm:inline">Refresh</span></button>
            <button onClick={() => { setError(''); setNotice(''); setModalOpen(true) }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 sm:px-4"><Plus size={17}/> Add student</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><span className="h-1.5 w-1.5 rounded-full bg-blue-600"/> Student administration</div><h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Manage scholarships</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">View student records and keep track of scholarship applications and their current status.</p></div>
          <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:self-auto"><Download size={16}/> Export CSV</button>
        </div>

        {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={19} className="mt-0.5 shrink-0"/><div className="flex-1"><p className="font-semibold">Something went wrong</p><p className="mt-1 leading-5">{error}</p></div><button onClick={() => setError('')} aria-label="Dismiss error"><X size={17}/></button></div>}
        {notice && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800"><CheckCircle2 size={18}/>{notice}<button className="ml-auto" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16}/></button></div>}

        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total students" value={counts.total} note="All records in the database" icon={Users} tint="bg-blue-50 text-blue-700"/>
          <StatCard label="Approved" value={counts.approved} note="Scholarships approved" icon={CheckCircle2} tint="bg-emerald-50 text-emerald-700"/>
          <StatCard label="Pending review" value={counts.pending} note="Awaiting a decision" icon={Clock3} tint="bg-amber-50 text-amber-700"/>
          <StatCard label="Rejected" value={counts.rejected} note="Applications not approved" icon={XCircle} tint="bg-rose-50 text-rose-700"/>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div><h3 className="font-bold text-slate-900">All students</h3><p className="mt-1 text-sm text-slate-500">{filtered.length} {filtered.length === 1 ? 'record' : 'records'} shown</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 sm:w-64"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"/></div>
              <div className="relative"><Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:w-44">{['All statuses', ...statuses].map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead><tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500"><th className="px-6 py-3.5">Student</th><th className="px-4 py-3.5">Course / Year</th><th className="px-4 py-3.5">Scholarship</th><th className="px-4 py-3.5">Status</th><th className="px-6 py-3.5 text-right">Student ID</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan="5" className="px-6 py-16 text-center"><LoaderCircle className="mx-auto animate-spin text-blue-600" size={25}/><p className="mt-3 text-sm text-slate-500">Loading student records...</p></td></tr>
                : filtered.length === 0 ? <tr><td colSpan="5" className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Users size={22}/></div><p className="mt-3 font-semibold text-slate-700">{students.length === 0 ? 'No students yet' : 'No matching students'}</p><p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{students.length === 0 ? 'Add your first student record to start building your scholarship list.' : 'Try a different search term or status filter.'}</p>{students.length === 0 && <button onClick={() => setModalOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16}/> Add first student</button>}</td></tr>
                : filtered.map((s, i) => <tr key={s._id} className="transition hover:bg-slate-50/80">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${['bg-blue-100 text-blue-700','bg-violet-100 text-violet-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700'][i % 4]}`}>{(s.fullName || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}</div><div><p className="font-semibold text-slate-800">{s.fullName || 'Unnamed student'}</p><p className="mt-0.5 text-xs text-slate-500">{s.email || 'No email provided'}</p></div></div></td>
                  <td className="px-4 py-4"><p className="text-sm font-semibold text-slate-700">{s.course || '—'}</p><p className="mt-1 text-xs text-slate-500">{s.yearLevel || 'Year not specified'}</p></td>
                  <td className="px-4 py-4"><span className="inline-flex max-w-52 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">{s.scholarshipType || 'Not specified'}</span></td>
                  <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusClass(s.scholarshipStatus || 'Pending')}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{s.scholarshipStatus || 'Pending'}</span></td>
                  <td className="px-6 py-4 text-right font-mono text-xs font-medium text-slate-500">{s.studentId || '—'}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6"><span>Showing {filtered.length} of {students.length} student records</span><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> Connected to Express API</span></div>
        </section>
        <footer className="flex flex-col gap-2 py-7 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} ScholarTrack · Student Scholarship System</span><span>React · Tailwind CSS · Express · MongoDB</span></footer>
      </div>
    </main>

    {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600"><Plus size={14}/> New record</div><h2 id="modal-title" className="text-xl font-bold text-slate-900">Add a student</h2><p className="mt-1 text-sm text-slate-500">Enter the student and scholarship details below.</p></div><button onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close dialog"><X size={20}/></button></div>
        <form onSubmit={handleCreate} className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Student ID" required><input required value={form.studentId} onChange={e => updateForm('studentId', e.target.value)} placeholder="e.g. STU006" className="form-input"/></Field>
            <Field label="Full name" required><input required value={form.fullName} onChange={e => updateForm('fullName', e.target.value)} placeholder="Student's full name" className="form-input"/></Field>
            <Field label="Email address" required><input required type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="student@example.com" className="form-input"/></Field>
            <Field label="Course" required><select required value={form.course} onChange={e => updateForm('course', e.target.value)} className="form-input"><option value="">Select course</option>{courses.map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Year level" required><select required value={form.yearLevel} onChange={e => updateForm('yearLevel', e.target.value)} className="form-input"><option value="">Select year level</option>{years.map(y => <option key={y}>{y}</option>)}</select></Field>
            <Field label="Scholarship type" required><input required value={form.scholarshipType} onChange={e => updateForm('scholarshipType', e.target.value)} placeholder="e.g. Academic" className="form-input"/></Field>
            <div className="sm:col-span-2"><Field label="Application status" required><select required value={form.scholarshipStatus} onChange={e => updateForm('scholarshipStatus', e.target.value)} className="form-input">{statuses.map(s => <option key={s}>{s}</option>)}</select></Field></div>
          </div>
          {error && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button disabled={saving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? <LoaderCircle size={17} className="animate-spin"/> : <Plus size={17}/>} {saving ? 'Saving...' : 'Save student'}</button></div>
        </form>
      </div>
    </div>}
  </div>
}