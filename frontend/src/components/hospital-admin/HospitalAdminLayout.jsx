import { useState, useEffect, useTransition } from 'react';
import {
  HeartPulse,
  Building2,
  Layers,
  UserCheck,
  Stethoscope,
  Users,
  TrendingUp,
  BarChart3,
  Sparkles,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  Moon,
  Sun,
  Crown,
  UsersRound,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { hospitalAdminService } from '../../services/hospitalAdminService';
import {
  initialHospitalProfile,
  initialHospitalDepartments,
  initialDepartmentHeads,
  initialHospitalDoctors,
  initialAppointments,
  initialHospitalAnalytics,
  initialReports,
  initialKnowledgeActivity,
  initialAuditLogs,
  initialHospitalSettings,
} from '../../data/medimindData';
import './HospitalAdmin.css';

// Views
import { DashboardView } from './views/DashboardView';
import { HospitalProfileView } from './views/HospitalProfileView';
import { DepartmentsView } from './views/DepartmentsView';
import { DepartmentHeadsView } from './views/DepartmentHeadsView';
import { DepartmentHeadDetailsView } from './views/DepartmentHeadDetailsView';
import { DoctorsView } from './views/DoctorsView';
import { DoctorDetailsView } from './views/DoctorDetailsView';
import { StaffManagementView } from './views/StaffManagementView';
import { HospitalAnalyticsView } from './views/HospitalAnalyticsView';
import { DepartmentAnalyticsView } from './views/DepartmentAnalyticsView';
import { AiAnalyticsView } from './views/AiAnalyticsView';
import { ReportsView } from './views/ReportsView';
import { KnowledgeActivityView } from './views/KnowledgeActivityView';
import { SettingsView } from './views/SettingsView';

// Modals
import { EditHospitalModal } from './components/EditHospitalModal';
import { CreateDepartmentModal } from './components/CreateDepartmentModal';
import { EditDepartmentModal } from './components/EditDepartmentModal';
import { CreateDepartmentHeadModal } from './components/CreateDepartmentHeadModal';
import { GenerateReportModal } from './components/GenerateReportModal';
import { ConfirmationModal } from './components/ConfirmationModal';

const navItems = [
  ['Dashboard', 'Dashboard', Building2],
  ['Hospital Profile', 'Hospital Profile', Building2],
  ['Departments', 'Departments', Layers],
  ['Department Heads', 'Department Heads', UserCheck],
  ['Doctors', 'Doctors', Stethoscope],
  ['Staff Management', 'Staff Management', Users],
  ['Hospital Operational Analytics', 'Hospital Operational Analytics', TrendingUp],
  ['Department Comparative Analytics', 'Department Comparative Analytics', BarChart3],
  ['AI Analytics', 'AI Analytics', Sparkles],
  ['Reports', 'Reports', FileText],
  ['Knowledge Activity', 'Knowledge Activity', BookOpen],
  ['Settings', 'Settings', Settings],
];

const pageToHash = {
  'Dashboard': 'dashboard',
  'Hospital Profile': 'hospital-profile',
  'Departments': 'departments',
  'Department Heads': 'department-heads',
  'Department Head Details': 'department-head-details',
  'Doctors': 'doctors',
  'Doctor Details': 'doctor-details',
  'Staff Management': 'staff-management',
  'Hospital Operational Analytics': 'hospital-operational-analytics',
  'Department Comparative Analytics': 'department-comparative-analytics',
  'AI Analytics': 'ai-analytics',
  'Reports': 'reports',
  'Knowledge Activity': 'knowledge-activity',
  'Settings': 'settings',
  // Compatibility aliases
  'Hospital Analytics': 'hospital-operational-analytics',
  'Department Analytics': 'department-comparative-analytics',
  'Appointments': 'hospital-operational-analytics',
  'Schedules': 'dashboard',
};

const hashToPage = {
  'dashboard': 'Dashboard',
  'hospital-profile': 'Hospital Profile',
  'departments': 'Departments',
  'department-heads': 'Department Heads',
  'department-head-details': 'Department Head Details',
  'doctors': 'Doctors',
  'doctor-details': 'Doctor Details',
  'staff-management': 'Staff Management',
  'hospital-operational-analytics': 'Hospital Operational Analytics',
  'operational-analytics': 'Hospital Operational Analytics',
  'hospital-analytics': 'Hospital Operational Analytics',
  'department-comparative-analytics': 'Department Comparative Analytics',
  'department-analytics': 'Department Comparative Analytics',
  'ai-analytics': 'AI Analytics',
  'reports': 'Reports',
  'knowledge-activity': 'Knowledge Activity',
  'settings': 'Settings',
  'appointments': 'Hospital Operational Analytics',
  'schedules': 'Dashboard',
};

const getInitialPage = () => {
  if (typeof window === 'undefined') return 'Dashboard';
  const hash = window.location.hash.replace('#', '').trim();
  if (hash && hashToPage[hash]) return hashToPage[hash];
  const saved = sessionStorage.getItem('medimind_ha_tab');
  if (saved && pageToHash[saved]) return saved;
  return 'Dashboard';
};

const getInitialHeadId = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('medimind_ha_head_id') || null;
};

const getInitialDoctorId = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('medimind_ha_doc_id') || null;
};

export function HospitalAdminLayout({ dark, setDark }) {
  const { user, logout, switchRole } = useAuth();
  const [, startTransition] = useTransition();

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [toast, setToast] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected Detail States
  const [selectedHeadId, setSelectedHeadId] = useState(getInitialHeadId);
  const [selectedDoctorId, setSelectedDoctorId] = useState(getInitialDoctorId);

  // Synchronize state with sessionStorage and URL hash
  useEffect(() => {
    sessionStorage.setItem('medimind_ha_tab', currentPage);
    if (selectedHeadId) {
      sessionStorage.setItem('medimind_ha_head_id', selectedHeadId);
    } else {
      sessionStorage.removeItem('medimind_ha_head_id');
    }
    if (selectedDoctorId) {
      sessionStorage.setItem('medimind_ha_doc_id', selectedDoctorId);
    } else {
      sessionStorage.removeItem('medimind_ha_doc_id');
    }

    const targetHash = pageToHash[currentPage] || 'dashboard';
    if (window.location.hash !== `#${targetHash}`) {
      window.history.replaceState(null, '', `#${targetHash}`);
    }
  }, [currentPage, selectedHeadId, selectedDoctorId]);

  // Handle browser Back / Forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && hashToPage[hash]) {
        setCurrentPage(hashToPage[hash]);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Active Modals
  const [showEditHospitalModal, setShowEditHospitalModal] = useState(false);
  const [showCreateDeptModal, setShowCreateDeptModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [selectedEditDept, setSelectedEditDept] = useState(null);
  const [showCreateHeadModal, setShowCreateHeadModal] = useState(false);
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  // Data States
  const [hospital, setHospital] = useState(initialHospitalProfile);
  const [departments, setDepartments] = useState(initialHospitalDepartments);
  const [departmentHeads, setDepartmentHeads] = useState(initialDepartmentHeads);
  const [doctors, setDoctors] = useState(initialHospitalDoctors);
  const [appointments] = useState(initialAppointments);
  const [analytics] = useState(initialHospitalAnalytics);
  const [reports, setReports] = useState(initialReports);
  const [knowledge] = useState(initialKnowledgeActivity);
  const [auditLogs] = useState(initialAuditLogs);
  const [hospitalSettings, setHospitalSettings] = useState(initialHospitalSettings);

  const announce = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const navigate = (page) => {
    startTransition(() => {
      setCurrentPage(page);
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const selectedHead = departmentHeads.find(h => h.id === selectedHeadId) || departmentHeads[0];
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // --- Handlers ---
  const handleSaveHospitalProfile = async (updatedData) => {
    const updated = await hospitalAdminService.updateHospitalProfile(updatedData);
    setHospital(updated);
    setShowEditHospitalModal(false);
    announce('Hospital profile updated successfully.');
  };

  const handleCreateDepartment = async (deptData) => {
    await hospitalAdminService.createDepartment(deptData);
    const updatedDepts = await hospitalAdminService.getDepartments();
    setDepartments(updatedDepts);
    setShowCreateDeptModal(false);
    announce(`Created department: ${deptData.name}`);
  };

  const handleEditDepartment = async (deptId, updatedData) => {
    const updated = await hospitalAdminService.updateDepartment(deptId, updatedData);
    const updatedDepts = await hospitalAdminService.getDepartments();
    setDepartments(updatedDepts);
    setShowEditDeptModal(false);
    setSelectedEditDept(null);
    announce(`Updated department: ${updated.name}`);
  };

  const handleToggleDepartmentStatus = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;

    setConfirmModal({
      title: `${dept.status === 'Active' ? 'Deactivate' : 'Activate'} Department`,
      message: `Are you sure you want to ${dept.status === 'Active' ? 'deactivate' : 'activate'} the ${dept.name} department?`,
      confirmText: dept.status === 'Active' ? 'Deactivate' : 'Activate',
      isDestructive: dept.status === 'Active',
      onConfirm: async () => {
        await hospitalAdminService.toggleDepartmentStatus(deptId);
        const updatedDepts = await hospitalAdminService.getDepartments();
        setDepartments(updatedDepts);
        setConfirmModal(null);
        announce(`Updated department status for ${dept.name}`);
      },
    });
  };

  const handleCreateDepartmentHead = async (headData) => {
    await hospitalAdminService.createDepartmentHead(headData);
    const [updatedHeads, updatedDepts] = await Promise.all([
      hospitalAdminService.getDepartmentHeads(),
      hospitalAdminService.getDepartments(),
    ]);
    setDepartmentHeads(updatedHeads);
    setDepartments(updatedDepts);
    setShowCreateHeadModal(false);
    announce(`Provisioned Department Head account for ${headData.name}`);
  };

  const handleToggleHeadStatus = (headId) => {
    const head = departmentHeads.find((h) => h.id === headId);
    if (!head) return;

    setConfirmModal({
      title: `${head.status === 'Active' ? 'Suspend' : 'Activate'} Department Head`,
      message: `Are you sure you want to ${head.status === 'Active' ? 'suspend' : 'activate'} ${head.name}'s administrator access?`,
      confirmText: head.status === 'Active' ? 'Suspend Account' : 'Activate Account',
      isDestructive: head.status === 'Active',
      onConfirm: async () => {
        await hospitalAdminService.toggleDepartmentHeadStatus(headId);
        const updatedHeads = await hospitalAdminService.getDepartmentHeads();
        setDepartmentHeads(updatedHeads);
        setConfirmModal(null);
        announce(`Updated account status for ${head.name}`);
      },
    });
  };

  const handleToggleDoctorStatus = (doctorId) => {
    const doc = doctors.find((d) => d.id === doctorId);
    if (!doc) return;

    setConfirmModal({
      title: `${doc.status === 'Active' ? 'Suspend' : 'Activate'} Doctor Account`,
      message: `Are you sure you want to ${doc.status === 'Active' ? 'suspend' : 'activate'} clinical privileges for ${doc.name}?`,
      confirmText: doc.status === 'Active' ? 'Suspend' : 'Activate',
      isDestructive: doc.status === 'Active',
      onConfirm: async () => {
        await hospitalAdminService.toggleDoctorStatus(doctorId);
        const updatedDocs = await hospitalAdminService.getDoctors();
        setDoctors(updatedDocs);
        setConfirmModal(null);
        announce(`Updated clinical privileges for ${doc.name}`);
      },
    });
  };

  const handleGenerateReport = async (reportConfig) => {
    const newRep = await hospitalAdminService.generateReport(reportConfig);
    const updatedReports = await hospitalAdminService.getReports();
    setReports(updatedReports);
    setShowGenerateReportModal(false);
    announce(`Generated report: ${newRep.title}`);
  };

  const handleDownloadReport = (report) => {
    const content = `MEDIMIND CENTRAL HOSPITAL - FORMAL REPORT\n\nTitle: ${report.title}\nCategory: ${report.category}\nPeriod: ${report.period}\nGenerated At: ${report.generatedAt}\nGenerated By: ${report.generatedBy}\n\nSummary:\n${report.summary}\n\n[CONFIDENTIAL HEALTHCARE ADMINISTRATIVE REPORT - NABH / JCI COMPLIANT]`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    announce('Report downloaded successfully.');
  };

  const handleSaveSettings = async (newSettings) => {
    const updated = await hospitalAdminService.updateHospitalSettings(newSettings);
    setHospitalSettings(updated);
  };

  if (!hospital) {
    return (
      <div className={`ha-shell ${dark ? 'dark-theme' : ''}`} style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="auth-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--ha-text-muted)', fontSize: '13px' }}>Loading MediMind Hospital Administration Workspace...</p>
        </div>
      </div>
    );
  }

  // --- View Renderer ---
  const renderView = () => {
    if (currentPage === 'Dashboard') {
      return (
        <DashboardView
          hospital={hospital}
          departments={departments}
          departmentHeads={departmentHeads}
          doctors={doctors}
          appointments={appointments}
          analytics={analytics}
          auditLogs={auditLogs}
          navigate={navigate}
          onOpenCreateHead={() => setShowCreateHeadModal(true)}
          onOpenEditHospital={() => setShowEditHospitalModal(true)}
        />
      );
    }
    if (currentPage === 'Hospital Profile') {
      return (
        <HospitalProfileView
          hospital={hospital}
          onEdit={() => setShowEditHospitalModal(true)}
        />
      );
    }
    if (currentPage === 'Departments') {
      return (
        <DepartmentsView
          departments={departments}
          onOpenCreateDept={() => setShowCreateDeptModal(true)}
          onOpenEditDept={(dept) => {
            setSelectedEditDept(dept);
            setShowEditDeptModal(true);
          }}
          onToggleStatus={handleToggleDepartmentStatus}
          navigate={navigate}
        />
      );
    }
    if (currentPage === 'Department Heads') {
      return (
        <DepartmentHeadsView
          departmentHeads={departmentHeads}
          onOpenCreateHead={() => setShowCreateHeadModal(true)}
          onToggleStatus={handleToggleHeadStatus}
          onSelectHead={(head) => {
            setSelectedHeadId(head.id);
            navigate('Department Head Details');
          }}
        />
      );
    }
    if (currentPage === 'Department Head Details') {
      return (
        <DepartmentHeadDetailsView
          head={selectedHead}
          onBack={() => navigate('Department Heads')}
          onToggleStatus={handleToggleHeadStatus}
        />
      );
    }
    if (currentPage === 'Doctors') {
      return (
        <DoctorsView
          doctors={doctors}
          departments={departments}
          onSelectDoctor={(doc) => {
            setSelectedDoctorId(doc.id);
            navigate('Doctor Details');
          }}
          onToggleStatus={handleToggleDoctorStatus}
        />
      );
    }
    if (currentPage === 'Doctor Details') {
      return (
        <DoctorDetailsView
          doctor={selectedDoctor}
          onBack={() => navigate('Doctors')}
          onToggleStatus={handleToggleDoctorStatus}
        />
      );
    }
    if (currentPage === 'Staff Management') {
      return (
        <StaffManagementView
          departmentHeads={departmentHeads}
          doctors={doctors}
          departments={departments}
          onToggleHeadStatus={handleToggleHeadStatus}
          onToggleDoctorStatus={handleToggleDoctorStatus}
          onSelectHead={(head) => {
            setSelectedHeadId(head.id);
            navigate('Department Head Details');
          }}
          onSelectDoctor={(doc) => {
            setSelectedDoctorId(doc.id);
            navigate('Doctor Details');
          }}
          onOpenCreateHead={() => setShowCreateHeadModal(true)}
        />
      );
    }
    if (currentPage === 'Hospital Operational Analytics' || currentPage === 'Hospital Analytics' || currentPage === 'Appointments') {
      return (
        <HospitalAnalyticsView
          analytics={analytics}
          hospital={hospital}
        />
      );
    }
    if (currentPage === 'Department Comparative Analytics' || currentPage === 'Department Analytics') {
      return (
        <DepartmentAnalyticsView
          analytics={analytics}
        />
      );
    }
    if (currentPage === 'AI Analytics') {
      return (
        <AiAnalyticsView
          analytics={analytics}
        />
      );
    }
    if (currentPage === 'Reports') {
      return (
        <ReportsView
          reports={reports}
          onOpenGenerateReport={() => setShowGenerateReportModal(true)}
          onDownloadReport={handleDownloadReport}
        />
      );
    }
    if (currentPage === 'Knowledge Activity') {
      return (
        <KnowledgeActivityView
          knowledge={knowledge}
        />
      );
    }
    if (currentPage === 'Settings') {
      return (
        <SettingsView
          settings={hospitalSettings}
          onSaveSettings={handleSaveSettings}
          dark={dark}
          setDark={setDark}
          logout={logout}
          announce={announce}
        />
      );
    }

    return null;
  };

  return (
    <div className={`ha-shell ${dark ? 'dark-theme' : ''}`}>
      {/* Mobile Backdrop */}
      <div
        className={`ha-sidebar-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`ha-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="ha-brand">
            <div className="ha-brand-mark">
              <HeartPulse size={20} />
            </div>
            <span>Medi<span>Mind</span></span>
          </div>
          {mobileMenuOpen && (
            <button
              className="ha-icon-btn"
              onClick={() => setMobileMenuOpen(false)}
              style={{ border: 0, marginRight: '8px' }}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Hospital Indicator Badge */}
        <div className="ha-hospital-badge">
          <div className="ha-badge-icon">🏥</div>
          <div className="ha-badge-text">
            <strong>{hospital.name}</strong>
            <span>Hospital Admin</span>
          </div>
        </div>

        <div className="ha-nav-section-title">Clinical & Operations</div>
        {navItems.slice(0, 6).map(([label, pageId, Icon]) => (
          <button
            key={pageId}
            className={`ha-nav-item ${currentPage === pageId ? 'active' : ''}`}
            onClick={() => navigate(pageId)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}

        <div className="ha-nav-section-title">Analytics & Intelligence</div>
        {navItems.slice(6, 9).map(([label, pageId, Icon]) => (
          <button
            key={pageId}
            className={`ha-nav-item ${currentPage === pageId ? 'active' : ''}`}
            onClick={() => navigate(pageId)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}

        <div className="ha-nav-section-title">Governance & Administration</div>
        {navItems.slice(9).map(([label, pageId, Icon]) => (
          <button
            key={pageId}
            className={`ha-nav-item ${currentPage === pageId ? 'active' : ''}`}
            onClick={() => navigate(pageId)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}

        {/* Sidebar Footer & Quick Role Switches */}
        <div className="ha-sidebar-footer">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <button
              className="ha-nav-item"
              style={{ padding: '6px 8px', fontSize: '11px', color: '#0f766e', backgroundColor: '#f0fdfa', borderRadius: '6px' }}
              onClick={() => switchRole('DOCTOR')}
              title="Switch to Doctor"
            >
              <Stethoscope size={14} />
              <span>Doctor</span>
            </button>

            <button
              className="ha-nav-item"
              style={{ padding: '6px 8px', fontSize: '11px', color: '#7c3aed', backgroundColor: '#f5f3ff', borderRadius: '6px' }}
              onClick={() => switchRole('DEPARTMENT_HEAD')}
              title="Switch to Department Head"
            >
              <UserCheck size={14} />
              <span>Dept Head</span>
            </button>

            <button
              className="ha-nav-item"
              style={{ padding: '6px 8px', fontSize: '11px', color: '#4338ca', backgroundColor: '#eef2ff', borderRadius: '6px' }}
              onClick={() => switchRole('CHAIRMAN')}
              title="Switch to Chairman"
            >
              <Crown size={14} />
              <span>Chairman</span>
            </button>

            <button
              className="ha-nav-item"
              style={{ padding: '6px 8px', fontSize: '11px', color: '#2563eb', backgroundColor: '#eff6ff', borderRadius: '6px' }}
              onClick={() => switchRole('FAMILY')}
              title="Switch to Family Portal"
            >
              <UsersRound size={14} />
              <span>Family</span>
            </button>
          </div>

          <button
            className="ha-nav-item"
            style={{ color: 'var(--ha-error)', marginTop: '6px' }}
            onClick={logout}
          >
            <LogOut size={17} />
            <span>Sign Out ({user?.name ? user.name.split(' ')[0] : 'Admin'})</span>
          </button>

          <div className="ha-security-pill">
            <ShieldCheck size={16} />
            <span>Hospital Administration</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ha-main-content">
        <header className="ha-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="ha-icon-btn mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={18} />
            </button>
            <div className="ha-breadcrumbs">
              <span>{hospital.name}</span>
              <ChevronRight size={14} />
              <strong>{currentPage}</strong>
            </div>
          </div>

          <div className="ha-top-actions">
            <button
              className="ha-icon-btn"
              onClick={() => setDark(!dark)}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <div className="ha-user-profile-btn" onClick={() => navigate('Settings')}>
              <div className="ha-avatar">
                {user?.avatarInitials || 'RS'}
              </div>
              <div className="ha-user-info">
                <strong>{user?.name || 'Dr. Rajesh Sharma'}</strong>
                <span>{user?.title || 'Hospital Administrator'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="ha-page-content">
          {renderView()}
        </main>
      </div>

      {/* Modals */}
      {showEditHospitalModal && (
        <EditHospitalModal
          hospital={hospital}
          onClose={() => setShowEditHospitalModal(false)}
          onSave={handleSaveHospitalProfile}
        />
      )}

      {showCreateDeptModal && (
        <CreateDepartmentModal
          onClose={() => setShowCreateDeptModal(false)}
          onSave={handleCreateDepartment}
        />
      )}

      {showEditDeptModal && selectedEditDept && (
        <EditDepartmentModal
          department={selectedEditDept}
          departmentHeads={departmentHeads}
          onClose={() => {
            setShowEditDeptModal(false);
            setSelectedEditDept(null);
          }}
          onSave={handleEditDepartment}
        />
      )}

      {showCreateHeadModal && (
        <CreateDepartmentHeadModal
          departments={departments}
          onClose={() => setShowCreateHeadModal(false)}
          onSave={handleCreateDepartmentHead}
        />
      )}

      {showGenerateReportModal && (
        <GenerateReportModal
          onClose={() => setShowGenerateReportModal(false)}
          onGenerate={handleGenerateReport}
        />
      )}

      {confirmModal && (
        <ConfirmationModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          isDestructive={confirmModal.isDestructive}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
        />
      )}

      {/* Toast Announcement */}
      {toast && (
        <div className="ha-toast">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

