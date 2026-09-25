import { useState, useEffect } from 'react';
import {
  Activity,
  Building2,
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
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import {
  initialFamilyMembers,
  initialRecords,
  initialBookedSlots,
  initialDoctorAccess,
} from '../../data/medimindData';
import { FeatureDetailModal } from './components/FeatureDetailModal';
import { AppointmentDetailModal } from './components/AppointmentDetailModal';
import { CancelAppointmentModal } from './components/CancelAppointmentModal';
import { UploadRecordModal } from './components/UploadRecordModal';
import { DashboardView } from './views/DashboardView';
import { MemberProfileView } from './views/MemberProfileView';
import { FamilyMembersView } from './views/FamilyMembersView';
import { MedicalRecordsView } from './views/MedicalRecordsView';
import { AiPredictionsView } from './views/AiPredictionsView';
import { PersonalPredictionDetailView } from './views/PersonalPredictionDetailView';
import { DoctorsView } from './views/DoctorsView';
import { AppointmentsView } from './views/AppointmentsView';
import { ConsultationsView } from './views/ConsultationsView';
import { PrescriptionsView } from './views/PrescriptionsView';
import { DoctorAccessView } from './views/DoctorAccessView';
import { AppointmentAssessmentView } from './views/AppointmentAssessmentView';
import { BookAppointmentView } from './views/BookAppointmentView';
import { GeneralHealthRiskView } from './views/GeneralHealthRiskView';
import { DoctorProfileView } from './views/DoctorProfileView';
import { HelpCenterView } from './views/HelpCenterView';
import { SettingsView } from './views/SettingsView';
import './Family.css';

const navItems = [
  ['Dashboard', LayoutDashboard],
  ['Family members', UsersRound],
  ['Medical records', FileText],
  ['AI predictions', Sparkles],
  ['Doctors', Stethoscope],
  ['Appointments', CalendarDays],
  ['Consultations', Activity],
  ['Prescriptions', HeartPulse],
  ['Doctor access', LockKeyhole],
];

const allKnownPages = [
  'Dashboard',
  'Family members',
  'Member profile',
  'Medical records',
  'AI predictions',
  'Personal prediction detail',
  'Doctors',
  'Doctor profile',
  'Appointments',
  'Appointment assessment',
  'Appointment AI assessment',
  'Book appointment',
  'Consultations',
  'Prescriptions',
  'Doctor access',
  'General health risk',
  'Help center',
  'Settings',
];

const getInitialFamilyPage = () => {
  if (typeof window === 'undefined') return 'Dashboard';
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const matched = allKnownPages.find(
      (p) => p.toLowerCase().replace(/\s+/g, '-') === hash
    );
    if (matched) return matched;
  }
  const saved = sessionStorage.getItem('medimind_family_page');
  if (saved && allKnownPages.includes(saved)) return saved;
  return 'Dashboard';
};

export function FamilyLayout({ dark, setDark }) {
  const { user, logout, switchRole } = useAuth();
  const [page, setPage] = useState(getInitialFamilyPage);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [returnTo, setReturnTo] = useState('Doctors');
  const [memberIndex, setMemberIndex] = useState(() => {
    const savedIdx = sessionStorage.getItem('medimind_family_member_idx');
    return savedIdx ? parseInt(savedIdx, 10) : 0;
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [appointmentDetailModal, setAppointmentDetailModal] = useState(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [appointmentAssessment, setAppointmentAssessment] = useState(null);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [rescheduleData, setRescheduleData] = useState(null);

  const [familyMembers, setFamilyMembers] = useState(initialFamilyMembers);
  const [records, setRecords] = useState(initialRecords);
  const [bookedSlots, setBookedSlots] = useState(initialBookedSlots);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [appointmentStatuses, setAppointmentStatuses] = useState({});
  const [doctorAccess, setDoctorAccess] = useState(initialDoctorAccess);

  const member = familyMembers[memberIndex] ?? familyMembers[0];

  // Refresh and History Navigation Synchronization
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const matched = allKnownPages.find(
          (p) => p.toLowerCase().replace(/\s+/g, '-') === hash
        );
        if (matched) setPage(matched);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const announce = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const navigate = (nextPage, extra = {}) => {
    setPage(nextPage);
    setProfileOpen(false);
    setMobileMenuOpen(false);

    if (extra.doctor) setSelectedDoctor(extra.doctor);
    if (extra.returnTo) setReturnTo(extra.returnTo);
    if (extra.prediction) setSelectedPrediction(extra.prediction);
    if (extra.rescheduleData) setRescheduleData(extra.rescheduleData);

    const slug = nextPage.toLowerCase().replace(/\s+/g, '-');
    window.history.pushState({ page: nextPage }, '', `#${slug}`);
    sessionStorage.setItem('medimind_family_page', nextPage);
  };

  const handleSelectMemberIndex = (idx) => {
    setMemberIndex(idx);
    sessionStorage.setItem('medimind_family_member_idx', idx.toString());
  };

  const openFeatureModal = (item, feature) => setDetailModal({ item, feature });

  const handleAddRecord = (newRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    if (newRecord.patient) {
      setFamilyMembers((prev) =>
        prev.map((m) =>
          m.name.toLowerCase() === newRecord.patient.toLowerCase()
            ? { ...m, records: (m.records || 0) + 1 }
            : m
        )
      );
    }
  };

  const handleDeleteRecord = (recordToDelete) => {
    setRecords((prev) =>
      prev.filter(
        (r) =>
          r !== recordToDelete &&
          !(
            r.type === recordToDelete.type &&
            r.date === recordToDelete.date &&
            r.patient === recordToDelete.patient &&
            (r.title === recordToDelete.title || !r.title)
          )
      )
    );
    if (recordToDelete.patient) {
      setFamilyMembers((prev) =>
        prev.map((m) =>
          m.name.toLowerCase() === recordToDelete.patient.toLowerCase()
            ? { ...m, records: Math.max(0, (m.records || 1) - 1) }
            : m
        )
      );
    }
    announce(`Medical record "${recordToDelete.title || recordToDelete.type}" removed.`);
  };

  const handleUpdateMember = (updatedMember) => {
    setFamilyMembers((prev) =>
      prev.map((m, idx) => (idx === memberIndex ? updatedMember : m))
    );
  };

  const handleGrantAccess = (grant) => {
    const exists = doctorAccess.some(
      (entry) =>
        entry.member.toLowerCase() === grant.member.toLowerCase() &&
        entry.doctor.toLowerCase() === grant.doctor.toLowerCase()
    );
    if (exists) {
      announce(`${grant.doctor} already has access to ${grant.member}'s records.`);
      return;
    }
    const newEntry = {
      ...grant,
      granted: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    setDoctorAccess((current) => [...current, newEntry]);
    announce(`Access granted to ${grant.doctor} for ${grant.member}.`);
  };

  const handleRevokeAccess = (entry) => {
    setDoctorAccess((current) =>
      current.filter(
        (item) => !(item.member === entry.member && item.doctor === entry.doctor)
      )
    );
    announce(`Access revoked for ${entry.doctor} to ${entry.member}'s records.`);
  };

  const handleCancelAppointment = (item) => {
    setAppointmentToCancel(item);
  };

  const handleConfirmCancelAppointment = (item) => {
    const key = `${item.title}|${item.detail}`;
    setAppointmentStatuses((curr) => ({ ...curr, [key]: 'Cancelled' }));
    announce(`Appointment cancelled for ${item.title}.`);
  };

  const handleRescheduleAppointment = (item) => {
    setRescheduleData(item);
    setReturnTo('Appointments');
    navigate('Book appointment');
    announce(`Rescheduling appointment for ${item.title}`);
  };

  const handleUpdateRescheduledAppointment = (oldApt, updatedBooking) => {
    const formattedDate = new Date(`${updatedBooking.date}T00:00:00`).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const updatedObj = {
      ...oldApt,
      title: updatedBooking.type || oldApt.title,
      detail: `${updatedBooking.doctor} · ${updatedBooking.patient}`,
      meta: `${formattedDate} · ${updatedBooking.slot} · ${updatedBooking.mode}`,
      initials: formattedDate.slice(0, 2),
      doctor: updatedBooking.doctor,
      patient: updatedBooking.patient,
      date: formattedDate,
      slot: updatedBooking.slot,
      mode: updatedBooking.mode,
    };

    setBookedAppointments((prev) => {
      const exists = prev.some((a) => a.title === oldApt.title && a.detail === oldApt.detail);
      if (exists) {
        return prev.map((a) => (a.title === oldApt.title && a.detail === oldApt.detail ? updatedObj : a));
      }
      return [updatedObj, ...prev];
    });

    setRescheduleData(null);
  };

  const handleBookAppointment = (booking) => {
    const bookingKey = `${booking.doctor}|${booking.date}`;
    const slotsForDay = bookedSlots[bookingKey] ?? [];
    if (slotsForDay.includes(booking.slot)) {
      announce(`${booking.slot} is already booked with ${booking.doctor}. Please choose another slot.`);
      return false;
    }

    setBookedSlots((current) => ({
      ...current,
      [bookingKey]: [...(current[bookingKey] ?? []), booking.slot],
    }));

    const formattedDate = new Date(`${booking.date}T00:00:00`).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newApt = {
      title: booking.type,
      detail: `${booking.doctor} · ${booking.patient}`,
      meta: `${formattedDate} · ${booking.slot} · ${booking.mode}`,
      tone: 'mint',
      initials: formattedDate.slice(0, 2),
      action: 'View details',
      doctor: booking.doctor,
      patient: booking.patient,
      date: formattedDate,
      slot: booking.slot,
      mode: booking.mode,
      reason: booking.reason,
    };

    setBookedAppointments((current) => [newApt, ...current]);

    // Auto-grant doctor access upon appointment booking (Part 12)
    setDoctorAccess((current) => {
      const exists = current.some(
        (entry) =>
          entry.member.toLowerCase() === booking.patient.toLowerCase() &&
          entry.doctor.toLowerCase() === booking.doctor.toLowerCase()
      );
      if (exists) return current;

      const docDept = booking.doctor.includes('Mehta')
        ? 'Orthopedics'
        : booking.doctor.includes('Rao')
        ? 'Cardiology'
        : booking.doctor.includes('Shah')
        ? 'Diabetology'
        : 'General Medicine';

      return [
        ...current,
        {
          member: booking.patient,
          doctor: booking.doctor,
          department: docDept,
          granted: formattedDate,
        },
      ];
    });

    return true;
  };

  const handleAddMember = (nextMember) => {
    const updatedMembers = [...familyMembers, nextMember];
    setFamilyMembers(updatedMembers);
    handleSelectMemberIndex(updatedMembers.length - 1);
    announce(`${nextMember.name} was added to your family account.`);
  };

  const handleDeleteMember = (index) => {
    if (familyMembers.length <= 1) {
      announce('At least one family member must remain in the account.');
      return;
    }

    const deletedMember = familyMembers[index];
    const updatedMembers = familyMembers.filter((_, idx) => idx !== index);
    setFamilyMembers(updatedMembers);
    if (memberIndex >= updatedMembers.length) {
      handleSelectMemberIndex(updatedMembers.length - 1);
    }
    announce(`${deletedMember.name} was removed from your family account.`);
  };

  const handleOpenPredictionDetail = (predictionData) => {
    setSelectedPrediction(predictionData);
    navigate('Personal prediction detail');
  };

  const renderCurrentView = () => {
    if (page === 'Dashboard') {
      return (
        <DashboardView
          member={member}
          familyMembers={familyMembers}
          records={records}
          bookedAppointments={bookedAppointments}
          memberIndex={memberIndex}
          setMemberIndex={handleSelectMemberIndex}
          navigate={navigate}
          announce={announce}
          openFeatureModal={openFeatureModal}
          onOpenAppointmentDetail={(apt) => setAppointmentDetailModal(apt)}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onOpenPredictionDetail={handleOpenPredictionDetail}
        />
      );
    }
    if (page === 'Member profile') {
      return (
        <MemberProfileView
          member={member}
          records={records}
          navigate={navigate}
          announce={announce}
          openFeatureModal={openFeatureModal}
          onUpdateMember={handleUpdateMember}
          onDeleteMember={familyMembers.length > 1 ? () => handleDeleteMember(memberIndex) : null}
        />
      );
    }
    if (page === 'Family members') {
      return (
        <FamilyMembersView
          familyMembers={familyMembers}
          memberIndex={memberIndex}
          setMemberIndex={handleSelectMemberIndex}
          handleAddMember={handleAddMember}
          handleDeleteMember={handleDeleteMember}
          navigate={navigate}
          announce={announce}
        />
      );
    }
    if (page === 'Medical records') {
      return (
        <MedicalRecordsView
          records={records}
          familyMembers={familyMembers}
          activeMember={member}
          navigate={navigate}
          announce={announce}
          openFeatureModal={openFeatureModal}
          onAddRecord={handleAddRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      );
    }
    if (page === 'AI predictions') {
      return (
        <AiPredictionsView
          member={member}
          records={records}
          predictionHistory={predictionHistory}
          navigate={navigate}
          announce={announce}
          onOpenPredictionDetail={handleOpenPredictionDetail}
          onAddPrediction={(newPred) => setPredictionHistory((prev) => [newPred, ...prev])}
          onAddRecord={handleAddRecord}
        />
      );
    }
    if (page === 'Personal prediction detail') {
      return (
        <PersonalPredictionDetailView
          prediction={selectedPrediction}
          member={member}
          records={records}
          navigate={navigate}
          announce={announce}
          openFeatureModal={openFeatureModal}
          onBookDoctor={(doc) => {
            setSelectedDoctor(doc);
            setReturnTo('Personal prediction detail');
            navigate('Book appointment');
          }}
        />
      );
    }
    if (page === 'Doctors') {
      return (
        <DoctorsView
          setSelectedDoctor={setSelectedDoctor}
          setReturnTo={setReturnTo}
          navigate={navigate}
          announce={announce}
          openFeatureModal={openFeatureModal}
        />
      );
    }
    if (page === 'Appointments') {
      return (
        <AppointmentsView
          bookedAppointments={bookedAppointments}
          appointmentStatuses={appointmentStatuses}
          setAppointmentStatuses={setAppointmentStatuses}
          onCancelAppointment={handleCancelAppointment}
          onRescheduleAppointment={handleRescheduleAppointment}
          setReturnTo={setReturnTo}
          navigate={navigate}
          announce={announce}
          openFeatureModal={openFeatureModal}
        />
      );
    }
    if (page === 'Consultations') {
      return (
        <ConsultationsView
          openFeatureModal={openFeatureModal}
          announce={announce}
        />
      );
    }
    if (page === 'Prescriptions') {
      return (
        <PrescriptionsView
          openFeatureModal={openFeatureModal}
          announce={announce}
        />
      );
    }
    if (page === 'Doctor access') {
      return (
        <DoctorAccessView
          doctorAccess={doctorAccess}
          setDoctorAccess={setDoctorAccess}
          familyMembers={familyMembers}
          activeMember={member}
          onGrant={handleGrantAccess}
          onRevoke={handleRevokeAccess}
          announce={announce}
        />
      );
    }
    if (page === 'Appointment assessment' || page === 'Appointment AI assessment') {
      return (
        <AppointmentAssessmentView
          selectedDoctor={selectedDoctor}
          familyMembers={familyMembers}
          member={member}
          records={records}
          returnTo={returnTo}
          navigate={navigate}
          announce={announce}
          setAppointmentAssessment={setAppointmentAssessment}
          onAddRecord={handleAddRecord}
        />
      );
    }
    if (page === 'Book appointment') {
      return (
        <BookAppointmentView
          selectedDoctor={selectedDoctor}
          familyMembers={familyMembers}
          member={member}
          appointmentAssessment={appointmentAssessment}
          bookedSlots={bookedSlots}
          rescheduleData={rescheduleData}
          returnTo={returnTo}
          navigate={navigate}
          announce={announce}
          handleBookAppointment={handleBookAppointment}
          onUpdateRescheduledAppointment={handleUpdateRescheduledAppointment}
        />
      );
    }
    if (page === 'General health risk') {
      return (
        <GeneralHealthRiskView
          member={member}
          navigate={navigate}
          announce={announce}
        />
      );
    }
    if (page === 'Doctor profile') {
      return (
        <DoctorProfileView
          selectedDoctor={selectedDoctor}
          setSelectedDoctor={setSelectedDoctor}
          setReturnTo={setReturnTo}
          navigate={navigate}
          announce={announce}
          openFeatureModal={openFeatureModal}
        />
      );
    }
    if (page === 'Help center') {
      return (
        <HelpCenterView
          announce={announce}
          userEmail={user?.email}
        />
      );
    }
    if (page === 'Settings') {
      return (
        <SettingsView
          dark={dark}
          setDark={setDark}
          announce={announce}
          logout={logout}
        />
      );
    }

    return null;
  };

  return (
    <div className={`app-shell ${dark ? 'dark-theme' : ''}`}>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <HeartPulse size={20} />
          </div>
          <span>Medi<span>Mind</span></span>
        </div>

        <div className="nav-label">Family Workspace</div>
        {navItems.map(([item, Icon]) => (
          <button
            key={item}
            className={`nav-item ${page === item ? 'active' : ''}`}
            onClick={() => navigate(item)}
          >
            <Icon size={18} />
            <span>{item}</span>
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

          {/* Quick role switches */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '8px' }}>
            <button
              className="nav-item"
              style={{ padding: '6px 8px', fontSize: '11px', color: '#0f766e', background: '#f0fdfa', borderRadius: '6px' }}
              onClick={() => switchRole('DOCTOR')}
              title="Switch to Doctor"
            >
              <Stethoscope size={14} />
              <span>Doctor</span>
            </button>

            <button
              className="nav-item"
              style={{ padding: '6px 8px', fontSize: '11px', color: '#7c3aed', background: '#f5f3ff', borderRadius: '6px' }}
              onClick={() => switchRole('DEPARTMENT_HEAD')}
              title="Switch to Department Head"
            >
              <Activity size={14} />
              <span>Dept Head</span>
            </button>

            <button
              className="nav-item"
              style={{ padding: '6px 8px', fontSize: '11px', color: '#2563eb', background: '#eff6ff', borderRadius: '6px' }}
              onClick={() => switchRole('HOSPITAL_ADMIN')}
              title="Switch to Hospital Admin"
            >
              <Building2 size={14} />
              <span>Admin</span>
            </button>

            <button
              className="nav-item"
              style={{ padding: '6px 8px', fontSize: '11px', color: '#4338ca', background: '#eef2ff', borderRadius: '6px' }}
              onClick={() => switchRole('CHAIRMAN')}
              title="Switch to Chairman"
            >
              <Crown size={14} />
              <span>Chairman</span>
            </button>
          </div>

          <button
            className="nav-item"
            style={{ marginTop: '4px', color: '#ef4444' }}
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>

          <div className="privacy-note">
            <ShieldCheck size={16} />
            <span>HIPAA-ready encrypted family health workspace</span>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>MediMind Family</span>
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>

          <div className="top-actions">
            <button
              className="icon-button theme-button"
              onClick={() => setDark(!dark)}
              title={dark ? 'Light mode' : 'Dark mode'}
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="profile-button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Switch active family profile"
              aria-expanded={profileOpen}
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
                  handleSelectMemberIndex(idx);
                  setProfileOpen(false);
                  announce(`Switched active view to ${item.name}`);
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

      {appointmentDetailModal && (
        <AppointmentDetailModal
          isOpen={!!appointmentDetailModal}
          appointment={appointmentDetailModal}
          onClose={() => setAppointmentDetailModal(null)}
          onReschedule={handleRescheduleAppointment}
          onCancel={handleCancelAppointment}
          announce={announce}
        />
      )}

      {appointmentToCancel && (
        <CancelAppointmentModal
          isOpen={!!appointmentToCancel}
          appointment={appointmentToCancel}
          onClose={() => setAppointmentToCancel(null)}
          onConfirmCancel={handleConfirmCancelAppointment}
        />
      )}

      {isUploadModalOpen && (
        <UploadRecordModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          familyMembers={familyMembers}
          activeMember={member}
          onAddRecord={handleAddRecord}
          announce={announce}
        />
      )}

      {toast && (
        <div className="toast">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
