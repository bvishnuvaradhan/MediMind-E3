import React, { useState, useEffect, useTransition } from 'react';
import './DepartmentHead.css';
import { departmentHeadService } from '../../services/departmentHeadService';
import { useAuth } from '../../context/useAuth';

// Views
import DashboardView from './views/DashboardView';
import DoctorsView from './views/DoctorsView';
import DoctorDetailsView from './views/DoctorDetailsView';
import SchedulesView from './views/SchedulesView';
import AppointmentsView from './views/AppointmentsView';
import WorkloadView from './views/WorkloadView';
import DepartmentAnalyticsView from './views/DepartmentAnalyticsView';
import AiAnalyticsView from './views/AiAnalyticsView';
import DoctorPerformanceView from './views/DoctorPerformanceView';
import KnowledgeView from './views/KnowledgeView';
import SettingsView from './views/SettingsView';

// Modals
import CreateDoctorModal from './components/CreateDoctorModal';
import EditDoctorModal from './components/EditDoctorModal';
import CreateArticleModal from './components/CreateArticleModal';
import ConfirmationModal from './components/ConfirmationModal';

export function DepartmentHeadLayout({ dark, setDark }) {
  const { user, logout, switchRole } = useAuth();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  // Data states
  const [profile, setProfile] = useState(null);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [articles, setArticles] = useState([]);
  const [settings, setSettings] = useState(null);

  // UI states
  const [toast, setToast] = useState(null);
  const [isCreateDoctorOpen, setIsCreateDoctorOpen] = useState(false);
  const [isEditDoctorOpen, setIsEditDoctorOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [isCreateArticleOpen, setIsCreateArticleOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [
        prof,
        dept,
        docs,
        apts,
        schs,
        anlyt,
        perf,
        arts,
        stt,
      ] = await Promise.all([
        departmentHeadService.getProfile(),
        departmentHeadService.getDepartmentInfo(),
        departmentHeadService.getDoctors(),
        departmentHeadService.getAppointments(),
        departmentHeadService.getSchedules(),
        departmentHeadService.getAnalytics(),
        departmentHeadService.getDoctorPerformance(),
        departmentHeadService.getArticles(),
        departmentHeadService.getSettings(),
      ]);

      setProfile(prof);
      setDepartmentInfo(dept);
      setDoctors(docs);
      setAppointments(apts);
      setSchedules(schs);
      setAnalytics(anlyt);
      setPerformance(perf);
      setArticles(arts);
      setSettings(stt);
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
      if (tab !== 'doctor_details') {
        setSelectedDoctorId(null);
      }
    });
  };

  const handleSelectDoctor = (docId) => {
    setSelectedDoctorId(docId);
    handleNavigate('doctor_details');
  };

  // CRUD handlers
  const handleCreateDoctor = async (doctorData) => {
    const newDoc = await departmentHeadService.createDoctor(doctorData);
    setDoctors((prev) => [newDoc, ...prev]);
    showToast(`Doctor account created for ${newDoc.name}`);
  };

  const handleUpdateDoctor = async (docId, updatedData) => {
    const updated = await departmentHeadService.updateDoctor(docId, updatedData);
    setDoctors((prev) => prev.map((d) => (d.id === docId ? updated : d)));
    showToast(`Updated profile for ${updated.name}`);
  };

  const handleToggleDoctorStatus = async (docId, newStatus) => {
    const updated = await departmentHeadService.updateDoctorStatus(docId, newStatus);
    setDoctors((prev) => prev.map((d) => (d.id === docId ? updated : d)));
    showToast(`Doctor status updated to ${newStatus}`);
  };

  const handleUpdateDoctorCapacity = async (docId, newCapacity) => {
    const updated = await departmentHeadService.updateDoctorCapacity(docId, newCapacity);
    setDoctors((prev) => prev.map((d) => (d.id === docId ? updated : d)));
    showToast(`Consultation capacity updated for ${updated.name}`);
  };

  const handleUpdateScheduleStatus = async (scheduleId, newStatus) => {
    const updated = await departmentHeadService.updateScheduleStatus(scheduleId, newStatus);
    setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? updated : s)));
    showToast('Shift roster status updated');
  };

  const handleUpdateAppointmentStatus = async (aptId, newStatus) => {
    const updated = await departmentHeadService.updateAppointmentStatus(aptId, newStatus);
    setAppointments((prev) => prev.map((a) => (a.id === aptId ? updated : a)));
    showToast(`Appointment marked as ${newStatus}`);
  };

  const handleCreateArticle = async (articleData) => {
    const newArt = await departmentHeadService.createArticle(articleData);
    setArticles((prev) => [newArt, ...prev]);
    showToast(`Published guideline: "${newArt.title}"`);
  };

  const handleSaveProfile = async (profileData) => {
    const updated = await departmentHeadService.updateProfile(profileData);
    setProfile(updated);
    showToast('Department Head profile updated successfully');
  };

  const handleSaveSettings = async (settingsData) => {
    const updated = await departmentHeadService.updateSettings(settingsData);
    setSettings(updated);
    showToast('Department operational settings saved');
  };

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Tab Titles
  const tabTitles = {
    dashboard: { title: 'Orthopedics Department Hub', sub: 'Overview, today’s roster, active caseload & AI diagnostics' },
    doctors: { title: 'Department Faculty & Doctors', sub: 'Provision and manage department clinical staff' },
    doctor_details: { title: currentDoctor ? currentDoctor.name : 'Doctor Profile', sub: 'Clinical credentials & assigned schedule' },
    schedules: { title: 'Duty Rosters & Room Allocations', sub: 'OPD shifts & 24/7 trauma emergency coverage' },
    appointments: { title: 'Department OPD Appointments', sub: 'Operational slot and patient triage coordination' },
    workload: { title: 'Workload & Capacity Management', sub: 'Caseload utilization & capacity rebalancing' },
    analytics: { title: 'Department Operational Analytics', sub: 'Outpatient volume trends & ward bed occupancy' },
    ai_analytics: { title: 'AI Fracture Detection Telemetry', sub: 'Aggregate diagnostic accuracy & classification' },
    performance: { title: 'Doctor Quality Benchmarking', sub: 'Patient satisfaction, on-time rates & peer rankings' },
    knowledge: { title: 'Clinical Protocols & Guidelines', sub: 'Department standardized clinical knowledge base' },
    settings: { title: 'Department Settings & Profile', sub: 'Clinical head profile & notification protocols' },
  };

  return (
    <div className={`dh-shell ${dark ? 'dark-theme' : ''}`}>
      {/* Toast */}
      {toast && (
        <div className={`dh-toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : 'ℹ'}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      {/* Create Doctor Modal */}
      <CreateDoctorModal
        isOpen={isCreateDoctorOpen}
        onClose={() => setIsCreateDoctorOpen(false)}
        onSave={handleCreateDoctor}
        departmentName={departmentInfo?.name || 'Orthopedics'}
        hospitalName={departmentInfo?.hospital || 'MediMind Central Hospital'}
      />

      {/* Edit Doctor Modal */}
      <EditDoctorModal
        isOpen={isEditDoctorOpen}
        onClose={() => {
          setIsEditDoctorOpen(false);
          setEditingDoctor(null);
        }}
        onSave={handleUpdateDoctor}
        doctor={editingDoctor}
      />

      {/* Create Article Modal */}
      <CreateArticleModal
        isOpen={isCreateArticleOpen}
        onClose={() => setIsCreateArticleOpen(false)}
        onSave={handleCreateArticle}
        authorName={profile?.name || 'Dr. Priya Sharma'}
      />

      {/* Sidebar */}
      <aside className="dh-sidebar">
        <div className="dh-brand">
          <div className="dh-brand-mark">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span>Medi<span>Mind</span></span>
        </div>

        {/* Department Info Badge */}
        <div className="dh-department-badge">
          <div className="dh-badge-icon">
            <span>🦴</span>
          </div>
          <div className="dh-badge-text">
            <span className="dh-badge-dept">{departmentInfo?.name || 'Orthopedics'}</span>
            <span className="dh-badge-hosp">{departmentInfo?.hospital || 'Central Hospital'}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="dh-nav-group-title">Overview</div>
        <nav className="dh-nav">
          <button
            className={`dh-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </button>
        </nav>

        <div className="dh-nav-group-title">Clinical Workforce</div>
        <nav className="dh-nav">
          <button
            className={`dh-nav-item ${activeTab === 'doctors' || activeTab === 'doctor_details' ? 'active' : ''}`}
            onClick={() => handleNavigate('doctors')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Faculty Doctors
          </button>

          <button
            className={`dh-nav-item ${activeTab === 'schedules' ? 'active' : ''}`}
            onClick={() => handleNavigate('schedules')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Duty Rosters & Shifts
          </button>

          <button
            className={`dh-nav-item ${activeTab === 'workload' ? 'active' : ''}`}
            onClick={() => handleNavigate('workload')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Workload & Capacity
          </button>

          <button
            className={`dh-nav-item ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => handleNavigate('performance')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Quality & Benchmarking
          </button>
        </nav>

        <div className="dh-nav-group-title">Operations & AI</div>
        <nav className="dh-nav">
          <button
            className={`dh-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => handleNavigate('appointments')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            OPD Appointments
          </button>

          <button
            className={`dh-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => handleNavigate('analytics')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Department Analytics
          </button>

          <button
            className={`dh-nav-item ${activeTab === 'ai_analytics' ? 'active' : ''}`}
            onClick={() => handleNavigate('ai_analytics')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Fracture Diagnostics
          </button>
        </nav>

        <div className="dh-nav-group-title">Knowledge & Config</div>
        <nav className="dh-nav">
          <button
            className={`dh-nav-item ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => handleNavigate('knowledge')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Clinical Guidelines
          </button>

          <button
            className={`dh-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
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
        <div className="dh-sidebar-footer">
          <div className="dh-user-card">
            <div className="dh-avatar-circle">
              {profile?.avatarInitials || 'PS'}
            </div>
            <div className="dh-user-meta">
              <span className="dh-user-name">{profile?.name || user?.name || 'Dr. Priya Sharma'}</span>
              <span className="dh-user-role">Head of Orthopedics</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="dh-btn dh-btn-outline dh-btn-sm"
              style={{ flex: 1, fontSize: '11.5px' }}
              onClick={() => switchRole('HOSPITAL_ADMIN')}
              title="Switch to Hospital Admin"
            >
              Hosp Admin
            </button>
            <button
              className="dh-btn dh-btn-outline dh-btn-sm"
              style={{ flex: 1, fontSize: '11.5px' }}
              onClick={() => switchRole('CHAIRMAN')}
              title="Switch to Chairman"
            >
              Chairman
            </button>
            <button
              className="dh-btn dh-btn-ghost dh-btn-sm"
              onClick={logout}
              title="Sign Out"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dh-main-wrapper">
        {/* Topbar */}
        <header className="dh-topbar">
          <div className="dh-topbar-left">
            <div>
              <h1 className="dh-page-title">{tabTitles[activeTab]?.title || 'Department Head Workspace'}</h1>
              <div className="dh-page-subtitle">{tabTitles[activeTab]?.sub}</div>
            </div>
          </div>

          <div className="dh-topbar-right">
            <span className="dh-badge-role">Department Head</span>
            <button
              className="dh-btn-icon"
              onClick={() => setDark(!dark)}
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              className="dh-btn-icon"
              onClick={() => showToast('No unread department alerts', 'info')}
              title="Notifications"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m-6 0H9" />
              </svg>
              <span className="dh-notification-dot" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="dh-content">
          {activeTab === 'dashboard' && (
            <DashboardView
              departmentInfo={departmentInfo}
              doctors={doctors}
              appointments={appointments}
              analytics={analytics}
              onNavigate={handleNavigate}
              onOpenCreateDoctor={() => setIsCreateDoctorOpen(true)}
              onOpenCreateArticle={() => setIsCreateArticleOpen(true)}
            />
          )}

          {activeTab === 'doctors' && (
            <DoctorsView
              doctors={doctors}
              onSelectDoctor={handleSelectDoctor}
              onOpenCreateDoctor={() => setIsCreateDoctorOpen(true)}
              onOpenEditDoctor={(doc) => {
                setEditingDoctor(doc);
                setIsEditDoctorOpen(true);
              }}
              onToggleStatus={handleToggleDoctorStatus}
            />
          )}

          {activeTab === 'doctor_details' && (
            <DoctorDetailsView
              doctor={currentDoctor}
              appointments={appointments}
              onBack={() => handleNavigate('doctors')}
              onOpenEditDoctor={(doc) => {
                setEditingDoctor(doc);
                setIsEditDoctorOpen(true);
              }}
              onToggleStatus={handleToggleDoctorStatus}
            />
          )}

          {activeTab === 'schedules' && (
            <SchedulesView
              schedules={schedules}
              doctors={doctors}
              onUpdateScheduleStatus={handleUpdateScheduleStatus}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsView
              appointments={appointments}
              doctors={doctors}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            />
          )}

          {activeTab === 'workload' && (
            <WorkloadView
              doctors={doctors}
              onUpdateDoctorCapacity={handleUpdateDoctorCapacity}
            />
          )}

          {activeTab === 'analytics' && (
            <DepartmentAnalyticsView
              analytics={analytics}
              departmentInfo={departmentInfo}
            />
          )}

          {activeTab === 'ai_analytics' && (
            <AiAnalyticsView analytics={analytics} />
          )}

          {activeTab === 'performance' && (
            <DoctorPerformanceView
              performanceData={performance}
              doctors={doctors}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeView
              articles={articles}
              onOpenCreateArticle={() => setIsCreateArticleOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              profile={profile}
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

export default DepartmentHeadLayout;
