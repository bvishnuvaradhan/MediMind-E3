import React, { useState } from 'react';

export function SettingsView({
  doctorProfile,
  settings,
  onSaveProfile,
  onSaveSettings,
}) {
  const [profileForm, setProfileForm] = useState({
    name: doctorProfile?.name || 'Dr. Rahul Mehta',
    title: doctorProfile?.title || 'Senior Consultant Orthopedic Surgeon',
    email: doctorProfile?.email || 'rahul.mehta@medimindhospital.com',
    phone: doctorProfile?.phone || '+91 98765 21001',
    qualification: doctorProfile?.qualification || 'MBBS, MS (Orthopedics), DNB',
    experience: doctorProfile?.experience || '10 years',
    room: doctorProfile?.room || 'OPD Room 204',
    specialization: doctorProfile?.specialization || 'Joint Replacement & Arthroscopy',
    description: doctorProfile?.description || '',
  });

  const [settingsForm, setSettingsForm] = useState({
    appointmentAlerts: settings?.notificationPreferences?.appointmentAlerts ?? true,
    newRecordUploadAlerts: settings?.notificationPreferences?.newRecordUploadAlerts ?? true,
    patientAccessAlerts: settings?.notificationPreferences?.patientAccessAlerts ?? true,
    aiPredictionAlerts: settings?.notificationPreferences?.aiPredictionAlerts ?? true,
    autoImportAiFindingsIntoNotes: settings?.clinicalPreferences?.autoImportAiFindingsIntoNotes ?? true,
    enableGradCamOverlayByDefault: settings?.clinicalPreferences?.enableGradCamOverlayByDefault ?? true,
  });

  const [saving, setSaving] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleSetting = (key) => {
    setSettingsForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProfile(profileForm);
      await onSaveSettings({
        notificationPreferences: {
          appointmentAlerts: settingsForm.appointmentAlerts,
          newRecordUploadAlerts: settingsForm.newRecordUploadAlerts,
          patientAccessAlerts: settingsForm.patientAccessAlerts,
          aiPredictionAlerts: settingsForm.aiPredictionAlerts,
        },
        clinicalPreferences: {
          autoImportAiFindingsIntoNotes: settingsForm.autoImportAiFindingsIntoNotes,
          enableGradCamOverlayByDefault: settingsForm.enableGradCamOverlayByDefault,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              Doctor Profile & Clinical Workspace Preferences
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Manage your clinician bio, contact details, AI decision support presets, and alerts
            </p>
          </div>
          <button type="submit" className="doctor-btn doctor-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Clinician Profile Card */}
        <div className="doctor-card">
          <h3 className="doctor-card-title" style={{ marginBottom: '16px' }}>
            Clinician Profile Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="doctor-form-group">
              <label className="doctor-label">Full Doctor Name *</label>
              <input
                className="doctor-input"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
              />
            </div>

            <div className="doctor-form-row">
              <div className="doctor-form-group">
                <label className="doctor-label">Department (Scope-Locked)</label>
                <input
                  className="doctor-input"
                  value={doctorProfile?.departmentName || 'Orthopedics'}
                  disabled
                />
              </div>
              <div className="doctor-form-group">
                <label className="doctor-label">Hospital</label>
                <input
                  className="doctor-input"
                  value={doctorProfile?.hospitalName || 'MediMind Central Hospital'}
                  disabled
                />
              </div>
            </div>

            <div className="doctor-form-row">
              <div className="doctor-form-group">
                <label className="doctor-label">Official Email</label>
                <input
                  className="doctor-input"
                  value={profileForm.email}
                  disabled
                />
              </div>
              <div className="doctor-form-group">
                <label className="doctor-label">Direct Contact Phone</label>
                <input
                  className="doctor-input"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="doctor-form-row">
              <div className="doctor-form-group">
                <label className="doctor-label">Clinical Qualifications</label>
                <input
                  className="doctor-input"
                  name="qualification"
                  value={profileForm.qualification}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="doctor-form-group">
                <label className="doctor-label">Assigned OPD Room</label>
                <input
                  className="doctor-input"
                  name="room"
                  value={profileForm.room}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="doctor-form-group">
              <label className="doctor-label">Professional Bio & Experience Summary</label>
              <textarea
                className="doctor-textarea"
                rows="3"
                name="description"
                value={profileForm.description}
                onChange={handleProfileChange}
              />
            </div>
          </div>
        </div>

        {/* Clinical Preferences & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Clinical Presets */}
          <div className="doctor-card">
            <h3 className="doctor-card-title" style={{ marginBottom: '16px' }}>
              AI Decision Support & Clinical Presets
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Auto-Import AI Findings into Consultation Notes</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)' }}>Pre-populates Fracture CNN validation notes in new consultation forms</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={settingsForm.autoImportAiFindingsIntoNotes}
                  onChange={() => handleToggleSetting('autoImportAiFindingsIntoNotes')}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Grad-CAM Heatmap Overlay by Default</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)' }}>Automatically enables visual saliency heatmap when inspecting radiographs</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={settingsForm.enableGradCamOverlayByDefault}
                  onChange={() => handleToggleSetting('enableGradCamOverlayByDefault')}
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="doctor-card">
            <h3 className="doctor-card-title" style={{ marginBottom: '16px' }}>
              Clinical Event Notifications
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Patient Access Authorization Alerts</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)' }}>Instant alert when a family authorizes you for medical record access</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={settingsForm.patientAccessAlerts}
                  onChange={() => handleToggleSetting('patientAccessAlerts')}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>New Medical Record Uploaded by Patient</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)' }}>Notify when an authorized patient uploads a new scan or blood test</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={settingsForm.newRecordUploadAlerts}
                  onChange={() => handleToggleSetting('newRecordUploadAlerts')}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>AI Prediction Ready Alerts</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)' }}>Notify when CNN completes fracture triage analysis</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={settingsForm.aiPredictionAlerts}
                  onChange={() => handleToggleSetting('aiPredictionAlerts')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default SettingsView;
