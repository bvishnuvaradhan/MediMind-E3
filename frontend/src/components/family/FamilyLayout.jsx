import { useState } from 'react'
import {
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Crown,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Upload,
  UsersRound,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import {
  initialFamilyMembers,
  initialBookedSlots,
  initialDoctorAccess,
} from '../../data/familyMockData'
import { FeatureDetailModal } from './components/FeatureDetailModal'
import { DashboardView } from './views/DashboardView'
import { MemberProfileView } from './views/MemberProfileView'
import { FamilyMembersView } from './views/FamilyMembersView'
import { MedicalRecordsView } from './views/MedicalRecordsView'
import { UploadRecordView } from './views/UploadRecordView'
import { AiPredictionsView } from './views/AiPredictionsView'
import { DoctorsView } from './views/DoctorsView'
import { AppointmentsView } from './views/AppointmentsView'
import { ConsultationsView } from './views/ConsultationsView'
import { PrescriptionsView } from './views/PrescriptionsView'
import { DoctorAccessView } from './views/DoctorAccessView'
import { AppointmentAssessmentView } from './views/AppointmentAssessmentView'
import { BookAppointmentView } from './views/BookAppointmentView'
import { GeneralHealthRiskView } from './views/GeneralHealthRiskView'
import { DoctorProfileView } from './views/DoctorProfileView'
import { HelpCenterView } from './views/HelpCenterView'
import { SettingsView } from './views/SettingsView'
import './Family.css'

const navItems = [
  ['Dashboard', LayoutDashboard],
  ['Family members', UsersRound],
  ['Medical records', FileText],
  ['Upload record', Upload],
  ['AI predictions', Sparkles],
  ['Doctors', Stethoscope],
  ['Appointments', CalendarDays],
  ['Consultations', Activity],
  ['Prescriptions', HeartPulse],
  ['Doctor access', LockKeyhole],
]

export function FamilyLayout({ dark, setDark }) {
  const { user, logout, switchRole } = useAuth()
  const [page, setPage] = useState('Dashboard')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [memberIndex, setMemberIndex] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [detailModal, setDetailModal] = useState(null)
  const [appointmentAssessment, setAppointmentAssessment] = useState(null)
  const [familyMembers, setFamilyMembers] = useState(initialFamilyMembers)
  const [bookedSlots, setBookedSlots] = useState(initialBookedSlots)
  const [bookedAppointments, setBookedAppointments] = useState([])
  const [appointmentStatuses, setAppointmentStatuses] = useState({})
  const [doctorAccess, setDoctorAccess] = useState(initialDoctorAccess)
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
    if (memberIndex >= updatedMembers.length) {
      setMemberIndex(updatedMembers.length - 1)
    }
    announce(`${deletedMember.name} was removed from your family account.`)
  }

  const renderCurrentView = () => {
    if (page === 'Dashboard') {
      return (
        <DashboardView
          member={member}
          familyMembers={familyMembers}
          memberIndex={memberIndex}
          setMemberIndex={setMemberIndex}
          navigate={navigate}
          announce={announce}
          openFeatureModal={openFeatureModal}
        />
      )
    }
    if (page === 'Member profile') {
      return (
        <MemberProfileView
          member={member}
          navigate={navigate}
          announce={announce}
          openFeatureModal={openFeatureModal}
        />
      )
    }
    if (page === 'Family members') {
      return (
        <FamilyMembersView
          familyMembers={familyMembers}
          memberIndex={memberIndex}
          setMemberIndex={setMemberIndex}
          showAddMember={showAddMember}
          setShowAddMember={setShowAddMember}
          newMember={newMember}
          setNewMember={setNewMember}
          handleAddMember={handleAddMember}
          handleDeleteMember={handleDeleteMember}
          navigate={navigate}
        />
      )
    }
    if (page === 'Medical records') {
      return (
        <MedicalRecordsView
          navigate={navigate}
          openFeatureModal={openFeatureModal}
        />
      )
    }
    if (page === 'Upload record') {
      return (
        <UploadRecordView
          familyMembers={familyMembers}
          navigate={navigate}
          announce={announce}
        />
      )
    }
    if (page === 'AI predictions') {
      return (
        <AiPredictionsView
          navigate={navigate}
          announce={announce}
        />
      )
    }
    if (page === 'Doctors') {
      return (
        <DoctorsView
          setSelectedDoctor={setSelectedDoctor}
          navigate={navigate}
          openFeatureModal={openFeatureModal}
        />
      )
    }
    if (page === 'Appointments') {
      return (
        <AppointmentsView
          bookedAppointments={bookedAppointments}
          appointmentStatuses={appointmentStatuses}
          setAppointmentStatuses={setAppointmentStatuses}
          navigate={navigate}
          announce={announce}
          openFeatureModal={openFeatureModal}
        />
      )
    }
    if (page === 'Consultations') {
      return (
        <ConsultationsView
          openFeatureModal={openFeatureModal}
        />
      )
    }
    if (page === 'Prescriptions') {
      return (
        <PrescriptionsView
          openFeatureModal={openFeatureModal}
        />
      )
    }
    if (page === 'Doctor access') {
      return (
        <DoctorAccessView
          doctorAccess={doctorAccess}
          setDoctorAccess={setDoctorAccess}
          familyMembers={familyMembers}
          announce={announce}
        />
      )
    }
    if (page === 'Appointment assessment') {
      return (
        <AppointmentAssessmentView
          selectedDoctor={selectedDoctor}
          familyMembers={familyMembers}
          member={member}
          navigate={navigate}
          announce={announce}
          setAppointmentAssessment={setAppointmentAssessment}
        />
      )
    }
    if (page === 'Book appointment') {
      return (
        <BookAppointmentView
          selectedDoctor={selectedDoctor}
          familyMembers={familyMembers}
          member={member}
          appointmentAssessment={appointmentAssessment}
          bookedSlots={bookedSlots}
          navigate={navigate}
          announce={announce}
          handleBookAppointment={handleBookAppointment}
        />
      )
    }
    if (page === 'General health risk') {
      return (
        <GeneralHealthRiskView
          navigate={navigate}
          announce={announce}
        />
      )
    }
    if (page === 'Doctor profile') {
      return (
        <DoctorProfileView
          selectedDoctor={selectedDoctor}
          navigate={navigate}
          openFeatureModal={openFeatureModal}
        />
      )
    }
    if (page === 'Help center') {
      return (
        <HelpCenterView
          announce={announce}
        />
      )
    }
    if (page === 'Settings') {
      return (
        <SettingsView
          dark={dark}
          setDark={setDark}
          announce={announce}
          logout={logout}
        />
      )
    }

    return null
  }

  return (
    <div className={`app-shell ${dark ? 'dark-theme' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <HeartPulse size={20} />
          </div>
          <span>Medi<span>Mind</span></span>
        </div>

        <button className="account-switcher" onClick={() => navigate('Member profile')}>
          <div className={`avatar avatar-${member.tone}`}>
            {member.initials}
          </div>
          <div className="account-copy">
            <strong>{member.name}</strong>
            <span>{member.relation} · Family</span>
          </div>
          <ChevronDown size={16} />
        </button>

        <div className="nav-label">Family Workspace</div>
        {navItems.map(([item, Icon]) => (
          <button
            key={item}
            className={`nav-item ${page === item ? 'active' : ''}`}
            onClick={() => navigate(item)}
          >
            <Icon size={18} />
            <span>{item}</span>
            {item === 'AI predictions' && <div className="nav-dot" />}
          </button>
        ))}

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${page === 'Settings' ? 'active' : ''}`}
            onClick={() => navigate('Settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button
            className={`nav-item ${page === 'Help center' ? 'active' : ''}`}
            onClick={() => navigate('Help center')}
          >
            <CircleHelp size={18} />
            <span>Help center</span>
          </button>

          {/* Quick role switch for development/testing */}
          <button
            className="nav-item"
            style={{ marginTop: '8px', color: '#6366f1', background: '#eef2ff', borderRadius: '8px' }}
            onClick={() => switchRole('CHAIRMAN')}
          >
            <Crown size={18} />
            <span>Switch to Chairman</span>
          </button>

          <button
            className="nav-item"
            style={{ marginTop: '4px', color: '#ef4444' }}
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Sign Out ({user?.role})</span>
          </button>

          <div className="privacy-note">
            <ShieldCheck size={16} />
            <span>HIPAA-ready encrypted family health workspace</span>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => announce('Navigation menu')}>
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>MediMind</span>
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search size={15} />
              <input placeholder="Search records, doctors..." />
            </div>
            <button
              className="icon-button theme-button"
              onClick={() => setDark(!dark)}
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="profile-button"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className={`avatar small avatar-${member.tone}`}>
                {member.initials}
              </div>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        {profileOpen && (
          <div className="profile-popover">
            <div className="popover-header">
              <strong>Switch profile</strong>
              <button onClick={() => setProfileOpen(false)}>×</button>
            </div>
            {familyMembers.map((item, idx) => (
              <button
                key={item.name}
                className="popover-member"
                onClick={() => {
                  setMemberIndex(idx)
                  setProfileOpen(false)
                  announce(`Switched active view to ${item.name}`)
                }}
              >
                <div className={`avatar small avatar-${item.tone}`}>
                  {item.initials}
                </div>
                <span>{item.name}</span>
                {idx === memberIndex && <span className="check">✓</span>}
              </button>
            ))}
          </div>
        )}

        <main className="page-content">
          {renderCurrentView()}
        </main>
      </div>

      {detailModal && (
        <FeatureDetailModal
          item={detailModal.item}
          feature={detailModal.feature}
          onClose={() => setDetailModal(null)}
          announce={announce}
        />
      )}

      {toast && (
        <div className="toast">
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
