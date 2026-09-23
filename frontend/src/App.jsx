import { useState } from 'react'
import { Activity, ArrowUpRight, CalendarDays, ChevronDown, ChevronRight, CircleHelp, Download, FileText, HeartPulse, LayoutDashboard, LockKeyhole, LogOut, Menu, MoreHorizontal, Moon, Plus, Search, Settings, ShieldCheck, Sparkles, Stethoscope, Sun, Trash2, Upload, UsersRound, X } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { LoginPage, SignupPage } from './components/auth/AuthPages'
import './components/auth/Auth.css'
import './App.css'

const members = [
  { name: 'Father', relation: 'You', initials: 'RK', tone: 'coral', records: 12, predictions: 3, appointments: 2, consultations: 4, prescriptions: 2, dob: '12 Mar 1972', age: 54, gender: 'Male', bloodGroup: 'O+', phone: '+91 98765 43210', email: 'rohan.kapoor@example.com', address: 'Bengaluru, Karnataka', emergencyContact: 'Priya Kapoor · +91 98765 43211', conditions: 'Mild hypertension', allergies: 'No known allergies', treatments: 'Blood pressure monitoring' },
  { name: 'Mother', relation: 'Family member', initials: 'PM', tone: 'lilac', records: 8, predictions: 2, appointments: 1, consultations: 3, prescriptions: 2, dob: '24 Jul 1975', age: 51, gender: 'Female', bloodGroup: 'A+', phone: '+91 98765 43212', email: 'priya.kapoor@example.com', address: 'Bengaluru, Karnataka', emergencyContact: 'Rohan Kapoor · +91 98765 43210', conditions: 'Type 2 diabetes risk monitoring', allergies: 'Penicillin', treatments: 'Diet and glucose monitoring' },
  { name: 'Son', relation: 'Family member', initials: 'AS', tone: 'mint', records: 4, predictions: 1, appointments: 1, consultations: 2, prescriptions: 1, dob: '06 Nov 2010', age: 15, gender: 'Male', bloodGroup: 'B+', phone: '+91 98765 43213', email: 'arjun.kapoor@example.com', address: 'Bengaluru, Karnataka', emergencyContact: 'Rohan Kapoor · +91 98765 43210', conditions: 'Seasonal allergies', allergies: 'Dust', treatments: 'As-needed allergy relief' },
]

const navItems = [
  ['Dashboard', LayoutDashboard], ['Family members', UsersRound], ['Medical records', FileText], ['Upload record', Upload], ['AI predictions', Sparkles], ['Doctors', Stethoscope], ['Appointments', CalendarDays], ['Consultations', Activity], ['Prescriptions', HeartPulse], ['Doctor access', LockKeyhole],
]

const records = [
  { type: 'Blood test', category: 'Reports', patient: 'Father', date: '15 Sep 2026', source: 'Uploaded by Family', description: 'Routine blood panel for annual health review.', icon: Activity, color: 'orange', status: 'Available' },
  { type: 'X-Ray', category: 'X-Rays', patient: 'Father', date: '10 Sep 2026', source: 'Dr. Rahul · Orthopedics', description: 'Right knee follow-up imaging.', icon: FileText, color: 'blue', status: 'Available' },
  { type: 'Consultation', category: 'Consultations', patient: 'Mother', date: '08 Sep 2026', source: 'Dr. Kumar · Cardiology', description: 'Cardiology consultation and treatment plan.', icon: Stethoscope, color: 'green', status: 'Finalized' },
]

const presentationData = {
  Doctors: [
    { title: 'Dr. Rahul Mehta', detail: 'Orthopedics · MediMind Hospital', meta: 'Available today · 10:30 AM', tone: 'coral', initials: 'RM', action: 'Book appointment' },
    { title: 'Dr. Ananya Rao', detail: 'Cardiology · Heart & Wellness Center', meta: 'Next slot · Tomorrow, 2:00 PM', tone: 'lilac', initials: 'AR', action: 'View profile' },
    { title: 'Dr. Kavya Shah', detail: 'Diabetology · City Care Clinic', meta: 'Available Friday · 11:15 AM', tone: 'mint', initials: 'KS', action: 'View profile' },
  ],
  Appointments: [
    { title: 'Orthopedics follow-up', detail: 'Dr. Rahul Mehta · Father', meta: '18 Sep 2026 · 10:30 AM', tone: 'coral', initials: '18', action: 'View details' },
    { title: 'Annual health review', detail: 'Dr. Ananya Rao · Mother', meta: '22 Sep 2026 · 2:00 PM', tone: 'lilac', initials: '22', action: 'View details' },
    { title: 'Routine check-up', detail: 'Dr. Kumar Iyer · Son', meta: '28 Sep 2026 · 11:15 AM', tone: 'mint', initials: '28', action: 'View details' },
  ],
  Consultations: [
    { title: 'Orthopedics follow-up notes', detail: 'Dr. Rahul Mehta · Father', meta: 'Updated 15 Sep 2026 · Treatment plan ready', tone: 'coral', initials: 'RM', action: 'Open notes' },
    { title: 'Cardiology consultation', detail: 'Dr. Ananya Rao · Mother', meta: 'Updated 12 Sep 2026 · Review recommended', tone: 'lilac', initials: 'AR', action: 'Open notes' },
    { title: 'General medicine visit', detail: 'Dr. Kumar Iyer · Son', meta: 'Updated 08 Sep 2026 · No follow-up needed', tone: 'mint', initials: 'KI', action: 'Open notes' },
  ],
  Prescriptions: [
    { title: 'Vitamin D3 supplement', detail: 'For Father · Once daily after breakfast', meta: 'Active until 30 Nov 2026', tone: 'coral', initials: 'Rx', action: 'View instructions' },
    { title: 'Blood pressure monitoring', detail: 'For Mother · Follow prescribed dosage', meta: 'Active until 15 Oct 2026', tone: 'lilac', initials: 'Rx', action: 'View instructions' },
    { title: 'Seasonal allergy relief', detail: 'For Son · As needed', meta: 'Active until 01 Oct 2026', tone: 'mint', initials: 'Rx', action: 'View instructions' },
  ],
}

function App() {
  const { user, isAuthenticated, loading, logout } = useAuth()
  const [authMode, setAuthMode] = useState('login')
  const [page, setPage] = useState('Dashboard')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [memberIndex, setMemberIndex] = useState(0)
  const [dark, setDark] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [detailModal, setDetailModal] = useState(null)
  const [appointmentAssessment, setAppointmentAssessment] = useState(null)
  const [familyMembers, setFamilyMembers] = useState(members)
  const [bookedSlots, setBookedSlots] = useState({ 'Dr. Rahul Mehta|2026-09-18': ['10:30 AM'] })
  const [bookedAppointments, setBookedAppointments] = useState([])
  const [appointmentStatuses, setAppointmentStatuses] = useState({})
  const [doctorAccess, setDoctorAccess] = useState([{ member: 'Mother', doctor: 'Dr. Rahul Mehta', department: 'Orthopedics', granted: '16 Sep 2026' }])
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', relation: 'Family member', customRelation: '' })

  const member = familyMembers[memberIndex] ?? familyMembers[0]

  const announce = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const openFeatureModal = (item, feature) => setDetailModal({ item, feature })

  const navigate = (nextPage) => {
    setPage(nextPage)
    setProfileOpen(false)
  }

  const handleBookAppointment = (booking) => {
    const bookingKey = `${booking.doctor}|${booking.date}`
    const slotsForDay = bookedSlots[bookingKey] ?? []
    if (slotsForDay.includes(booking.slot)) {
      announce(`${booking.slot} is already booked with ${booking.doctor}. Please choose another slot.`)
      return false
    }

    setBookedSlots(current => ({ ...current, [bookingKey]: [...(current[bookingKey] ?? []), booking.slot] }))
    const formattedDate = new Date(`${booking.date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    setBookedAppointments(current => [...current, {
      title: booking.type,
      detail: `${booking.doctor} · ${booking.patient}`,
      meta: `${formattedDate} · ${booking.slot} · ${booking.mode}`,
      tone: 'mint',
      initials: formattedDate.slice(0, 2),
      action: 'View details',
    }])
    return true
  }

  const handleAddMember = (event) => {
    event.preventDefault()

    const name = newMember.name.trim()
    if (!name) {
      announce('Please enter a name to add a family member.')
      return
    }

    const relation = newMember.relation === 'Other' ? newMember.customRelation.trim() : newMember.relation
    if (!relation) {
      announce('Please enter a custom relation.')
      return
    }

    const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || 'MM'
    const tones = ['coral', 'lilac', 'mint']

    const nextMember = {
      name,
      relation,
      initials,
      tone: tones[(familyMembers.length) % tones.length],
      records: 0,
      predictions: 0,
      appointments: 0,
      consultations: 0,
      prescriptions: 0,
      sharedDoctors: 0,
      dob: 'Not provided',
      age: 'Not provided',
      gender: 'Not provided',
      bloodGroup: 'Not provided',
      phone: 'Not provided',
      email: 'Not provided',
      address: 'Not provided',
      emergencyContact: 'Not provided',
      conditions: 'No conditions recorded',
      allergies: 'No allergies recorded',
      treatments: 'No previous treatments recorded',
    }

    const updatedMembers = [...familyMembers, nextMember]
    setFamilyMembers(updatedMembers)
    setMemberIndex(updatedMembers.length - 1)
    setShowAddMember(false)
    setNewMember({ name: '', relation: 'Family member', customRelation: '' })
    announce(`${name} was added to your family account.`)
  }

  const handleDeleteMember = (index) => {
    if (familyMembers.length === 1) {
      announce('At least one family member must remain in the account.')
      return
    }

    const deletedMember = familyMembers[index]
    if (!window.confirm(`Delete ${deletedMember.name} from this family account?`)) return

    const updatedMembers = familyMembers.filter((_, memberIndexToRemove) => memberIndexToRemove !== index)
    setFamilyMembers(updatedMembers)
    setMemberIndex(currentIndex => index < currentIndex ? currentIndex - 1 : Math.min(currentIndex, updatedMembers.length - 1))
    announce(`${deletedMember.name} was removed from your family account.`)
  }

  const grantDoctorAccess = (entry) => {
    if (doctorAccess.some(item => item.member === entry.member && item.doctor === entry.doctor)) {
      announce('This doctor already has access to this patient.')
      return
    }
    setDoctorAccess(current => [...current, { ...entry, granted: '17 Sep 2026' }])
    announce(`Access granted to ${entry.doctor} for ${entry.member}.`)
  }

  const revokeDoctorAccess = (entry) => {
    if (!window.confirm(`Are you sure you want to revoke ${entry.doctor}'s access to ${entry.member}'s medical records?`)) return
    setDoctorAccess(current => current.filter(item => !(item.member === entry.member && item.doctor === entry.doctor)))
    announce('Doctor access revoked.')
  }

  const appointmentKey = item => `${item.title}|${item.detail}`
  const cancelAppointment = item => {
    if (!window.confirm(`Cancel the appointment for ${item.detail}?`)) return
    setAppointmentStatuses(current => ({ ...current, [appointmentKey(item)]: 'Cancelled' }))
    announce('Appointment cancelled. Doctor Access remains unchanged.')
  }

  const rescheduleAppointment = item => {
    announce(`Choose a new slot to reschedule ${item.title}.`)
    navigate('Appointment AI assessment')
  }

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-spinner" />
        <p>Restoring your session...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <LoginPage onSwitchToSignup={() => setAuthMode('signup')} />
    ) : (
      <SignupPage onSwitchToLogin={() => setAuthMode('login')} />
    )
  }

  return <div className={`app-shell ${dark ? 'dark-theme' : ''}`}>
    <style>{`.upload-form{width:min(100%,720px);margin:0 auto}.upload-form .primary-button{width:100%;justify-content:center}.feature-panel:has(.upload-form){padding:32px 40px}.drop-zone{min-height:150px}.feature-panel:has(.upload-form) label{width:100%}.feature-view{display:flex;flex-direction:column;gap:20px}.feature-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.feature-heading>div{flex:1}.feature-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;background:var(--soft);color:var(--teal)}.compact-button{margin-left:auto;white-space:nowrap}.add-member-form{margin-top:14px;padding:20px;border:1px solid var(--line);border-radius:18px;background:var(--card);box-shadow:0 10px 24px rgba(25,39,52,.04)}.form-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.form-header h3{margin:0;font-size:1.1rem}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.add-member-form label{display:flex;flex-direction:column;gap:8px;color:#5d646d;font-size:12px;font-weight:600}.add-member-form input,.add-member-form select{border:1px solid var(--line);border-radius:10px;background:var(--bg);padding:11px 12px;font:inherit;color:var(--ink)}.form-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:18px}.secondary-button{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--ink);font-weight:600}.close-form{display:grid;place-items:center;width:32px;height:32px;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--ink)}.delete-member-button{display:grid;place-items:center;width:32px;height:32px;margin-left:0;border:1px solid #efcaca;border-radius:9px;background:transparent;color:#c45b5b}.delete-member-button:hover{background:#fff0f0;color:#a93f3f;transform:translateY(-1px)}.feature-card{flex-wrap:nowrap}.feature-card .text-button{margin-left:auto;align-self:center}.feature-card .delete-member-button{align-self:center}.feature-actions{display:flex;align-items:center;gap:16px;margin-left:auto;white-space:nowrap}.recent-records-panel .section-heading h2{font-size:18px}.recent-records-panel .section-heading p{font-size:12px}.recent-records-panel .record-copy strong{font-size:13px}.recent-records-panel .record-copy span,.recent-records-panel .status-text{font-size:11px}@media(max-width:720px){.feature-heading{flex-direction:column}.compact-button{width:100%}.form-grid{grid-template-columns:1fr}.upload-form{width:100%}.feature-panel:has(.upload-form){padding:20px 16px}.feature-card{flex-wrap:wrap}.feature-card .text-button{margin-left:auto}.feature-actions{width:100%;justify-content:flex-end;flex-wrap:wrap}}`}</style>
    <style>{`@keyframes medimind-enter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes medimind-card{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.page-transition{animation:medimind-enter .32s cubic-bezier(.22,1,.36,1)}.page-transition .member-card,.page-transition .dashboard-grid>*,.page-transition .lower-grid>*,.page-transition .feature-card,.page-transition .ai-module,.page-transition .feature-records .record-row{animation:medimind-card .36s cubic-bezier(.22,1,.36,1) both}.page-transition .member-card:nth-child(2),.page-transition .feature-card:nth-child(2),.page-transition .ai-module:nth-child(2),.page-transition .feature-records .record-row:nth-child(2){animation-delay:.05s}.page-transition .member-card:nth-child(3),.page-transition .feature-card:nth-child(3),.page-transition .ai-module:nth-child(3),.page-transition .feature-records .record-row:nth-child(3){animation-delay:.1s}.primary-button,.text-button,.plain-button,.upload-button,.icon-button,.nav-item,.member-card,.ai-module,.record-row,.filter{transition:transform .2s ease,background-color .2s ease,border-color .2s ease,box-shadow .2s ease,color .2s ease}.primary-button:hover,.upload-button:hover{transform:translateY(-2px);box-shadow:0 8px 18px #156f7030}.primary-button:active,.upload-button:active,.text-button:active,.plain-button:active,.icon-button:active{transform:scale(.97)}.member-card:hover,.feature-card:hover,.ai-module:hover{transform:translateY(-3px);box-shadow:0 10px 22px #20352b12}.nav-item:hover{transform:translateX(3px)}.record-row:hover{background:#f3f8f6;padding-left:8px;padding-right:8px}.dark-theme .record-row:hover{background:#2a3942}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}`}</style>

    <style>{`.booking-form{max-width:900px;margin:0 auto;padding:28px 32px;border:1px solid var(--line);border-radius:14px;background:var(--card)}.booking-form-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:24px}.booking-form-header h2{margin:0 0 5px;font:700 18px 'Plus Jakarta Sans'}.booking-form-header p{margin:0;color:#9aa3ad;font-size:12px}.booking-status{display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border-radius:8px;background:var(--soft);color:var(--teal);font-size:11px;font-weight:700;white-space:nowrap}.booking-form .form-grid{gap:18px}.booking-form label{display:flex;flex-direction:column;gap:8px;color:#5d646d;font-size:12px;font-weight:600}.booking-form input,.booking-form select,.booking-form textarea{width:100%;border:1px solid var(--line);border-radius:10px;background:var(--bg);padding:12px;color:var(--ink);font:inherit}.booking-form textarea{min-height:110px;resize:vertical}.booking-form select option:disabled{color:#9da6ae}.field-hint{font-size:10px;font-weight:400;color:#8b989f}.booking-reason{margin-top:18px}.booking-summary{display:flex;align-items:center;gap:8px;margin-top:20px;padding:12px 14px;border-radius:9px;background:var(--soft);color:#557b73;font-size:11px}.booking-summary svg{flex:0 0 auto}.booking-form .form-actions{margin-top:24px}.booking-form button:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}.assessment-result{margin-bottom:22px;padding:14px 16px;border:1px solid var(--soft-line);border-radius:10px;background:var(--soft);color:#557b73}.assessment-result.high{border-color:#efcaca;background:#fff3f1;color:#a34e45}.assessment-result>div{display:flex;align-items:center;gap:7px;font-size:12px}.assessment-result p{margin:8px 0 0;font-size:12px;line-height:1.5}.assessment-result small{display:block;margin-top:7px;font-size:10px}.assessment-upload{margin-top:18px;align-items:center;justify-content:center;text-align:center;border:1px dashed var(--soft-line);border-radius:10px;padding:20px;background:var(--soft)}.assessment-upload input{margin-top:8px}.modal-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(22,35,42,.38);backdrop-filter:blur(3px)}.detail-modal{width:min(100%,520px);padding:26px;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:0 24px 70px rgba(22,35,42,.24)}.modal-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.modal-header h2{margin:4px 0 0;font:700 20px 'Plus Jakarta Sans'}.modal-icon{display:grid;place-items:center;width:44px;height:44px;margin:22px 0 14px;border-radius:12px;background:var(--soft);color:var(--teal)}.detail-modal h3{margin:0 0 7px;font:700 16px 'Plus Jakarta Sans'}.modal-detail{margin:0;color:var(--muted);font-size:13px;line-height:1.5}.modal-meta{display:flex;align-items:center;gap:7px;margin-top:16px;padding:11px 12px;border-radius:9px;background:var(--bg);color:var(--ink);font-size:12px}.modal-section{margin-top:18px;padding-top:17px;border-top:1px solid var(--line)}.modal-section strong{font-size:12px}.modal-section p{margin:7px 0 0;color:var(--muted);font-size:12px;line-height:1.5}.modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}@media(max-width:720px){.booking-form{padding:20px 16px}.booking-form-header{flex-direction:column}.booking-status{align-self:flex-start}.booking-form .form-grid{grid-template-columns:1fr}.detail-modal{padding:20px}.modal-actions{flex-wrap:wrap}.modal-actions button{flex:1}}`}</style>

    <style>{`.compact-feature-icon{width:36px;height:36px;border-radius:10px}.settings-panel{display:flex;flex-direction:column;gap:0}.settings-section{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:22px 0;border-bottom:1px solid var(--line)}.settings-section:first-child{padding-top:0}.settings-section:last-child{border-bottom:0;padding-bottom:0}.settings-section h2{margin:0 0 5px;font:700 15px 'Plus Jakarta Sans'}.settings-section p{margin:0;color:var(--muted);font-size:12px}.settings-section button{white-space:nowrap}.profile-details-panel{display:flex;flex-direction:column;gap:24px}.profile-detail-section{padding-bottom:22px;border-bottom:1px solid var(--line)}.profile-detail-section:last-child{padding-bottom:0;border-bottom:0}.profile-detail-section h2{margin:0 0 16px;font:700 16px 'Plus Jakarta Sans'}.profile-detail-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.profile-detail-grid span{display:flex;flex-direction:column;gap:5px;color:var(--ink);font-size:12px;line-height:1.4}.profile-detail-grid b{color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.7px}.doctor-access-panel{display:flex;flex-direction:column;gap:26px}.access-form{display:grid;grid-template-columns:1fr 1fr auto auto;align-items:end;gap:16px;padding-bottom:22px;border-bottom:1px solid var(--line)}.access-form label{display:flex;flex-direction:column;gap:8px;color:#5d646d;font-size:12px;font-weight:600}.access-form select{border:1px solid var(--line);border-radius:10px;background:var(--bg);padding:11px;color:var(--ink);font:inherit}.share-everything{display:flex;align-items:center;gap:9px;padding:10px 12px;border-radius:9px;background:var(--soft);color:var(--teal);font-size:11px}.share-everything div{display:flex;flex-direction:column;gap:2px}.share-everything span{color:#668b83;font-size:10px}.doctor-access-panel .feature-list{width:100%}@media(max-width:900px){.profile-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.access-form{grid-template-columns:1fr 1fr}.access-form .primary-button{grid-column:2}}@media(max-width:720px){.settings-section{align-items:flex-start;flex-direction:column}.settings-section button{width:100%}.profile-detail-grid{grid-template-columns:1fr}.access-form{grid-template-columns:1fr}.access-form .primary-button{grid-column:auto;width:100%}}`}</style>

    <style>{`.sidebar{position:fixed;inset:0 auto 0 0;height:100vh;overflow-y:auto;z-index:10}.main-content{margin-left:250px;min-height:100vh}@media(max-width:1050px) and (min-width:721px){.sidebar{width:218px}.main-content{margin-left:218px}}@media(max-width:720px){.sidebar{display:none}.main-content{margin-left:0}}`}</style>
    <style>{`.booking-access-notice{display:flex;align-items:flex-start;gap:8px;margin-bottom:18px;padding:11px 13px;border:1px solid var(--soft-line);border-radius:9px;background:var(--soft);color:#557b73;font-size:11px;line-height:1.45}.booking-access-notice svg{flex:0 0 auto;margin-top:1px}`}</style>
    <style>{`.danger-action{color:#b45b5b}.feature-actions button:disabled{opacity:.5;cursor:not-allowed}`}</style>

    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><HeartPulse size={21} /></div>
        <span>Medi<span>Mind</span></span>
      </div>

      <button className="account-switcher" onClick={() => setProfileOpen(!profileOpen)}>
        <div className="avatar avatar-coral">{user?.email ? user.email.slice(0, 2).toUpperCase() : 'RK'}</div>
        <div className="account-copy">
          <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{user?.email ? user.email.split('@')[0] : 'Rohan Kapoor'}</strong>
          <span>Family account</span>
        </div>
        <ChevronDown size={16} />
      </button>

      <p className="nav-label">Workspace</p>
      <nav>
        {navItems.map(([label, Icon]) => (
          <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => navigate(label)}>
            <Icon size={18} />
            <span>{label}</span>
            {label === 'Doctor access' && <span className="nav-dot" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className={`nav-item ${page === 'Help center' ? 'active' : ''}`} onClick={() => navigate('Help center')}>
          <CircleHelp size={18} />
          <span>Help center</span>
        </button>

        <button className={`nav-item ${page === 'Settings' ? 'active' : ''}`} onClick={() => navigate('Settings')}>
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <button className="nav-item" style={{ color: '#b45b5b' }} onClick={() => logout()} title="Sign out of MediMind">
          <LogOut size={18} />
          <span>Sign out</span>
        </button>

        <div className="privacy-note">
          <ShieldCheck size={17} />
          <span>Your health data is private<br />and secure.</span>
        </div>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <button className="mobile-menu" aria-label="Open menu"><Menu size={20} /></button>

        <div className="breadcrumbs">
          <span>Family account</span>
          <ChevronRight size={15} />
          <strong>{page}</strong>
        </div>

        <div className="top-actions">
          <div className="search-box">
            <Search size={17} />
            <input placeholder="Search your records" aria-label="Search your records" />
          </div>

          <button className="icon-button theme-button" onClick={() => setDark(!dark)} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} title="View profile options">
            <div className="avatar avatar-coral small">{user?.email ? user.email.slice(0, 2).toUpperCase() : 'RK'}</div>
            <ChevronDown size={16} />
          </button>
        </div>
      </header>

      <div className="page-content">
        <div className="page-transition" key={page}>
          {page === 'Dashboard' ? (
            <Dashboard member={member} memberIndex={memberIndex} setMemberIndex={setMemberIndex} navigate={navigate} announce={announce} familyMembers={familyMembers} />
          ) : (
            page === 'Member profile' ? <MemberProfilePage member={member} navigate={navigate} announce={announce} /> : page === 'Doctor profile' ? <DoctorProfilePage doctor={selectedDoctor} navigate={navigate} announce={announce} /> : page === 'Appointment AI assessment' ? <AppointmentAssessmentPage member={member} doctor={selectedDoctor} setAssessment={setAppointmentAssessment} navigate={navigate} announce={announce} /> : page === 'Book appointment' ? <BookAppointmentPage member={member} assessment={appointmentAssessment} bookedSlots={bookedSlots} onBookAppointment={handleBookAppointment} navigate={navigate} announce={announce} /> : page === 'General health risk' ? <GeneralHealthRiskPage member={member} navigate={navigate} announce={announce} /> : page === 'Doctor access' ? <DoctorAccessPage members={familyMembers} accessEntries={doctorAccess} onGrant={grantDoctorAccess} onRevoke={revokeDoctorAccess} /> : page === 'Help center' ? <HelpCenterPage announce={announce} /> : page === 'Settings' ? <SettingsPage dark={dark} setDark={setDark} announce={announce} /> : <FeaturePage page={page} member={member} announce={announce} navigate={navigate} openFeatureModal={openFeatureModal} bookedAppointments={bookedAppointments} appointmentStatuses={appointmentStatuses} onCancelAppointment={cancelAppointment} onRescheduleAppointment={rescheduleAppointment} setSelectedDoctor={setSelectedDoctor} familyMembers={familyMembers} setMemberIndex={setMemberIndex} showAddMember={showAddMember} setShowAddMember={setShowAddMember} newMember={newMember} setNewMember={setNewMember} handleAddMember={handleAddMember} handleDeleteMember={handleDeleteMember} />
          )}
        </div>
      </div>
    </main>

    {profileOpen && (
      <div className="profile-popover">
        <div className="popover-header">
          <strong>Switch profile</strong>
          <button onClick={() => setProfileOpen(false)} aria-label="Close profile switcher"><X size={16} /></button>
        </div>
        {familyMembers.map((item, index) => (
          <button className="popover-member" key={`${item.name}-${index}`} onClick={() => { setMemberIndex(index); setProfileOpen(false) }}>
            <div className={`avatar avatar-${item.tone} small`}>{item.initials}</div>
            <span>{item.name}</span>
            {memberIndex === index && <span className="check">✓</span>}
          </button>
        ))}
        <div className="popover-auth-section" style={{ borderTop: '1px solid var(--line)', marginTop: '12px', paddingTop: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px', wordBreak: 'break-all' }}>
            Signed in as <strong>{user?.email}</strong>
          </div>
          <button
            className="secondary-button"
            style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px 12px', color: '#b45b5b', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => {
              setProfileOpen(false)
              logout()
            }}
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    )}

    {detailModal && <FeatureDetailModal detail={detailModal} onClose={() => setDetailModal(null)} announce={announce} />}
    {toast && <div className="toast" role="status"><ShieldCheck size={16} /> {toast}</div>}
  </div>
}

function Dashboard({ member, memberIndex, setMemberIndex, navigate, announce, familyMembers }) {
  return <>
    <section className="welcome-row">
      <div>
        <p className="eyebrow">Tuesday, 16 September 2026</p>
        <h1>Welcome back, Rohan <span>✦</span></h1>
        <p className="subheading">Here’s a clear view of your family’s health, all in one place.</p>
      </div>
    </section>

    <section className="member-strip">
      <div className="section-heading">
        <div>
          <h2>Family members</h2>
          <p>Switch profiles to see their health overview</p>
        </div>
        <button className="text-button" onClick={() => navigate('Family members')}>View all <ArrowUpRight size={15} /></button>
      </div>

      <div className="member-cards">
        {familyMembers.map((item, index) => (
          <button className={`member-card ${memberIndex === index ? 'selected' : ''}`} key={`${item.name}-${index}`} onClick={() => setMemberIndex(index)}>
            <div className={`avatar avatar-${item.tone}`}>{item.initials}</div>
            <div className="member-info">
              <strong>{item.name}</strong>
              <span>{item.relation}</span>
            </div>
            {memberIndex === index && <span className="selected-check">✓</span>}
            <MoreHorizontal size={18} className="member-more" />
          </button>
        ))}
      </div>
    </section>

    <section className="dashboard-grid">
      <div className="appointment-card">
        <div className="card-topline">
          <div>
            <p className="card-kicker">NEXT APPOINTMENT</p>
            <h3>Orthopedics follow-up</h3>
          </div>
          <span className="date-badge">18 <small>SEP</small></span>
        </div>

        <div className="doctor-line">
          <div className="doctor-avatar">DR</div>
          <div>
            <strong>Dr. Rahul Mehta</strong>
            <span>Orthopedic specialist · 10:30 AM</span>
          </div>
          <ChevronRight size={18} />
        </div>

        <div className="appointment-footer">
          <span><CalendarDays size={15} /> MediMind Hospital</span>
          <button className="plain-button" onClick={() => navigate('Appointments')}>View appointment <ArrowUpRight size={14} /></button>
        </div>
      </div>

      <div className="insight-card">
        <div className="insight-icon"><Sparkles size={18} /></div>
        <div>
          <p className="card-kicker">LATEST AI INSIGHT</p>
          <h3>Heart health looks stable</h3>
          <p className="insight-copy">Based on your latest health assessment from 10 Sep.</p>
          <button className="text-button" onClick={() => navigate('AI predictions')}>View prediction <ArrowUpRight size={15} /></button>
        </div>
        <div className="insight-ring"><span>86</span><small>score</small></div>
      </div>
    </section>

    <section className="lower-grid">
      <div className="records-panel">
        <div className="section-heading">
          <div>
            <h2>{member.name}’s recent records</h2>
            <p>Your latest health activity</p>
          </div>
          <button className="text-button" onClick={() => navigate('Medical records')}>View all <ArrowUpRight size={15} /></button>
        </div>
        <div className="record-list">{records.map(record => <RecordRow record={record} key={record.type} announce={announce} />)}</div>
        <button className="upload-button" onClick={() => navigate('Upload record')}><Upload size={17} /> Upload a medical record</button>
      </div>

      <div className="activity-panel">
        <div className="section-heading">
          <div>
            <h2>At a glance</h2>
            <p>Across your family account</p>
          </div>
          <button className="icon-button" onClick={() => announce('Family account summary refreshed.')} aria-label="Refresh family account summary"><MoreHorizontal size={18} /></button>
        </div>

        <div className="stat-grid">
          <div className="stat"><span className="stat-icon coral-bg"><FileText size={17} /></span><strong>24</strong><span>Medical records</span></div>
          <div className="stat"><span className="stat-icon lilac-bg"><Sparkles size={17} /></span><strong>6</strong><span>AI predictions</span></div>
          <div className="stat"><span className="stat-icon mint-bg"><CalendarDays size={17} /></span><strong>3</strong><span>Appointments</span></div>
          <div className="stat"><span className="stat-icon yellow-bg"><LockKeyhole size={17} /></span><strong>2</strong><span>Shared doctors</span></div>
        </div>

        <div className="secure-banner"><ShieldCheck size={17} /><span>All family profiles are protected with secure access.</span></div>
      </div>
    </section>

    <p className="disclaimer"><ShieldCheck size={14} /> MediMind supports better health decisions. It does not replace professional medical advice.</p>
  </>
}

function RecordRow({ record, announce, onOpen }) {
  const Icon = record.icon
  return <button className="record-row" onClick={() => onOpen ? onOpen(record) : announce(`Opening ${record.type.toLowerCase()} record...`)}>
    <div className={`record-icon ${record.color}`}><Icon size={18} /></div>
    <div className="record-copy">
      <strong>{record.type}</strong>
      <span>{record.date} · {record.source}</span>
    </div>
    <span className="status-text">{record.status}</span>
    <ChevronRight size={17} />
  </button>
}

function MemberProfilePage({ member, navigate, announce }) {
  return <section className="feature-view">
    <div className="feature-heading">
      <span className={`avatar avatar-${member.tone}`}>{member.initials}</span>
      <div>
        <p className="eyebrow">Family account</p>
        <h1>{member.name}'s profile</h1>
        <p>{member.relation} · Personal health overview and activity.</p>
      </div>
      <button className="secondary-button compact-button" onClick={() => navigate('Family members')}>
        <ArrowUpRight size={16} /> Back to family members
      </button>
    </div>

    <div className="dashboard-grid profile-summary-grid">
      <div className="insight-card">
        <div className="insight-icon"><HeartPulse size={18} /></div>
        <div>
          <p className="card-kicker">HEALTH OVERVIEW</p>
          <h3>Health profile is ready</h3>
          <p className="insight-copy">Review records, appointments, and AI-supported health updates for {member.name}.</p>
          <button className="text-button" onClick={() => navigate('Medical records')}>View records <ArrowUpRight size={15} /></button>
        </div>
        <div className="insight-ring"><span>78</span><small>score</small></div>
      </div>

      <div className="activity-panel">
        <div className="section-heading">
          <div>
            <h2>At a glance</h2>
            <p>{member.name}'s account activity</p>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat"><span className="stat-icon coral-bg"><FileText size={17} /></span><strong>{member.records}</strong><span>Medical records</span></div>
          <div className="stat"><span className="stat-icon lilac-bg"><Sparkles size={17} /></span><strong>{member.predictions}</strong><span>AI predictions</span></div>
        </div>
        <div className="secure-banner"><ShieldCheck size={17} /><span>This profile is protected with secure access.</span></div>
      </div>
    </div>

    <div className="records-panel recent-records-panel">
      <div className="section-heading">
        <div>
          <h2>Recent records</h2>
          <p>Latest health activity for {member.name}</p>
        </div>
        <button className="text-button" onClick={() => navigate('Medical records')}>View all <ArrowUpRight size={15} /></button>
      </div>
      <div className="record-list">{records.map(record => <RecordRow record={record} announce={announce} key={record.type} />)}</div>
    </div>

    <div className="feature-panel profile-details-panel">
      <div className="profile-detail-section"><h2>Personal information</h2><div className="profile-detail-grid">
        <span><b>Date of birth</b>{member.dob}</span><span><b>Age</b>{member.age} years</span><span><b>Gender</b>{member.gender}</span><span><b>Blood group</b>{member.bloodGroup}</span><span><b>Phone</b>{member.phone}</span><span><b>Email</b>{member.email}</span><span><b>Address</b>{member.address}</span><span><b>Emergency contact</b>{member.emergencyContact}</span>
      </div></div>
      <div className="profile-detail-section"><h2>Health information</h2><div className="profile-detail-grid"><span><b>Medical conditions</b>{member.conditions}</span><span><b>Allergies</b>{member.allergies}</span><span><b>Previous treatments</b>{member.treatments}</span><span><b>Other health information</b>Family health profile under active review</span></div></div>
      <div className="profile-detail-section"><h2>Activity</h2><div className="profile-detail-grid"><span><b>Appointments</b>{member.appointments}</span><span><b>Consultations</b>{member.consultations}</span><span><b>Prescriptions</b>{member.prescriptions}</span><span><b>Shared doctors</b>1 authorized doctor</span></div></div>
    </div>
  </section>
}

function DoctorAccessPage({ members, accessEntries, onGrant, onRevoke }) {
  const doctors = [
    { name: 'Dr. Rahul Mehta', department: 'Orthopedics' },
    { name: 'Dr. Ananya Rao', department: 'Cardiology' },
    { name: 'Dr. Kavya Shah', department: 'Diabetology' },
  ]
  const [selectedMember, setSelectedMember] = useState(members[0]?.name ?? '')
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0].name)
  const doctor = doctors.find(item => item.name === selectedDoctor) ?? doctors[0]

  return <section className="feature-view">
    <div className="feature-heading"><span className="feature-icon"><LockKeyhole size={20} /></span><div><p className="eyebrow">Family account</p><h1>Doctor Access</h1><p>Share one patient's complete authorized history with a specific doctor.</p></div></div>
    <div className="feature-panel doctor-access-panel">
      <div className="access-form"><label><span>Family member</span><select value={selectedMember} onChange={event => setSelectedMember(event.target.value)}>{members.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label><span>Doctor</span><select value={selectedDoctor} onChange={event => setSelectedDoctor(event.target.value)}>{doctors.map(item => <option key={item.name}>{item.name}</option>)}</select></label><div className="share-everything"><ShieldCheck size={17} /><div><strong>Share Everything</strong><span>Complete authorized medical history for this patient</span></div></div><button className="primary-button" onClick={() => onGrant({ member: selectedMember, doctor: doctor.name, department: doctor.department })}>Grant access</button></div>
      <div className="feature-list">{accessEntries.length === 0 ? <div className="empty-feature"><div className="empty-art"><LockKeyhole size={24} /></div><h2>No active access</h2><p>Grant a patient-specific doctor authorization to get started.</p></div> : accessEntries.map(entry => <article className="feature-card" key={`${entry.member}-${entry.doctor}`}><div className="avatar avatar-lilac">DR</div><div><h3>{entry.doctor}</h3><p>{entry.department} · Patient: {entry.member}</p><span className="feature-meta">Share Everything · Granted {entry.granted}</span></div><button className="delete-member-button" onClick={() => onRevoke(entry)} aria-label={`Revoke ${entry.doctor} access`}><Trash2 size={16} /></button></article>)}</div>
    </div>
  </section>
}

function FeaturePage({ page, member, announce, navigate, openFeatureModal, bookedAppointments, appointmentStatuses, onCancelAppointment, onRescheduleAppointment, setSelectedDoctor, familyMembers, setMemberIndex, showAddMember, setShowAddMember, newMember, setNewMember, handleAddMember, handleDeleteMember }) {
  const title = page === 'Medical records' ? 'Unified medical records' : page
  const [recordFilter, setRecordFilter] = useState('All')

  const subtitles = {
    'Family members': 'Manage patient profiles in your family account.',
    'Medical records': 'A complete, scannable history of reports, tests, prescriptions, and consultations.',
    'Upload record': `Add a family-owned document for ${member.name}.`,
    'AI predictions': `Decision-support tools for ${member.name}.`,
    Doctors: 'Browse trusted healthcare professionals by department.',
    Appointments: 'Book and manage care for a specific family member.',
    Consultations: 'Review doctor notes, treatment plans, and linked records.',
    Prescriptions: 'View finalized prescriptions and instructions.',
  }

  return <section className="feature-view">
    <div className="feature-heading">
      <span className="feature-icon"><FileText size={20} /></span>
      <div>
        <p className="eyebrow">Family account</p>
        <h1>{title}</h1>
        <p>{subtitles[page]}</p>
      </div>

      {page === 'Family members' && (
        <button className="primary-button compact-button" onClick={() => setShowAddMember(true)}>
          <Plus size={16} /> Add member
        </button>
      )}

      {page === 'Appointments' && (
        <button className="primary-button compact-button" onClick={() => navigate('Appointment AI assessment')}>
          <CalendarDays size={16} /> Book appointment
        </button>
      )}
    </div>

    <div className="feature-panel">
      {page === 'Family members' && (
        <>
          <div className="feature-list">
            {familyMembers.map((item, index) => (
              <article className="feature-card" key={`${item.name}-${index}`}>
                <div className={`avatar avatar-${item.tone}`}>{item.initials}</div>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.relation} · {item.records} records · {item.predictions} predictions</p>
                </div>
                <button className="text-button" onClick={() => { setMemberIndex(index); navigate('Member profile'); announce(`Opening ${item.name}'s profile.`) }}>
                  View profile <ArrowUpRight size={14} />
                </button>
                <button
                  type="button"
                  className="delete-member-button"
                  onClick={() => handleDeleteMember(index)}
                  aria-label={`Delete ${item.name}`}
                  title={`Delete ${item.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>

          {showAddMember && (
            <form className="add-member-form" onSubmit={handleAddMember}>
              <div className="form-header">
                <h3>Add family member</h3>
                <button type="button" className="close-form" onClick={() => setShowAddMember(false)} aria-label="Close add-member form">
                  <X size={16} />
                </button>
              </div>

              <div className="form-grid">
                <label>
                  <span>Name</span>
                  <input
                    value={newMember.name}
                    onChange={(event) => setNewMember(current => ({ ...current, name: event.target.value }))}
                    placeholder="Enter member name"
                  />
                </label>

                <label>
                  <span>Relation</span>
                  <select value={newMember.relation} onChange={(event) => setNewMember(current => ({ ...current, relation: event.target.value }))}>
                    <option>Family member</option>
                    <option>You</option>
                    <option>Spouse</option>
                    <option>Child</option>
                    <option>Parent</option>
                    <option>Other</option>
                  </select>
                  {newMember.relation === 'Other' && (
                    <input
                      value={newMember.customRelation}
                      onChange={(event) => setNewMember(current => ({ ...current, customRelation: event.target.value }))}
                      placeholder="Enter custom relation"
                      aria-label="Custom relation"
                      required
                    />
                  )}
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowAddMember(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save member</button>
              </div>
            </form>
          )}
        </>
      )}

      {page === 'Medical records' && (
        <>
          <div className="filter-row">
            {['All', 'Reports', 'Tests', 'X-Rays', 'Prescriptions', 'Consultations', 'AI Reports'].map(filter => <button key={filter} className={`filter ${recordFilter === filter ? 'active' : ''}`} onClick={() => setRecordFilter(filter)}>{filter}</button>)}
          </div>

          <div className="feature-records">
            {records.filter(record => recordFilter === 'All' || record.category === recordFilter).map(record => <RecordRow record={record} announce={announce} onOpen={item => openFeatureModal(item, 'Medical record')} key={record.type} />)}
          </div>
        </>
      )}

      {page === 'Upload record' && <UploadForm announce={announce} />}
      {page === 'AI predictions' && <AIModules announce={announce} navigate={navigate} />}
      {presentationData[page] && <PresentationFeature page={page} announce={announce} navigate={navigate} openFeatureModal={openFeatureModal} bookedAppointments={bookedAppointments} appointmentStatuses={appointmentStatuses} onCancelAppointment={onCancelAppointment} onRescheduleAppointment={onRescheduleAppointment} setSelectedDoctor={setSelectedDoctor} />}
    </div>
  </section>
}

function UploadForm({ announce }) {
  return <div className="upload-form">
    <label>Patient profile
      <select className="feature-input"><option>Father</option><option>Mother</option><option>Son</option></select>
    </label>

    <label>Record type
      <select className="feature-input"><option>Report</option><option>Test result</option><option>X-Ray or scan</option><option>Prescription</option></select>
    </label>

    <label className="drop-zone">
      <Upload size={25} />
      <strong>Choose a PDF, image, X-ray, or scan</strong>
      <span>Drag and drop files here</span>
      <input type="file" accept=".pdf,image/*" />
    </label>

    <label>Description
      <textarea className="feature-input" placeholder="Add context for this medical record" />
    </label>

    <button className="primary-button" onClick={() => announce('Medical record upload is ready to save.')}>Save record</button>
  </div>
}

function AIModules({ announce, navigate }) {
  return <>
    <div className="ai-modules">
      <button className="ai-module" onClick={() => announce('Fracture detection upload flow opened.')}>
        <span className="ai-icon coral-bg"><Activity size={18} /></span>
        <h3>Fracture detection</h3>
        <p>Upload an X-Ray, review confidence, and view explanation.</p>
        <ArrowUpRight size={16} />
      </button>

      <button className="ai-module" onClick={() => announce('Diabetes risk parameters opened.')}>
        <span className="ai-icon lilac-bg"><Activity size={18} /></span>
        <h3>Diabetes risk</h3>
        <p>Enter health parameters and review risk score.</p>
        <ArrowUpRight size={16} />
      </button>

      <button className="ai-module" onClick={() => announce('Heart disease risk parameters opened.')}>
        <span className="ai-icon mint-bg"><HeartPulse size={18} /></span>
        <h3>Heart disease risk</h3>
        <p>Enter health parameters and review risk score.</p>
        <ArrowUpRight size={16} />
      </button>

      <button className="ai-module" onClick={() => navigate('General health risk')}>
        <span className="ai-icon yellow-bg"><ShieldCheck size={18} /></span>
        <h3>General health risk</h3>
        <p>Combine family history, lifestyle, symptoms, and recent records into one overall risk estimate.</p>
        <ArrowUpRight size={16} />
      </button>
    </div>

    <div className="ai-warning">
      <ShieldCheck size={17} /> AI-assisted results support clinical decisions and are not a medical diagnosis.
    </div>
  </>
}

function PresentationFeature({ page, announce, navigate, openFeatureModal, bookedAppointments = [], appointmentStatuses = {}, onCancelAppointment, onRescheduleAppointment, setSelectedDoctor }) {
  const featureItems = page === 'Appointments' ? [...presentationData[page], ...bookedAppointments] : presentationData[page]

  return <div className="feature-list">
    {featureItems.map(item => (
      <article className="feature-card" key={`${page}-${item.title}`}>
        <div className={`avatar avatar-${item.tone}`}>{item.initials}</div>
        <div>
          <h3>{item.title}</h3>
          <p>{item.detail}</p>
          <span className="feature-meta">{item.meta}</span>
        </div>
        {page === 'Doctors' ? <div className="feature-actions">
          <button className="text-button" onClick={() => navigate('Appointment AI assessment')}>
            Book appointment <CalendarDays size={14} />
          </button>
          <button className="text-button" onClick={() => { setSelectedDoctor(item); navigate('Doctor profile') }}>
            View profile <ArrowUpRight size={14} />
          </button>
        </div> : page === 'Appointments' ? <div className="feature-actions">
          <button className="text-button" onClick={() => openFeatureModal(item, page)}>View details <ArrowUpRight size={14} /></button>
          <button className="text-button" disabled={appointmentStatuses[`${item.title}|${item.detail}`] === 'Cancelled'} onClick={() => onRescheduleAppointment(item)}>Reschedule</button>
          <button className="text-button danger-action" disabled={appointmentStatuses[`${item.title}|${item.detail}`] === 'Cancelled'} onClick={() => onCancelAppointment(item)}>{appointmentStatuses[`${item.title}|${item.detail}`] === 'Cancelled' ? 'Cancelled' : 'Cancel'}</button>
        </div> : <button className="text-button" onClick={() => ['Consultations', 'Prescriptions'].includes(page) ? openFeatureModal(item, page) : announce(`${item.action}: ${item.title}.`)}>
          {item.action} <ArrowUpRight size={14} />
        </button>}
      </article>
    ))}
  </div>
}

function DoctorProfilePage({ doctor, navigate, announce }) {
  if (!doctor) {
    navigate('Doctors')
    return null
  }

  return <section className="feature-view">
    <div className="feature-heading">
      <span className={`avatar avatar-${doctor.tone}`}>{doctor.initials}</span>
      <div>
        <p className="eyebrow">Doctor profile</p>
        <h1>{doctor.title}</h1>
        <p>{doctor.detail}</p>
      </div>
      <button className="secondary-button compact-button" onClick={() => navigate('Doctors')}>
        <ArrowUpRight size={16} /> Back to doctors
      </button>
    </div>

    <div className="dashboard-grid profile-summary-grid">
      <div className="insight-card">
        <div className="insight-icon"><Stethoscope size={18} /></div>
        <div>
          <p className="card-kicker">SPECIALIST OVERVIEW</p>
          <h3>{doctor.detail.split(' · ')[0]}</h3>
          <p className="insight-copy">Trusted care for your family account with appointment availability this week.</p>
          <button className="primary-button" onClick={() => navigate('Appointment AI assessment')}><CalendarDays size={16} /> Book appointment</button>
        </div>
      </div>

      <div className="activity-panel">
        <div className="section-heading">
          <div>
            <h2>Availability</h2>
            <p>Current appointment information</p>
          </div>
        </div>
        <div className="secure-banner"><CalendarDays size={17} /><span>{doctor.meta}</span></div>
        <button className="text-button" onClick={() => announce('Doctor profile details are ready for your presentation.')}>View clinic details <ArrowUpRight size={14} /></button>
      </div>
    </div>
  </section>
}

function AppointmentAssessmentPage({ member, doctor, setAssessment, navigate, announce }) {
  const [symptoms, setSymptoms] = useState('')
  const [fileName, setFileName] = useState('')

  const analyzeSymptoms = (event) => {
    event.preventDefault()
    if (!symptoms.trim() && !fileName) {
      announce('Add symptoms or upload a report before running the AI assessment.')
      return
    }

    const criticalTerms = /chest pain|difficulty breathing|shortness of breath|severe bleeding|unconscious|stroke|severe pain|high fever/i
    const highPriority = criticalTerms.test(symptoms) || /critical|urgent|abnormal/i.test(fileName)
    const assessment = {
      severity: highPriority ? 'High priority' : 'Routine priority',
      summary: highPriority
        ? 'The reported symptoms may need prompt clinical review. We recommend choosing the earliest available appointment slot.'
        : 'The reported information appears suitable for a routine consultation. You can choose any available appointment slot.',
      reason: symptoms.trim() || `Review uploaded file: ${fileName}`,
      fileName,
      doctor: doctor?.title ?? 'Dr. Rahul Mehta',
      urgency: highPriority ? 'high' : 'routine',
    }
    setAssessment(assessment)
    announce(`${assessment.severity} assessment complete.`)
    navigate('Book appointment')
  }

  return <section className="feature-view">
    <div className="feature-heading">
      <span className="feature-icon"><Sparkles size={20} /></span>
      <div>
        <p className="eyebrow">AI-assisted intake</p>
        <h1>Check symptoms before booking</h1>
        <p>Share symptoms or a report so MediMind can recommend appointment urgency.</p>
      </div>
      <button className="secondary-button compact-button" onClick={() => navigate('Appointments')}><ArrowUpRight size={16} /> Back to appointments</button>
    </div>

    <form className="booking-form" onSubmit={analyzeSymptoms}>
      <div className="booking-form-header">
        <div><h2>AI symptom assessment</h2><p>This is decision support, not a medical diagnosis.</p></div>
        <span className="booking-status"><ShieldCheck size={15} /> Private and secure</span>
      </div>

      <label className="booking-reason">
        <span>What symptoms or concerns does {member.name} have?</span>
        <textarea value={symptoms} onChange={(event) => setSymptoms(event.target.value)} placeholder="For example: chest discomfort for two days, or routine follow-up after a blood test" />
      </label>

      <label className="drop-zone assessment-upload">
        <Upload size={24} />
        <strong>{fileName || 'Upload a report or prescription'}</strong>
        <span>PDF or image files are supported</span>
        <input type="file" accept=".pdf,image/*" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} />
      </label>

      <div className="booking-summary"><Sparkles size={17} /><span>The AI summary will be added to Appointment details and used to recommend the earliest slot when needed.</span></div>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={() => navigate('Appointments')}>Cancel</button><button type="submit" className="primary-button"><Sparkles size={16} /> Analyze and continue</button></div>
    </form>
  </section>
}

function GeneralHealthRiskPage({ member, navigate, announce }) {
  const [input, setInput] = useState({ symptoms: '', lifestyle: '', familyHistory: '' })
  const [result, setResult] = useState(null)

  const runAssessment = (event) => {
    event.preventDefault()
    if (!input.symptoms.trim() && !input.lifestyle.trim() && !input.familyHistory.trim()) {
      announce('Enter at least one health detail before running the assessment.')
      return
    }
    const highPriority = /103|high fever|chest pain|difficulty breathing|severe|faint/i.test(`${input.symptoms} ${input.lifestyle} ${input.familyHistory}`)
    setResult({
      priority: highPriority ? 'High priority' : 'Routine priority',
      summary: highPriority ? 'Potential risk detected. Clinical review is recommended at the earliest available opportunity.' : 'No urgent pattern was identified in this mock assessment. Continue routine monitoring and discuss concerns with a doctor.',
      factors: [input.symptoms && 'Symptoms and health concerns', input.lifestyle && 'Lifestyle information', input.familyHistory && 'Family history', 'Recent medical records'].filter(Boolean),
    })
    announce('AI assessment completed.')
  }

  return <section className="feature-view">
    <div className="feature-heading"><span className="feature-icon"><ShieldCheck size={20} /></span><div><p className="eyebrow">AI Decision Support</p><h1>General health risk</h1><p>Review a mock overall risk estimate for {member.name} using free-text health information.</p></div><button className="secondary-button compact-button" onClick={() => navigate('AI predictions')}><ArrowUpRight size={16} /> Back to predictions</button></div>
    <form className="booking-form" onSubmit={runAssessment}>
      <div className="booking-form-header"><div><h2>Health information</h2><p>Decision support only. This is not a medical diagnosis.</p></div><span className="booking-status"><Sparkles size={15} /> Mock assessment</span></div>
      <label className="booking-reason"><span>Symptoms or general health concerns</span><textarea value={input.symptoms} onChange={event => setInput(current => ({ ...current, symptoms: event.target.value }))} placeholder="Example: I have fever and body pain." /></label>
      <div className="form-grid"><label><span>Lifestyle information</span><textarea value={input.lifestyle} onChange={event => setInput(current => ({ ...current, lifestyle: event.target.value }))} placeholder="Sleep, exercise, diet, tobacco, or alcohol" /></label><label><span>Family history</span><textarea value={input.familyHistory} onChange={event => setInput(current => ({ ...current, familyHistory: event.target.value }))} placeholder="Relevant family health history" /></label></div>
      <div className="booking-summary"><ShieldCheck size={17} /><span>Recent medical records are considered as a mock assessment factor.</span></div>
      {result && <div className={`assessment-result ${result.priority === 'High priority' ? 'high' : 'routine'}`}><div><Sparkles size={17} /><strong>{result.priority}</strong></div><p>{result.summary}</p><small>Factors considered: {result.factors.join(', ')}.</small></div>}
      <div className="form-actions"><button type="button" className="secondary-button" onClick={() => navigate('AI predictions')}>Cancel</button><button type="submit" className="primary-button"><Sparkles size={16} /> Run assessment</button></div>
    </form>
  </section>
}

function BookAppointmentPage({ member, assessment, bookedSlots, onBookAppointment, navigate, announce }) {
  const slotOptions = ['10:30 AM', '11:15 AM', '2:00 PM', '4:30 PM']

  const [booking, setBooking] = useState({
    patient: member.name,
    doctor: assessment?.doctor ?? 'Dr. Rahul Mehta',
    date: assessment?.urgency === 'high' ? '2026-09-17' : '2026-09-18',
    slot: assessment?.urgency === 'high' ? '10:30 AM' : '11:15 AM',
    reason: assessment?.reason ?? '',
    type: 'Follow-up consultation',
    mode: 'In-person',
  })

  const getBookedSlots = (doctor, date) => bookedSlots[`${doctor}|${date}`] ?? []
  const getAvailableSlots = (doctor, date) => slotOptions.filter(slot => !getBookedSlots(doctor, date).includes(slot))

  const updateBooking = (field, value) => setBooking(current => ({ ...current, [field]: value }))

  const updateSchedule = (field, value) => {
    const nextDoctor = field === 'doctor' ? value : booking.doctor
    const nextDate = field === 'date' ? value : booking.date
    const availableSlots = getAvailableSlots(nextDoctor, nextDate)
    setBooking(current => ({ ...current, [field]: value, slot: availableSlots.includes(current.slot) ? current.slot : (availableSlots[0] ?? '') }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!booking.reason.trim()) {
      announce('Please add a reason for the appointment.')
      return
    }

    if (!booking.slot) {
      announce('There are no available slots for this doctor on the selected date.')
      return
    }

    if (!onBookAppointment(booking)) return

    announce(`Appointment booked with ${booking.doctor} for ${booking.patient} on ${booking.date} at ${booking.slot}.`)
    navigate('Appointments')
  }

  return <section className="feature-view">
    <div className="feature-heading">
      <span className="feature-icon"><CalendarDays size={20} /></span>
      <div>
        <p className="eyebrow">Appointments</p>
        <h1>Book a new appointment</h1>
        <p>Choose a patient, care provider, available slot, and visit details.</p>
      </div>
      <button className="secondary-button compact-button" onClick={() => navigate('Appointments')}>
        <ArrowUpRight size={16} /> Back to appointments
      </button>
    </div>

    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="booking-form-header">
        <div>
          <h2>Appointment details</h2>
          <p>All fields help the care team prepare for the visit.</p>
        </div>
        <span className="booking-status"><CalendarDays size={15} /> Slots available</span>
      </div>

      {assessment && <div className={`assessment-result ${assessment.urgency}`}>
        <div><Sparkles size={17} /><strong>AI summary · {assessment.severity}</strong></div>
        <p>{assessment.summary}</p>
        {assessment.fileName && <small>Attached report: {assessment.fileName}</small>}
      </div>}

      <div className="booking-access-notice"><LockKeyhole size={16} /><span>Booking confirms only the appointment. It does not grant this doctor access to medical records. Use Doctor Access separately to share records.</span></div>

      <div className="form-grid">
        <label>
          <span>Patient profile</span>
          <select value={booking.patient} onChange={(event) => updateBooking('patient', event.target.value)}>
            <option>Father</option>
            <option>Mother</option>
            <option>Son</option>
            <option>{member.name}</option>
          </select>
        </label>

        <label>
          <span>Assigned doctor</span>
          <select value={booking.doctor} onChange={(event) => updateSchedule('doctor', event.target.value)}>
            <option value="Dr. Rahul Mehta">Dr. Rahul Mehta · Orthopedics</option>
            <option value="Dr. Ananya Rao">Dr. Ananya Rao · Cardiology</option>
            <option value="Dr. Kumar Iyer">Dr. Kumar Iyer · General medicine</option>
          </select>
        </label>

        <label>
          <span>Appointment date</span>
          <input type="date" value={booking.date} min="2026-09-17" onChange={(event) => updateSchedule('date', event.target.value)} />
        </label>

        <label>
          <span>Available time slot</span>
          <select value={booking.slot} onChange={(event) => updateBooking('slot', event.target.value)}>
            {slotOptions.map(slot => <option key={slot} value={slot} disabled={getBookedSlots(booking.doctor, booking.date).includes(slot)}>{slot}{getBookedSlots(booking.doctor, booking.date).includes(slot) ? ' (Booked)' : ''}</option>)}
          </select>
          <small className="field-hint">Booked slots are disabled automatically for this doctor and date.</small>
        </label>

        <label>
          <span>Appointment type</span>
          <select value={booking.type} onChange={(event) => updateBooking('type', event.target.value)}>
            <option>Follow-up consultation</option>
            <option>First consultation</option>
            <option>Routine check-up</option>
            <option>Diagnostic review</option>
          </select>
        </label>

        <label>
          <span>Consultation mode</span>
          <select value={booking.mode} onChange={(event) => updateBooking('mode', event.target.value)}>
            <option>In-person</option>
            <option>Video consultation</option>
            <option>Phone consultation</option>
          </select>
        </label>
      </div>

      <label className="booking-reason">
          <span>Why does the patient need this appointment?</span>
        <textarea value={booking.reason} onChange={(event) => updateBooking('reason', event.target.value)} placeholder="Describe symptoms, follow-up needs, or what you want to discuss" required />
      </label>

      <div className="booking-summary">
        <ShieldCheck size={17} />
        <span>{booking.slot ? `Selected slot: ${booking.date} at ${booking.slot} with ${booking.doctor} · ${booking.mode}` : 'No slots are available for this doctor on the selected date.'}</span>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={() => navigate('Appointments')}>Cancel</button>
        <button type="submit" className="primary-button" disabled={!booking.slot}><CalendarDays size={16} /> Confirm appointment</button>
      </div>
    </form>
  </section>
}

function FeatureDetailModal({ detail, onClose, announce }) {
  const { item, feature } = detail
  const titles = {
    'Medical record': 'Medical record details',
    Appointments: 'Appointment details',
    Consultations: 'Consultation notes',
    Prescriptions: 'Prescription instructions',
  }

  const downloadPrescription = () => {
    const content = `MediMind prescription\n\n${item.title}\n${item.detail}\n${item.meta}\n\nInstructions: Follow the care plan provided by your doctor. Contact the clinic if symptoms change.`
    const file = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-prescription.txt`
    link.click()
    URL.revokeObjectURL(url)
    announce('Prescription downloaded.')
  }

  return <div className="modal-backdrop" role="presentation" onClick={onClose}>
    <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-modal-title" onClick={(event) => event.stopPropagation()}>
      <div className="modal-header">
        <div>
          <p className="eyebrow">{feature}</p>
          <h2 id="detail-modal-title">{titles[feature]}</h2>
        </div>
        <button className="close-form" onClick={onClose} aria-label="Close details"><X size={17} /></button>
      </div>

      <div className="modal-icon"><FileText size={20} /></div>
      <h3>{item.title}</h3>
      <p className="modal-detail">{item.detail}</p>
      <div className="modal-meta"><CalendarDays size={15} /> {item.meta ?? `${item.date} · ${item.source}`}</div>

      {feature === 'Medical record' && <div className="modal-section"><strong>Patient: {item.patient}</strong><p>{item.description ?? 'Mock medical record available for review.'}</p></div>}
      {feature === 'Appointments' && <div className="modal-section"><strong>What to bring</strong><p>Bring recent reports, current prescriptions, and any questions for the care team.</p></div>}
      {feature === 'Consultations' && <div className="modal-section"><strong>Doctor notes</strong><p>The consultation has been reviewed and the treatment plan is available for this family profile.</p></div>}
      {feature === 'Prescriptions' && <div className="modal-section"><strong>Instructions</strong><p>Follow the prescribed schedule and contact the clinic if you experience any unexpected symptoms.</p></div>}

      <div className="modal-actions">
        {feature === 'Prescriptions' && <button className="primary-button" onClick={downloadPrescription}><Download size={16} /> Download prescription</button>}
        <button className="secondary-button" onClick={onClose}>Close</button>
      </div>
    </section>
  </div>
}

function HelpCenterPage({ announce }) {
  const helpItems = [
    ['How do I add a family member?', 'Open Family members, choose Add member, and enter their profile details.'],
    ['How are records protected?', 'MediMind keeps family health information private with account-level secure access.'],
    ['How do I book an appointment?', 'Choose Appointments or a doctor, select an available slot, and confirm the visit details.'],
  ]

  return <section className="feature-view">
    <div className="feature-heading">
      <span className="feature-icon"><CircleHelp size={20} /></span>
      <div>
        <p className="eyebrow">Support</p>
        <h1>Help center</h1>
        <p>Find quick answers and contact the MediMind support team.</p>
      </div>
    </div>

    <div className="feature-panel">
      <div className="feature-list">
        {helpItems.map(([question, answer]) => <article className="feature-card" key={question}>
          <div className="feature-icon compact-feature-icon"><CircleHelp size={18} /></div>
          <div><h3>{question}</h3><p>{answer}</p></div>
          <button className="text-button" onClick={() => announce(`Opening help article: ${question}.`)}>Read answer <ArrowUpRight size={14} /></button>
        </article>)}
      </div>

      <div className="secure-banner"><ShieldCheck size={17} /><span>Need more help? Our support team is ready to assist.</span><button className="text-button" onClick={() => announce('Support request form opened.')}>Contact support <ArrowUpRight size={14} /></button></div>
    </div>
  </section>
}

function SettingsPage({ dark, setDark, announce }) {
  return <section className="feature-view">
    <div className="feature-heading">
      <span className="feature-icon"><Settings size={20} /></span>
      <div>
        <p className="eyebrow">Account preferences</p>
        <h1>Settings</h1>
        <p>Manage appearance, notifications, and family account preferences.</p>
      </div>
    </div>

    <div className="feature-panel settings-panel">
      <div className="settings-section">
        <div><h2>Appearance</h2><p>Choose how MediMind looks on this device.</p></div>
        <button className="secondary-button" onClick={() => setDark(!dark)}>{dark ? <Sun size={16} /> : <Moon size={16} />} {dark ? 'Switch to light mode' : 'Switch to dark mode'}</button>
      </div>
      <div className="settings-section">
        <div><h2>Notifications</h2><p>Appointment reminders and family health updates are enabled.</p></div>
        <button className="primary-button" onClick={() => announce('Notification preferences saved.')}>Manage notifications</button>
      </div>
      <div className="settings-section">
        <div><h2>Privacy and security</h2><p>Your family profiles are protected with secure access.</p></div>
        <button className="secondary-button" onClick={() => announce('Privacy settings opened.')}><ShieldCheck size={16} /> Review privacy</button>
      </div>
    </div>
  </section>
}

export default App
