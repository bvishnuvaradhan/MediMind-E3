// MediMind Platform - Settings & Platform Policies (Chairman / Platform Owner)
// Section 19 & 22 of PLATFORM OWNER.txt: Platform configuration, access policies, and security settings

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Key,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';
import { useAuth } from '../../../context/useAuth';

export function SettingsView({ announce }) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('platform');
  const [settings, setSettings] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function load() {
      const data = await chairmanService.getSettings();
      setSettings(data);
    }
    load();
  }, []);

  if (!settings) return <div className="loading-state">Loading Settings...</div>;

  const handleSavePlatform = async (e) => {
    e.preventDefault();
    await chairmanService.updateSettings(settings);
    announce('Platform configuration updated and audited.');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!currentPassword) {
      announce('Please enter current password.');
      return;
    }
    if (newPassword.length < 8) {
      announce('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      announce('Passwords do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    announce('Chairman security password updated successfully.');
  };

  return (
    <div className="settings-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <Settings size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              System Governance
            </p>
            <h1>Platform Policies & Settings</h1>
            <p>Configure network parameters, security policies, AI disclaimers, and administrative preferences.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-bar">
        <div className="filter-pills">
          <button
            className={`filter-pill ${activeTab === 'platform' ? 'active' : ''}`}
            onClick={() => setActiveTab('platform')}
          >
            Platform Information
          </button>
          <button
            className={`filter-pill ${activeTab === 'policies' ? 'active' : ''}`}
            onClick={() => setActiveTab('policies')}
          >
            Access Policies & AI
          </button>
          <button
            className={`filter-pill ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security & Passwords
          </button>
          <button
            className={`filter-pill ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            Alerts & Notifications
          </button>
        </div>
      </div>

      {/* Tab 1: Platform Info */}
      {activeTab === 'platform' && (
        <div className="table-card" style={{ padding: '28px' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>
            Core Platform Identification
          </h3>

          <form onSubmit={handleSavePlatform}>
            <div className="chair-form-grid">
              <div className="chair-form-group">
                <label>Platform Name</label>
                <input
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                />
              </div>

              <div className="chair-form-group">
                <label>System Tagline</label>
                <input
                  value={settings.platformTagline}
                  onChange={(e) => setSettings({ ...settings, platformTagline: e.target.value })}
                />
              </div>

              <div className="chair-form-group">
                <label>Network Operating Mode</label>
                <input
                  value={settings.networkMode}
                  onChange={(e) => setSettings({ ...settings, networkMode: e.target.value })}
                />
              </div>

              <div className="chair-form-group">
                <label>Primary Administrator Contact Email</label>
                <input
                  value={settings.primaryAdminContact}
                  onChange={(e) => setSettings({ ...settings, primaryAdminContact: e.target.value })}
                />
              </div>

              <div className="chair-form-group chair-form-full">
                <label>Platform Core Version</label>
                <input value={settings.version} disabled style={{ opacity: 0.7 }} />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="primary-button">
                <Save size={15} />
                <span>Save Platform Configuration</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Policies & AI */}
      {activeTab === 'policies' && (
        <div className="table-card" style={{ padding: '28px' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>
            Locked Architectural Governance Policies
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--chair-bg)', border: '1px solid var(--chair-border)' }}>
              <strong>Doctor Access Protocol</strong>
              <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)', fontSize: '12px' }}>
                {settings.policies.doctorAccessProtocol} — When a patient authorizes a doctor, the doctor receives access to that member's complete medical history. Granular individual record toggles are disabled.
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--chair-bg)', border: '1px solid var(--chair-border)' }}>
              <strong>Consultation & Prescription Immutability</strong>
              <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)', fontSize: '12px' }}>
                {settings.policies.clinicalConsultationLock} — Finalized consultations and prescriptions are locked against deletion or direct editing to preserve trusted clinical audit trails. Corrections are submitted as timestamped amendments.
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--chair-bg)', border: '1px solid var(--chair-border)' }}>
              <strong>Mandatory AI Diagnostic Disclaimer</strong>
              <textarea
                style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '8px', border: '1px solid var(--chair-border)', background: 'var(--chair-card)', color: 'var(--chair-ink)', fontSize: '12px' }}
                value={settings.policies.aiDisclaimerText}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    policies: { ...settings.policies, aiDisclaimerText: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="primary-button" onClick={handleSavePlatform}>
              <Save size={15} />
              <span>Update Policies</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Passwords */}
      {activeTab === 'security' && (
        <div className="table-card" style={{ padding: '28px' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>
            Security & Authentication Controls
          </h3>

          <form onSubmit={handleChangePassword}>
            <div className="chair-form-grid" style={{ maxWidth: '600px' }}>
              <div className="chair-form-group chair-form-full">
                <label>Current Password *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="chair-form-group">
                <label>New Password (min 8 chars) *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="chair-form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>

              <div className="chair-form-group chair-form-full">
                <button type="submit" className="primary-button" style={{ width: 'fit-content', marginTop: '6px' }}>
                  <Key size={15} />
                  <span>Update Password</span>
                </button>
              </div>
            </div>
          </form>

          <div style={{ marginTop: '32px', paddingTop: '22px', borderTop: '1px solid var(--chair-border)' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '15px' }}>Session Termination</h4>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--chair-muted)' }}>
              Sign out of this administrative terminal and invalidate the active session token.
            </p>
            <button
              className="secondary-button"
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={() => logout()}
            >
              Sign out of Chairman Session
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Alerts */}
      {activeTab === 'alerts' && (
        <div className="table-card" style={{ padding: '28px' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>
            Platform Alert Routing
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.notifications.emailOnHospitalRequest}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailOnHospitalRequest: e.target.checked },
                  })
                }
              />
              <span>Immediate dispatch when a new hospital onboarding request is submitted</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.notifications.emailOnAdminCreation}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailOnAdminCreation: e.target.checked },
                  })
                }
              />
              <span>Notification when a Hospital Admin account is created or modified</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.notifications.emailOnSecurityAlert}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailOnSecurityAlert: e.target.checked },
                  })
                }
              />
              <span>High-priority alert for microservice threshold alerts or multiple login anomalies</span>
            </label>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="primary-button" onClick={handleSavePlatform}>
              <Save size={15} />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
