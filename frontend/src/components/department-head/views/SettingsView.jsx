import React, { useState } from 'react';

export function SettingsView({
  profile,
  settings,
  onSaveProfile,
  onSaveSettings,
}) {
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || 'Dr. Priya Sharma',
    title: profile?.title || 'Head of Orthopedics & Musculoskeletal Sciences',
    email: profile?.email || 'priya.sharma@medimindhospital.com',
    phone: profile?.phone || '+91 98765 11001',
    qualification: profile?.qualification || 'MBBS, MS (Orthopedics), DNB (Ortho)',
    experience: profile?.experience || '16 years',
    operatingHours: profile?.operatingHours || '09:00 – 18:00 (Mon - Sat)',
    floor: profile?.floor || 'Level 2, Wing A',
  });

  const [settingsForm, setSettingsForm] = useState({
    emailAlerts: settings?.emailAlerts ?? true,
    traumaEmergencySms: settings?.traumaEmergencySms ?? true,
    aiAnomalyAlerts: settings?.aiAnomalyAlerts ?? true,
    dailyDigest: settings?.dailyDigest ?? false,
    autoAssignTraumaOnCall: settings?.autoAssignTraumaOnCall ?? true,
    aiAutoScreeningEnabled: settings?.aiAutoScreeningEnabled ?? true,
    defaultSlotDurationMinutes: settings?.defaultSlotDurationMinutes ?? 15,
  });

  const [saving, setSaving] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (key) => {
    setSettingsForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProfile(profileForm);
      await onSaveSettings(settingsForm);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              Department Head Settings & Operational Preferences
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              Manage clinical head profile, department operating parameters, and notification protocols
            </p>
          </div>
          <button type="submit" className="dh-btn dh-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save All Preferences'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Profile Card */}
        <div className="dh-card">
          <h3 className="dh-card-title" style={{ marginBottom: '16px' }}>
            Clinical Head Profile
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="dh-form-group">
              <label className="dh-label">Official Name</label>
              <input
                className="dh-input"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
              />
            </div>

            <div className="dh-form-group">
              <label className="dh-label">Designation / Title</label>
              <input
                className="dh-input"
                name="title"
                value={profileForm.title}
                onChange={handleProfileChange}
              />
            </div>

            <div className="dh-form-row">
              <div className="dh-form-group">
                <label className="dh-label">Official Email</label>
                <input
                  className="dh-input"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  disabled
                />
                <span className="dh-input-hint">Managed by Hospital IT Admin</span>
              </div>
              <div className="dh-form-group">
                <label className="dh-label">Direct Phone</label>
                <input
                  className="dh-input"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="dh-form-row">
              <div className="dh-form-group">
                <label className="dh-label">Qualifications</label>
                <input
                  className="dh-input"
                  name="qualification"
                  value={profileForm.qualification}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="dh-form-group">
                <label className="dh-label">Clinical Experience</label>
                <input
                  className="dh-input"
                  name="experience"
                  value={profileForm.experience}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="dh-form-row">
              <div className="dh-form-group">
                <label className="dh-label">Department Location / Floor</label>
                <input
                  className="dh-input"
                  name="floor"
                  value={profileForm.floor}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="dh-form-group">
                <label className="dh-label">Operating Hours</label>
                <input
                  className="dh-input"
                  name="operatingHours"
                  value={profileForm.operatingHours}
                  onChange={handleProfileChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operational & Notification Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Notifications */}
          <div className="dh-card">
            <h3 className="dh-card-title" style={{ marginBottom: '16px' }}>
              Notification Protocols
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Emergency Trauma Alerts (SMS/Push)</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>Urgent notification on Level-1 trauma admissions</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={settingsForm.traumaEmergencySms}
                  onChange={() => handleToggle('traumaEmergencySms')}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>AI Fracture Telemetry Anomaly Alerts</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>Trigger if diagnostic confidence falls below 90%</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={settingsForm.aiAnomalyAlerts}
                  onChange={() => handleToggle('aiAnomalyAlerts')}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Daily Department Operational Digest</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>Summary of OPD load, bed occupancy, and schedules at 19:00</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={settingsForm.dailyDigest}
                  onChange={() => handleToggle('dailyDigest')}
                />
              </div>
            </div>
          </div>

          {/* Department Operating Parameters */}
          <div className="dh-card">
            <h3 className="dh-card-title" style={{ marginBottom: '16px' }}>
              Department Operating Parameters
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>AI Diagnostic Pre-Screening</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>Auto-run Fracture CNN on incoming digital X-Rays</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={settingsForm.aiAutoScreeningEnabled}
                  onChange={() => handleToggle('aiAutoScreeningEnabled')}
                />
              </div>

              <div className="dh-form-group">
                <label className="dh-label">Default Consultation Slot Duration (Minutes)</label>
                <select
                  className="dh-select"
                  value={settingsForm.defaultSlotDurationMinutes}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, defaultSlotDurationMinutes: Number(e.target.value) }))}
                >
                  <option value={10}>10 minutes per slot</option>
                  <option value={15}>15 minutes per slot (Recommended)</option>
                  <option value={20}>20 minutes per slot</option>
                  <option value={30}>30 minutes per slot</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default SettingsView;
