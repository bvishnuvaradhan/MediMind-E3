import { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Save,
  Moon,
  Sun,
  LogOut,
  Sliders,
} from 'lucide-react';

export function SettingsView({
  settings,
  onSaveSettings,
  dark,
  setDark,
  logout,
  announce,
}) {
  const [formData, setFormData] = useState({
    emergencyHotline: settings.general?.emergencyHotline || '+91 80 2345 9999',
    slotDuration: settings.general?.appointmentSlotDuration || '30 Minutes',
    maxAdvanceDays: settings.general?.maxAdvanceBookingDays || '30 Days',
    autoConfirm: settings.general?.autoConfirmOnlineBookings ?? true,
    emailAlerts: settings.notifications?.emailAlertsForEmergencyLoads ?? true,
    dailyDigest: settings.notifications?.dailyAppointmentDigest ?? true,
    staffAlerts: settings.notifications?.staffAccountChangeNotifications ?? true,
    aiAnomalyAlerts: settings.notifications?.aiModelAnomalyAlerts ?? true,
    twoFactor: settings.security?.twoFactorEnforced ?? true,
    sessionTimeout: settings.security?.sessionTimeoutMinutes || 60,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      general: {
        hospitalName: 'MediMind Central Hospital',
        emergencyHotline: formData.emergencyHotline,
        appointmentSlotDuration: formData.slotDuration,
        maxAdvanceBookingDays: formData.maxAdvanceDays,
        autoConfirmOnlineBookings: formData.autoConfirm,
      },
      notifications: {
        emailAlertsForEmergencyLoads: formData.emailAlerts,
        dailyAppointmentDigest: formData.dailyDigest,
        staffAccountChangeNotifications: formData.staffAlerts,
        aiModelAnomalyAlerts: formData.aiAnomalyAlerts,
      },
      security: {
        twoFactorEnforced: formData.twoFactor,
        sessionTimeoutMinutes: Number(formData.sessionTimeout),
        hipaaAuditLogging: true,
      },
    });
    announce('Hospital administrative settings saved successfully.');
  };

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <Settings size={24} />
          </div>
          <div>
            <h1>Hospital Configuration & Administrative Settings</h1>
            <p>Manage hospital operating parameters, emergency routing, notification alerts, and security policies</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Appearance & Interface */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sliders size={18} style={{ color: 'var(--ha-primary)' }} />
              <h3>Visual Theme & Appearance</h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ fontSize: '13px', display: 'block' }}>Dashboard Theme Mode</strong>
              <span style={{ fontSize: '12px', color: 'var(--ha-text-muted)' }}>
                Toggle between light and dark clinical interface modes
              </span>
            </div>
            <button
              type="button"
              className="ha-btn ha-btn-secondary"
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
              {dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
          </div>
        </div>

        {/* Operational Routing */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Settings size={18} style={{ color: 'var(--ha-teal)' }} />
              <h3>Hospital Operations & Intake Configuration</h3>
            </div>
          </div>

          <div className="ha-form">
            <div className="ha-form-row">
              <div className="ha-form-group">
                <label>Emergency Triage Hotline</label>
                <input
                  type="text"
                  className="ha-input"
                  value={formData.emergencyHotline}
                  onChange={(e) => setFormData({ ...formData, emergencyHotline: e.target.value })}
                  required
                />
              </div>
              <div className="ha-form-group">
                <label>Standard Consultation Slot Duration</label>
                <select
                  className="ha-select"
                  value={formData.slotDuration}
                  onChange={(e) => setFormData({ ...formData, slotDuration: e.target.value })}
                >
                  <option value="15 Minutes">15 Minutes</option>
                  <option value="20 Minutes">20 Minutes</option>
                  <option value="30 Minutes">30 Minutes</option>
                  <option value="45 Minutes">45 Minutes</option>
                </select>
              </div>
            </div>

            <div className="ha-form-row">
              <div className="ha-form-group">
                <label>Maximum Advance Booking Window</label>
                <select
                  className="ha-select"
                  value={formData.maxAdvanceDays}
                  onChange={(e) => setFormData({ ...formData, maxAdvanceDays: e.target.value })}
                >
                  <option value="14 Days">14 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="60 Days">60 Days</option>
                  <option value="90 Days">90 Days</option>
                </select>
              </div>
              <div className="ha-form-group">
                <label>Online Booking Auto-Confirmation</label>
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={formData.autoConfirm}
                      onChange={(e) => setFormData({ ...formData, autoConfirm: e.target.checked })}
                    />
                    <span>Automatically confirm patient appointments upon booking</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={18} style={{ color: 'var(--ha-indigo)' }} />
              <h3>Administrative Notifications & Alerts</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={formData.emailAlerts}
                onChange={(e) => setFormData({ ...formData, emailAlerts: e.target.checked })}
              />
              <span>High Emergency Intake Alerts & Bed Capacity Threshold Notifications</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={formData.dailyDigest}
                onChange={(e) => setFormData({ ...formData, dailyDigest: e.target.checked })}
              />
              <span>Daily Hospital Operational & Consultation Digest Summary</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={formData.staffAlerts}
                onChange={(e) => setFormData({ ...formData, staffAlerts: e.target.checked })}
              />
              <span>Department Head & Doctor Account Status Change Notifications</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={formData.aiAnomalyAlerts}
                onChange={(e) => setFormData({ ...formData, aiAnomalyAlerts: e.target.checked })}
              />
              <span>AI Diagnostic Diagnostic Model Pipeline Anomaly Alerts</span>
            </label>
          </div>
        </div>

        {/* Security & Authentication */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={18} style={{ color: 'var(--ha-error)' }} />
              <h3>Administrative Security Policies</h3>
            </div>
          </div>

          <div className="ha-form">
            <div className="ha-form-row">
              <div className="ha-form-group">
                <label>Two-Factor Authentication (2FA)</label>
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={formData.twoFactor}
                      onChange={(e) => setFormData({ ...formData, twoFactor: e.target.checked })}
                    />
                    <span>Enforce Mandatory 2FA for All Staff and Department Heads</span>
                  </label>
                </div>
              </div>

              <div className="ha-form-group">
                <label>Admin Session Inactivity Timeout (Minutes)</label>
                <input
                  type="number"
                  className="ha-input"
                  min={15}
                  max={240}
                  value={formData.sessionTimeout}
                  onChange={(e) => setFormData({ ...formData, sessionTimeout: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar & Sign out */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
          <button
            type="button"
            className="ha-btn ha-btn-secondary"
            style={{ color: 'var(--ha-error)', borderColor: '#fca5a5' }}
            onClick={logout}
          >
            <LogOut size={16} /> Sign Out of Hospital Admin Portal
          </button>

          <button type="submit" className="ha-btn ha-btn-primary" style={{ minWidth: '180px' }}>
            <Save size={16} /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}

