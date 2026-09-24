import { useState } from 'react';
import { Settings, Sun, Moon, Bell, User, Lock, Save, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/useAuth';

export function SettingsView({ dark, setDark, announce }) {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('account');
  const [profileForm, setProfileForm] = useState({
    name: 'Rohan Kapoor',
    email: user?.email || 'rohan.kapoor@example.com',
    phone: '+91 98765 43210',
    address: 'Bengaluru, Karnataka, India',
    emergencyContact: 'Priya Kapoor (+91 98765 43211)',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    appointmentReminders: true,
    emailAlerts: true,
    smsAlerts: false,
    aiRiskUpdates: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    biometricLogin: false,
    sessionTimeout: '30 minutes',
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    announce('Family account profile changes saved successfully.');
  };

  const handleSaveNotifications = () => {
    announce('Notification preferences updated.');
  };

  const handleSaveSecurity = () => {
    announce('Privacy and security settings updated.');
  };

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Settings size={20} />
        </span>
        <div>
          <p className="eyebrow">Account Preferences</p>
          <h1>Settings</h1>
          <p>Configure family workspace profiles, visual appearance, notifications, and security.</p>
        </div>
      </div>

      <div className="feature-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Navigation Tabs */}
        <div className="filter-row">
          <button
            className={`filter ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Account & Profile
          </button>
          <button
            className={`filter ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            {dark ? <Moon size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> : <Sun size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />}
            Appearance
          </button>
          <button
            className={`filter ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Notifications
          </button>
          <button
            className={`filter ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Privacy & Security
          </button>
        </div>

        {/* Tab 1: Account & Profile */}
        {activeTab === 'account' && (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Primary Account Holder Name</span>
                <input
                  className="feature-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Email Address</span>
                <input
                  type="email"
                  className="feature-input"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Primary Contact Number</span>
                <input
                  className="feature-input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Emergency Contact Reference</span>
                <input
                  className="feature-input"
                  value={profileForm.emergencyContact}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Residential Address</span>
                <input
                  className="feature-input"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="primary-button">
                <Save size={16} /> Save Profile Changes
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Appearance */}
        {activeTab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="settings-section" style={{ padding: '16px', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Interface Theme Mode</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--family-muted)' }}>
                  Switch between high-clarity daylight theme and low-light nocturnal theme.
                </p>
              </div>
              <button
                className="secondary-button"
                onClick={() => {
                  setDark(!dark);
                  announce(`Switched to ${!dark ? 'Dark' : 'Light'} Mode.`);
                }}
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
                {dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </button>
            </div>

            <div className="settings-section" style={{ padding: '16px', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Font Scaling & Readability</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--family-muted)' }}>
                  Standard clinical typography optimized for prescription clarity.
                </p>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--family-primary)' }}>
                Inter / Plus Jakarta Sans (Optimal)
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              {
                key: 'appointmentReminders',
                title: 'Appointment Reminders',
                desc: 'Receive alerts 24 hours and 2 hours prior to scheduled consultation visits.',
              },
              {
                key: 'emailAlerts',
                title: 'Email Notifications for New Records',
                desc: 'Get notified via email when doctors upload consultation notes or lab results.',
              },
              {
                key: 'smsAlerts',
                title: 'SMS Critical Updates',
                desc: 'Urgent prescription reminders and schedule change notices via SMS.',
              },
              {
                key: 'aiRiskUpdates',
                title: 'AI Health Assessment Insights',
                desc: 'Receive personalized longevity updates and risk score telemetry adjustments.',
              },
            ].map((item) => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: 'var(--family-soft)',
                  borderRadius: '10px',
                  border: '1px solid var(--family-border)',
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: 'var(--family-ink)' }}>
                    {item.title}
                  </strong>
                  <span style={{ fontSize: '12.5px', color: 'var(--family-muted)' }}>{item.desc}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationSettings({
                      ...notificationSettings,
                      [item.key]: !notificationSettings[item.key],
                    });
                    handleSaveNotifications();
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: notificationSettings[item.key] ? 'var(--family-primary)' : 'var(--family-card)',
                    color: notificationSettings[item.key] ? '#ffffff' : 'var(--family-muted)',
                    border: `1px solid ${notificationSettings[item.key] ? 'var(--family-primary)' : 'var(--family-border)'}`,
                  }}
                >
                  {notificationSettings[item.key] ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Privacy & Security */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '14px 16px', backgroundColor: 'var(--family-soft)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--family-ink)' }}>
                  Two-Factor Authentication (2FA)
                </strong>
                <span style={{ fontSize: '12.5px', color: 'var(--family-muted)' }}>
                  Secure account login verification using authenticator app or SMS code.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSecuritySettings({ ...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth });
                  handleSaveSecurity();
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: securitySettings.twoFactorAuth ? 'var(--family-primary)' : 'var(--family-card)',
                  color: securitySettings.twoFactorAuth ? '#ffffff' : 'var(--family-muted)',
                  border: `1px solid ${securitySettings.twoFactorAuth ? 'var(--family-primary)' : 'var(--family-border)'}`,
                }}
              >
                {securitySettings.twoFactorAuth ? 'Active' : 'Off'}
              </button>
            </div>

            <div style={{ padding: '14px 16px', backgroundColor: 'var(--family-soft)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--family-ink)' }}>
                  HIPAA-Compliant Storage Encryption
                </strong>
                <span style={{ fontSize: '12.5px', color: 'var(--family-muted)' }}>
                  All medical imaging, scans, and consult notes are encrypted at rest with AES-256 keys.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '13px', fontWeight: '600' }}>
                <CheckCircle2 size={16} /> Enforced
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--family-card)', borderRadius: '10px', border: '1px solid var(--family-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--family-ink)' }}>
                  Signed in as {user?.email || 'rohan.kapoor@example.com'}
                </strong>
                <span style={{ fontSize: '12.5px', color: 'var(--family-muted)' }}>
                  Role: Family Account Administrator · Current Session Active
                </span>
              </div>
              <button
                className="secondary-button"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => logout()}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
