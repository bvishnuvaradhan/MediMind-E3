// MediMind Platform - Chairman & Platform Owner Portal Layout
// Strictly follows locked specifications in PLATFORM OWNER.txt, permission matrix.txt, and Frontend_Designs_and_Colors.txt

import { useState } from 'react';
import {
  HeartPulse,
  LayoutDashboard,
  Building2,
  UserCheck,
  Layers,
  Stethoscope,
  UsersRound,
  CalendarDays,
  Sparkles,
  TrendingUp,
  BarChart3,
  Award,
  FileText,
  BookOpen,
  Activity,
  Settings,
  ChevronRight,
  ChevronDown,
  Menu,
  Sun,
  Moon,
  Bell,
  LogOut,
  ShieldCheck,
  Crown,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import './Chairman.css';

// Import all Chairman Views
import { PlatformDashboard } from './views/PlatformDashboard';
import { HospitalsView } from './views/HospitalsView';
import { HospitalAdminsView } from './views/HospitalAdminsView';
import { DepartmentsView } from './views/DepartmentsView';
import { DoctorsView } from './views/DoctorsView';
import { FamilyAccountsView } from './views/FamilyAccountsView';
import { AppointmentsView } from './views/AppointmentsView';
import { AiAnalyticsView } from './views/AiAnalyticsView';
import { PlatformAnalyticsView } from './views/PlatformAnalyticsView';
import { HospitalPerformanceView } from './views/HospitalPerformanceView';
import { DepartmentPerformanceView } from './views/DepartmentPerformanceView';
import { ReportsView } from './views/ReportsView';
import { KnowledgeActivityView } from './views/KnowledgeActivityView';
import { AuditLogsView } from './views/AuditLogsView';
import { SettingsView } from './views/SettingsView';

export function ChairmanLayout({ dark, setDark }) {
  const { user, logout, switchRole } = useAuth();
  const [currentPage, setCurrentPage] = useState('Platform Dashboard');
  const [viewParams, setViewParams] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState('');

  const announce = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const navigateTo = (pageName, params = {}) => {
    setCurrentPage(pageName);
    setViewParams(params);
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navGroups = [
    {
      group: 'Overview',
      items: [
        { label: 'Platform Dashboard', icon: LayoutDashboard },
        { label: 'Platform Analytics', icon: TrendingUp },
      ],
    },
    {
      group: 'Network & Workforce',
      items: [
        { label: 'Hospitals', icon: Building2, badge: 2 },
        { label: 'Hospital Admins', icon: UserCheck },
        { label: 'Departments', icon: Layers },
        { label: 'Doctors', icon: Stethoscope },
      ],
    },
    {
      group: 'Platform Users',
      items: [
        { label: 'Family Accounts', icon: UsersRound },
        { label: 'Appointments', icon: CalendarDays },
      ],
    },
    {
      group: 'Clinical AI & Knowledge',
      items: [
        { label: 'AI Analytics', icon: Sparkles },
        { label: 'Knowledge Activity', icon: BookOpen },
      ],
    },
    {
      group: 'Performance & Audit',
      items: [
        { label: 'Hospital Performance', icon: Award },
        { label: 'Department Performance', icon: BarChart3 },
        { label: 'Reports', icon: FileText },
        { label: 'Audit Logs', icon: Activity },
      ],
    },
    {
      group: 'Governance',
      items: [{ label: 'Settings', icon: Settings }],
    },
  ];

  return (
    <div className={`chairman-shell ${dark ? 'dark-theme' : ''}`}>
      {/* Sidebar Navigation */}
      <aside className={`chairman-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="chairman-brand">
          <div className="chairman-brand-mark">
            <HeartPulse size={22} />
          </div>
          <div className="chairman-brand-text">
            <span>
              Medi<b>Mind</b>
            </span>
            <div className="chairman-badge">
              <Crown size={11} />
              <span>Chairman Portal</span>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="chairman-user-card">
          <div className="chairman-avatar">SM</div>
          <div className="chairman-user-copy">
            <strong>{user?.name || 'Dr. Suresh Menon'}</strong>
            <span>Platform Owner</span>
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav style={{ flex: 1 }}>
          {navGroups.map((g) => (
            <div key={g.group} className="chairman-nav-group">
              <div className="chairman-nav-title">{g.group}</div>
              {g.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.label;
                return (
                  <button
                    key={item.label}
                    className={`chairman-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => navigateTo(item.label)}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                    {item.badge && !isActive && <span className="nav-count-badge">{item.badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Sidebar Action */}
        <div className="chairman-sidebar-footer">
          <button
            className="user-menu-item danger"
            onClick={() => logout()}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="chairman-main">
        {/* Topbar */}
        <header className="chairman-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              className="mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>

            <div className="chairman-breadcrumbs">
              <span>MediMind Platform</span>
              <ChevronRight size={14} />
              <strong>{currentPage}</strong>
            </div>
          </div>

          <div className="chairman-top-actions">
            {/* Notification Center */}
            <div style={{ position: 'relative' }}>
              <button
                className="icon-button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Platform alerts"
              >
                <Bell size={18} />
                <span className="notification-dot" />
              </button>

              {notificationsOpen && (
                <div className="chairman-popover">
                  <div className="popover-title-row">
                    <strong>Platform Alerts</strong>
                    <button
                      className="text-button"
                      style={{ fontSize: '11px' }}
                      onClick={() => setNotificationsOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                  <div className="notification-item">
                    <div className="notification-icon warning">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="notification-copy">
                      <strong>Apex Metro Healthcare</strong>
                      <span>Hospital onboarding application submitted for review</span>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-icon success">
                      <ShieldCheck size={16} />
                    </div>
                    <div className="notification-copy">
                      <strong>Security Backup Complete</strong>
                      <span>All 5 microservice databases archived & verified</span>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-icon info">
                      <Sparkles size={16} />
                    </div>
                    <div className="notification-copy">
                      <strong>AI Diagnostic Milestone</strong>
                      <span>Fracture CNN passed 95% validation confidence floor</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              className="icon-button theme-button"
              onClick={() => setDark(!dark)}
              title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User Profile Menu */}
            <div style={{ position: 'relative' }}>
              <button
                className="profile-button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="User account menu"
              >
                <div className="chairman-avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                  SM
                </div>
                <ChevronDown size={14} />
              </button>

              {profileOpen && (
                <div className="user-menu-popover">
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--chair-border)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{user?.name || 'Dr. Suresh Menon'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>Chairman / Platform Owner</div>
                  </div>

                  <button className="user-menu-item" onClick={() => navigateTo('Settings')}>
                    <Settings size={15} />
                    <span>System Settings</span>
                  </button>

                  <button
                    className="user-menu-item"
                    onClick={() => {
                      switchRole('HOSPITAL_ADMIN');
                      announce('Switched to Hospital Admin Portal.');
                    }}
                  >
                    <Building2 size={15} />
                    <span>Switch to Hospital Admin</span>
                  </button>

                  <button
                    className="user-menu-item"
                    onClick={() => {
                      switchRole('DEPARTMENT_HEAD');
                      announce('Switched to Department Head Portal.');
                    }}
                  >
                    <Activity size={15} />
                    <span>Switch to Dept Head</span>
                  </button>

                  <button
                    className="user-menu-item"
                    onClick={() => {
                      switchRole('DOCTOR');
                      announce('Switched to Doctor Portal.');
                    }}
                  >
                    <Stethoscope size={15} />
                    <span>Switch to Doctor</span>
                  </button>

                  <button
                    className="user-menu-item"
                    onClick={() => {
                      switchRole('FAMILY');
                      announce('Switched to Family Account experience.');
                    }}
                  >
                    <UsersRound size={15} />
                    <span>Switch to Family Demo</span>
                  </button>

                  <div style={{ borderTop: '1px solid var(--chair-border)', margin: '4px 0' }} />

                  <button className="user-menu-item danger" onClick={() => logout()}>
                    <LogOut size={15} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* View Router Container */}
        <main className="chairman-content">
          {currentPage === 'Platform Dashboard' && (
            <PlatformDashboard onNavigate={navigateTo} announce={announce} />
          )}
          {currentPage === 'Hospitals' && (
            <HospitalsView initialTab={viewParams.tab || 'hospitals'} announce={announce} />
          )}
          {currentPage === 'Hospital Admins' && (
            <HospitalAdminsView initialAction={viewParams.action || null} announce={announce} />
          )}
          {currentPage === 'Departments' && <DepartmentsView onNavigate={navigateTo} />}
          {currentPage === 'Doctors' && <DoctorsView />}
          {currentPage === 'Family Accounts' && <FamilyAccountsView />}
          {currentPage === 'Appointments' && <AppointmentsView />}
          {currentPage === 'AI Analytics' && <AiAnalyticsView />}
          {currentPage === 'Platform Analytics' && <PlatformAnalyticsView />}
          {currentPage === 'Hospital Performance' && <HospitalPerformanceView />}
          {currentPage === 'Department Performance' && <DepartmentPerformanceView />}
          {currentPage === 'Reports' && <ReportsView announce={announce} />}
          {currentPage === 'Knowledge Activity' && <KnowledgeActivityView />}
          {currentPage === 'Audit Logs' && <AuditLogsView />}
          {currentPage === 'Settings' && <SettingsView announce={announce} />}
        </main>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className="toast" role="status">
          <ShieldCheck size={16} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
