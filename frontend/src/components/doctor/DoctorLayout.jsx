import React, { useState, useEffect, useTransition } from 'react';
import './Doctor.css';
import { doctorService } from '../../services/doctorService';
import { useAuth } from '../../context/useAuth';

// Views
import DashboardView from './views/DashboardView';
import PatientsView from './views/PatientsView';
import PatientProfileView from './views/PatientProfileView';
import AppointmentsView from './views/AppointmentsView';
import ConsultationsView from './views/ConsultationsView';
import PrescriptionsView from './views/PrescriptionsView';
import AiDiagnosticView from './views/AiDiagnosticView';
import AvailabilityView from './views/AvailabilityView';
import PatientAccessView from './views/PatientAccessView';
import KnowledgeView from './views/KnowledgeView';
import SettingsView from './views/SettingsView';

// Modals
import NewConsultationModal from './components/NewConsultationModal';
import NewPrescriptionModal from './components/NewPrescriptionModal';
import AiExplainabilityModal from './components/AiExplainabilityModal';
import CreateArticleModal from './components/CreateArticleModal';
import ConfirmationModal from './components/ConfirmationModal';

export function DoctorLayout({ dark, setDark }) {
  const { user, logout, switchRole } = useAuth();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // Data states
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [accessHistory, setAccessHistory] = useState([]);
  const [articles, setArticles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);

  // UI modal states
  const [toast, setToast] = useState(null);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultationModalData, setConsultationModalData] = useState(null);

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [prescriptionModalData, setPrescriptionModalData] = useState(null);

  const [aiExplainModal, setAiExplainModal] = useState({
    isOpen: false,
    prediction: null,
    patientName: '',
  });

  const [isCreateArticleOpen, setIsCreateArticleOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load initial doctor data
  useEffect(() => {
    async function loadData() {
      const [
        prof,
        pats,
        apts,
        cons,
        rxs,
        accs,
        arts,
        notifs,
        stts,
      ] = await Promise.all([
        doctorService.getProfile(),
        doctorService.getAuthorizedPatients(),
        doctorService.getAppointments(),
        doctorService.getConsultations(),
        doctorService.getPrescriptions(),
        doctorService.getAccessHistory(),
        doctorService.getArticles(),
        doctorService.getNotifications(),
        doctorService.getSettings(),
      ]);

      setDoctorProfile(prof);
      setPatients(pats);
      setAppointments(apts);
      setConsultations(cons);
      setPrescriptions(rxs);
      setAccessHistory(accs);
      setArticles(arts);
      setNotifications(notifs);
      setSettings(stts);
    }
    loadData();
  }, []);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleNavigate = (tab) => {
    startTransition(() => {
      setActiveTab(tab);
      if (tab !== 'patient_profile') {
        setSelectedPatientId(null);
      }
    });
  };

  const handleSelectPatient = (patientId) => {
    setSelectedPatientId(patientId);
    handleNavigate('patient_profile');
  };

  // Consultation handlers
  const handleOpenNewConsultation = (patient = null, initialCons = null) => {
    setConsultationModalData(
      initialCons
        ? initialCons
        : patient
        ? { patientId: patient.id }
        : null
    );
    setIsConsultationModalOpen(true);
  };

  const handleSaveConsultationDraft = async (consData) => {
    const saved = await doctorService.saveDraftConsultation(consData);
    setConsultations((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
    });
    showToast(`Consultation draft saved (${saved.consultationNumber})`);
  };

  const handleFinalizeConsultation = async (consData) => {
    setConfirmModal({
      isOpen: true,
      title: 'Finalize & Sign Clinical Consultation',
      message:
        'Once finalized, this consultation becomes immutable in the patient’s permanent medical record. Any subsequent corrections must be submitted as linked amendments. Proceed?',
      confirmText: 'Sign & Finalize',
      onConfirm: async () => {
        const finalized = await doctorService.finalizeConsultation(consData);
        setConsultations((prev) => {
          const exists = prev.some((c) => c.id === finalized.id);
          return exists ? prev.map((c) => (c.id === finalized.id ? finalized : c)) : [finalized, ...prev];
        });
        // Update appointments if linked
        const updatedApts = await doctorService.getAppointments();
        setAppointments(updatedApts);
        showToast(`Consultation ${finalized.consultationNumber} finalized and signed`);
      },
    });
  };

  const handleAmendConsultation = async (consId, amendmentData) => {
    const updated = await doctorService.amendConsultation(consId, amendmentData);
    setConsultations((prev) => prev.map((c) => (c.id === consId ? updated : c)));
    showToast(`Clinical amendment appended to ${updated.consultationNumber}`);
  };

  // Prescription handlers
  const handleOpenNewPrescription = (patient = null, initialRx = null) => {
    setPrescriptionModalData(
      initialRx
        ? initialRx
        : patient
        ? { patientId: patient.id }
        : null
    );
    setIsPrescriptionModalOpen(true);
  };

  const handleSavePrescriptionDraft = async (rxData) => {
    const saved = await doctorService.saveDraftPrescription(rxData);
    setPrescriptions((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
    showToast(`Prescription draft saved (${saved.prescriptionNumber})`);
  };

  const handleFinalizePrescription = async (rxData) => {
    setConfirmModal({
      isOpen: true,
      title: 'Issue Final Electronic Prescription',
      message:
        'Finalized prescriptions are immutable and recorded permanently in the patient portal. Any subsequent adjustments require a linked prescription correction. Issue prescription?',
      confirmText: 'Issue Prescription',
      onConfirm: async () => {
        const finalized = await doctorService.finalizePrescription(rxData);
        setPrescriptions((prev) => {
          const exists = prev.some((p) => p.id === finalized.id);
          return exists ? prev.map((p) => (p.id === finalized.id ? finalized : p)) : [finalized, ...prev];
        });
        showToast(`Prescription ${finalized.prescriptionNumber} issued to patient`);
      },
    });
  };

  const handleCorrectPrescription = async (rxId, correctionData) => {
    const updated = await doctorService.correctPrescription(rxId, correctionData);
    setPrescriptions((prev) => prev.map((p) => (p.id === rxId ? updated : p)));
    showToast(`Prescription correction issued for ${updated.prescriptionNumber}`);
  };

  // Availability & Settings handlers
  const handleSaveAvailability = async (schedule, slotDuration) => {
    const updated = await doctorService.updateAvailability(schedule, slotDuration);
    setDoctorProfile(updated);
    showToast('OPD availability schedule updated');
  };

  const handleSaveProfile = async (profData) => {
    const updated = await doctorService.updateProfile(profData);
    setDoctorProfile(updated);
    showToast('Clinician profile updated');
  };

  const handleSaveSettings = async (sttData) => {
    const updated = await doctorService.updateSettings(sttData);
    setSettings(updated);
    showToast('Clinical workspace settings saved');
  };

  // Article handlers
  const handleCreateArticle = async (artData) => {
    const newArt = await doctorService.createArticle(artData);
    setArticles((prev) => [newArt, ...prev]);
    showToast(
      artData.submitForReview
        ? `Article submitted to Dept Head for review: "${newArt.title}"`
        : `Article saved as draft: "${newArt.title}"`
    );
  };

  const handleOpenAiExplain = (prediction, patientName) => {
    setAiExplainModal({
      isOpen: true,
      prediction,
      patientName,
    });
  };

  const currentPatient = patients.find((p) => p.id === selectedPatientId);

  // Tab Titles
  const tabTitles = {
    dashboard: { title: 'Clinician Workspace Hub', sub: 'Today’s appointment queue, active patients & AI decision telemetry' },
    patients: { title: 'Authorized Patients Directory', sub: 'Clinical records for family-authorized patients only' },
    patient_profile: { title: currentPatient ? currentPatient.name : 'Patient Clinical Profile', sub: 'Unified health record, scans, AI predictions & prescriptions' },
    appointments: { title: 'Outpatient Appointments', sub: 'Manage OPD consultation queue and triage' },
    consultations: { title: 'Consultations & Clinical Records', sub: 'Immutable medical consultations & clinical amendments' },
    prescriptions: { title: 'Electronic Prescriptions', sub: 'Medication schedules, dosages, and linked corrections' },
    ai_diagnostics: { title: 'AI Decision Support Telemetry', sub: 'Fracture Detection CNN & Grad-CAM heatmap localization' },
    availability: { title: 'Consultation Availability', sub: 'Weekly OPD shift timings & booking slot capacity' },
    patient_access: { title: 'Patient Access History', sub: 'Auditable record of family authorizations & revocations' },
    knowledge: { title: 'MediMind Knowledge Base', sub: 'Clinical guidelines, protocols, and authored articles' },
    settings: { title: 'Doctor Profile & Settings', sub: 'Clinician credentials, notification alerts & presets' },
  };

  return (
    <div className={`doctor-shell ${dark ? 'dark-theme' : ''}`}>
      {/* Toast */}
      {toast && (
        <div className={`doctor-toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : 'ℹ'}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      {/* New Consultation Modal */}
      <NewConsultationModal
        isOpen={isConsultationModalOpen}
        initialData={consultationModalData}
        patients={patients}
        appointments={appointments}
        onSaveDraft={handleSaveConsultationDraft}
        onFinalize={handleFinalizeConsultation}
        onClose={() => {
          setIsConsultationModalOpen(false);
          setConsultationModalData(null);
        }}
      />

      {/* New Prescription Modal */}
      <NewPrescriptionModal
        isOpen={isPrescriptionModalOpen}
        initialData={prescriptionModalData}
        patients={patients}
        onSaveDraft={handleSavePrescriptionDraft}
        onFinalize={handleFinalizePrescription}
        onClose={() => {
          setIsPrescriptionModalOpen(false);
          setPrescriptionModalData(null);
        }}
      />

      {/* AI Explainability Modal */}
      <AiExplainabilityModal
        isOpen={aiExplainModal.isOpen}
        prediction={aiExplainModal.prediction}
        patientName={aiExplainModal.patientName}
        onClose={() => setAiExplainModal({ isOpen: false, prediction: null, patientName: '' })}
      />

      {/* Create Article Modal */}
      <CreateArticleModal
        isOpen={isCreateArticleOpen}
        authorName={doctorProfile?.name || 'Dr. Rahul Mehta'}
        onSave={handleCreateArticle}
        onClose={() => setIsCreateArticleOpen(false)}
      />

      {/* Sidebar */}
      <aside className="doctor-sidebar">
        <div className="doctor-brand">
          <div className="doctor-brand-mark">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span>Medi<span>Mind</span></span>
        </div>

        {/* Doctor Info Badge */}
        <div className="doctor-profile-badge">
          <div className="doctor-badge-icon">👨‍⚕️</div>
          <div className="doctor-badge-text">
            <span className="doctor-badge-dept">{doctorProfile?.departmentName || 'Orthopedics'}</span>
            <span className="doctor-badge-hosp">{doctorProfile?.hospitalName || 'Central Hospital'}</span>
          </div>
        </div>

        {/* Navigation Section 1: Overview */}
        <div className="doctor-nav-section-title">Clinical Overview</div>
        <nav className="doctor-nav">
          <button
            className={`doctor-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </button>
        </nav>

        {/* Navigation Section 2: Patient Care */}
        <div className="doctor-nav-section-title">Patient Care</div>
        <nav className="doctor-nav">
          <button
            className={`doctor-nav-item ${activeTab === 'patients' || activeTab === 'patient_profile' ? 'active' : ''}`}
            onClick={() => handleNavigate('patients')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Authorized Patients
          </button>

          <button
            className={`doctor-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => handleNavigate('appointments')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            OPD Appointments
          </button>
        </nav>

        {/* Navigation Section 3: Clinical Workspace */}
        <div className="doctor-nav-section-title">Clinical Workspace</div>
        <nav className="doctor-nav">
          <button
            className={`doctor-nav-item ${activeTab === 'consultations' ? 'active' : ''}`}
            onClick={() => handleNavigate('consultations')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Consultations
          </button>

          <button
            className={`doctor-nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => handleNavigate('prescriptions')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Prescriptions
          </button>

          <button
            className={`doctor-nav-item ${activeTab === 'ai_diagnostics' ? 'active' : ''}`}
            onClick={() => handleNavigate('ai_diagnostics')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Decision Support
          </button>
        </nav>

        {/* Navigation Section 4: Roster & Access */}
        <div className="doctor-nav-section-title">Roster & Access</div>
        <nav className="doctor-nav">
          <button
            className={`doctor-nav-item ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => handleNavigate('availability')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Availability & Slots
          </button>

          <button
            className={`doctor-nav-item ${activeTab === 'patient_access' ? 'active' : ''}`}
            onClick={() => handleNavigate('patient_access')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Patient Access Log
          </button>
        </nav>

        {/* Navigation Section 5: Knowledge & Config */}
        <div className="doctor-nav-section-title">Knowledge & Settings</div>
        <nav className="doctor-nav">
          <button
            className={`doctor-nav-item ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => handleNavigate('knowledge')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Medical Knowledge
          </button>

          <button
            className={`doctor-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavigate('settings')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings & Profile
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="doctor-sidebar-footer">
          <div className="doctor-user-card">
            <div className="doctor-avatar-circle">
              {doctorProfile?.avatarInitials || 'RM'}
            </div>
            <div className="doctor-user-meta">
              <span className="doctor-user-name">{doctorProfile?.name || user?.name || 'Dr. Rahul Mehta'}</span>
              <span className="doctor-user-role">Orthopedic Specialist</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <button
              className="doctor-btn doctor-btn-outline doctor-btn-sm"
              style={{ fontSize: '11px', padding: '4px 6px' }}
              onClick={() => switchRole('DEPARTMENT_HEAD')}
              title="Switch to Department Head"
            >
              Dept Head
            </button>
            <button
              className="doctor-btn doctor-btn-outline doctor-btn-sm"
              style={{ fontSize: '11px', padding: '4px 6px' }}
              onClick={() => switchRole('HOSPITAL_ADMIN')}
              title="Switch to Hospital Admin"
            >
              Hosp Admin
            </button>
            <button
              className="doctor-btn doctor-btn-outline doctor-btn-sm"
              style={{ fontSize: '11px', padding: '4px 6px' }}
              onClick={() => switchRole('FAMILY')}
              title="Switch to Family Portal"
            >
              Family
            </button>
            <button
              className="doctor-btn doctor-btn-ghost doctor-btn-sm"
              style={{ fontSize: '11px', padding: '4px 6px', color: 'var(--doctor-coral)' }}
              onClick={logout}
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="doctor-main-wrapper">
        {/* Topbar */}
        <header className="doctor-topbar">
          <div className="doctor-topbar-left">
            <div>
              <h1 className="doctor-page-title">{tabTitles[activeTab]?.title || 'Doctor Workspace'}</h1>
              <div className="doctor-page-subtitle">{tabTitles[activeTab]?.sub}</div>
            </div>
          </div>

          <div className="doctor-topbar-right">
            <span className="doctor-badge-role">Doctor / Clinician</span>
            <button
              className="doctor-btn-icon"
              onClick={() => setDark(!dark)}
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              className="doctor-btn-icon"
              onClick={() => showToast('All appointment notifications synchronized', 'info')}
              title="Notifications"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m-6 0H9" />
              </svg>
              {notifications.some((n) => n.unread) && <span className="doctor-notification-dot" />}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="doctor-content">
          {activeTab === 'dashboard' && (
            <DashboardView
              doctorProfile={doctorProfile}
              patients={patients}
              appointments={appointments}
              consultations={consultations}
              onNavigate={handleNavigate}
              onSelectPatient={handleSelectPatient}
              onOpenNewConsultation={() => handleOpenNewConsultation()}
              onOpenNewPrescription={() => handleOpenNewPrescription()}
              onOpenAiExplain={handleOpenAiExplain}
            />
          )}

          {activeTab === 'patients' && (
            <PatientsView
              patients={patients}
              onSelectPatient={handleSelectPatient}
              onOpenNewConsultation={handleOpenNewConsultation}
            />
          )}

          {activeTab === 'patient_profile' && (
            <PatientProfileView
              patient={currentPatient}
              consultations={consultations}
              prescriptions={prescriptions}
              onBack={() => handleNavigate('patients')}
              onOpenNewConsultation={handleOpenNewConsultation}
              onOpenNewPrescription={handleOpenNewPrescription}
              onOpenAiExplain={handleOpenAiExplain}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsView
              appointments={appointments}
              onSelectPatient={handleSelectPatient}
              onOpenNewConsultation={handleOpenNewConsultation}
              onUpdateStatus={async (id, status) => {
                await doctorService.updateAppointmentStatus(id, status);
                const updated = await doctorService.getAppointments();
                setAppointments(updated);
                showToast(`Appointment status updated to ${status}`);
              }}
            />
          )}

          {activeTab === 'consultations' && (
            <ConsultationsView
              consultations={consultations}
              patients={patients}
              onOpenNewConsultation={handleOpenNewConsultation}
              onAmendConsultation={handleAmendConsultation}
            />
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionsView
              prescriptions={prescriptions}
              patients={patients}
              onOpenNewPrescription={handleOpenNewPrescription}
              onCorrectPrescription={handleCorrectPrescription}
            />
          )}

          {activeTab === 'ai_diagnostics' && (
            <AiDiagnosticView
              patients={patients}
              onOpenAiExplain={handleOpenAiExplain}
              onOpenNewConsultation={handleOpenNewConsultation}
            />
          )}

          {activeTab === 'availability' && (
            <AvailabilityView
              doctorProfile={doctorProfile}
              onSaveAvailability={handleSaveAvailability}
            />
          )}

          {activeTab === 'patient_access' && (
            <PatientAccessView accessHistory={accessHistory} />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeView
              articles={articles}
              onOpenCreateArticle={() => setIsCreateArticleOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              doctorProfile={doctorProfile}
              settings={settings}
              onSaveProfile={handleSaveProfile}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default DoctorLayout;
