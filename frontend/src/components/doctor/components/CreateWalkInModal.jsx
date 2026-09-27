import React, { useState } from 'react';

function WalkInForm({
  patients = [],
  doctorProfile,
  onCreateWalkIn,
  onClose,
}) {
  const [patientMode, setPatientMode] = useState('existing'); // 'existing' | 'new'
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');

  // New patient state
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '',
    emergencyContact: '',
    chiefComplaint: '',
  });

  // Encounter info
  const now = new Date();
  const defaultTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const defaultDate = `Today, ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const [encounterData, setEncounterData] = useState({
    date: defaultDate,
    time: defaultTime,
    type: 'Walk-in',
    purpose: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setNewPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleEncounterChange = (e) => {
    const { name, value } = e.target;
    setEncounterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (patientMode === 'existing') {
      if (!selectedPatientId && (!patients || patients.length === 0)) {
        setError('Please select an existing patient or switch to Add New Patient.');
        return;
      }
    } else {
      if (!newPatient.name.trim()) {
        setError('Please enter the patient’s full legal name.');
        return;
      }
      if (!newPatient.age || isNaN(Number(newPatient.age)) || Number(newPatient.age) <= 0) {
        setError('Please enter a valid age for the patient.');
        return;
      }
      if (!newPatient.chiefComplaint.trim() && !encounterData.purpose.trim()) {
        setError('Please enter the chief clinical complaint or reason for the walk-in visit.');
        return;
      }
    }

    const complaint = patientMode === 'new'
      ? (newPatient.chiefComplaint.trim() || encounterData.purpose.trim())
      : (encounterData.purpose.trim() || selectedPatient?.chiefComplaint || 'Acute outpatient walk-in consultation');

    if (!complaint) {
      setError('Please provide a reason for the walk-in visit.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreateWalkIn({
        isNewPatient: patientMode === 'new',
        patientId: patientMode === 'existing' ? (selectedPatient?.id || selectedPatientId) : null,
        newPatientData: patientMode === 'new' ? {
          ...newPatient,
          age: Number(newPatient.age),
          chiefComplaint: complaint,
        } : null,
        date: encounterData.date,
        time: encounterData.time,
        type: encounterData.type || 'Walk-in',
        purpose: complaint,
        doctorName: doctorProfile?.name || 'Dr. Rahul Mehta',
        doctorId: doctorProfile?.id || 'doc_001',
        department: doctorProfile?.departmentName || 'Orthopedics',
        departmentId: doctorProfile?.departmentId || 'DEP-H1-ORTHO',
        hospital: doctorProfile?.hospitalName || 'MediMind Central Hospital',
        hospitalId: doctorProfile?.hospitalId || 'HOSP-001',
      });
      onClose();
    } catch {
      setError('Failed to register walk-in encounter. Please check details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
      <div className="doctor-modal-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              className="doctor-badge"
              style={{
                fontSize: '11px',
                backgroundColor: 'var(--doctor-soft-bg)',
                color: 'var(--doctor-primary)',
                fontWeight: 700,
              }}
            >
              Walk-in (AI Not Required)
            </span>
            <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
              {doctorProfile?.departmentName || 'Orthopedics'} • {doctorProfile?.hospitalName || 'Central Hospital'}
            </span>
          </div>
          <h3 className="doctor-modal-title">Register Walk-in Patient Encounter</h3>
          <div className="doctor-card-description">
            Add an unscheduled outpatient arrival for immediate clinical assessment
          </div>
        </div>
        <button className="doctor-btn-icon" onClick={onClose} aria-label="Close modal">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="doctor-modal-body">
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--doctor-error-bg, #fee2e2)',
                color: 'var(--doctor-error, #dc2626)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* Patient Selection Mode Toggle */}
          <div className="doctor-form-group">
            <label className="doctor-label" style={{ marginBottom: '8px', display: 'block' }}>
              Patient Identification Method
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`doctor-btn ${patientMode === 'existing' ? 'doctor-btn-primary' : 'doctor-btn-outline'}`}
                style={{ flex: 1, minWidth: '180px', justifyContent: 'center' }}
                onClick={() => setPatientMode('existing')}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Select Existing Patient
              </button>
              <button
                type="button"
                className={`doctor-btn ${patientMode === 'new' ? 'doctor-btn-primary' : 'doctor-btn-outline'}`}
                style={{ flex: 1, minWidth: '180px', justifyContent: 'center' }}
                onClick={() => setPatientMode('new')}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                + Add New Patient
              </button>
            </div>
          </div>

          {/* Option A: Select Existing Patient */}
          {patientMode === 'existing' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="doctor-form-group">
                <label className="doctor-label">Select Patient *</label>
                <select
                  className="doctor-select"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender}, {p.age}y — Blood {p.bloodGroup} • ID: {p.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Patient Quick Summary Card */}
              {selectedPatient && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--doctor-soft-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--doctor-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '12.5px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>{selectedPatient.name}</strong>
                    <span className="doctor-badge doctor-badge-active" style={{ fontSize: '11px' }}>
                      {selectedPatient.accessStatus || 'Active'} Access
                    </span>
                  </div>
                  <div style={{ color: 'var(--doctor-text-muted)' }}>
                    {selectedPatient.gender}, {selectedPatient.age} yrs • Blood Group: <strong>{selectedPatient.bloodGroup}</strong> • Phone: {selectedPatient.phone || 'N/A'}
                  </div>
                  {selectedPatient.chiefComplaint && (
                    <div style={{ color: 'var(--doctor-text-secondary)' }}>
                      <strong>Recorded Presentation:</strong> {selectedPatient.chiefComplaint}
                    </div>
                  )}
                  {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                    <div style={{ color: 'var(--doctor-coral)', fontWeight: 600 }}>
                      Allergies: {selectedPatient.allergies.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Option B: Add New Patient */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--doctor-soft-teal)', borderRadius: '8px', fontSize: '12.5px', color: 'var(--doctor-text-primary)' }}>
                ℹ <strong>New Walk-in Patient Registration:</strong> Registers a temporary clinical encounter profile for this visit. Consent boundaries remain protected for historical records.
              </div>

              <div className="doctor-form-row">
                <div className="doctor-form-group">
                  <label className="doctor-label">Full Legal Name *</label>
                  <input
                    className="doctor-input"
                    name="name"
                    placeholder="e.g. Ramesh Chandra"
                    value={newPatient.name}
                    onChange={handleNewPatientChange}
                    required
                  />
                </div>

                <div className="doctor-form-group">
                  <label className="doctor-label">Age (years) *</label>
                  <input
                    type="number"
                    className="doctor-input"
                    name="age"
                    placeholder="e.g. 45"
                    min="1"
                    max="120"
                    value={newPatient.age}
                    onChange={handleNewPatientChange}
                    required
                  />
                </div>
              </div>

              <div className="doctor-form-row">
                <div className="doctor-form-group">
                  <label className="doctor-label">Biological Gender *</label>
                  <select
                    className="doctor-select"
                    name="gender"
                    value={newPatient.gender}
                    onChange={handleNewPatientChange}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="doctor-form-group">
                  <label className="doctor-label">Blood Group</label>
                  <select
                    className="doctor-select"
                    name="bloodGroup"
                    value={newPatient.bloodGroup}
                    onChange={handleNewPatientChange}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="doctor-form-row">
                <div className="doctor-form-group">
                  <label className="doctor-label">Contact Phone (Optional)</label>
                  <input
                    type="tel"
                    className="doctor-input"
                    name="phone"
                    placeholder="e.g. +91 98765 43210"
                    value={newPatient.phone}
                    onChange={handleNewPatientChange}
                  />
                </div>

                <div className="doctor-form-group">
                  <label className="doctor-label">Emergency Contact (Optional)</label>
                  <input
                    className="doctor-input"
                    name="emergencyContact"
                    placeholder="e.g. Spouse (+91 98765 11223)"
                    value={newPatient.emergencyContact}
                    onChange={handleNewPatientChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Encounter Information */}
          <div style={{ marginTop: '8px', paddingTop: '14px', borderTop: '1px solid var(--doctor-border)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
              Encounter & Visit Details
            </h4>

            <div className="doctor-form-row">
              <div className="doctor-form-group">
                <label className="doctor-label">Encounter Date</label>
                <input
                  className="doctor-input"
                  name="date"
                  value={encounterData.date}
                  onChange={handleEncounterChange}
                  required
                />
              </div>

              <div className="doctor-form-group">
                <label className="doctor-label">Arrival / Encounter Time</label>
                <input
                  className="doctor-input"
                  name="time"
                  value={encounterData.time}
                  onChange={handleEncounterChange}
                  required
                />
              </div>
            </div>

            <div className="doctor-form-group">
              <label className="doctor-label">Encounter Modality</label>
              <select
                className="doctor-select"
                name="type"
                value={encounterData.type}
                onChange={handleEncounterChange}
              >
                <option value="Walk-in">Walk-in Consultation</option>
                <option value="Emergency Walk-in">Emergency Walk-in Triage</option>
                <option value="Urgent Orthopedic Evaluation">Urgent Orthopedic Evaluation</option>
                <option value="Post-Op Walk-in Follow-up">Post-Op Walk-in Follow-up</option>
              </select>
            </div>

            <div className="doctor-form-group">
              <label className="doctor-label">Chief Complaint / Reason for Visit *</label>
              <textarea
                className="doctor-textarea"
                rows="3"
                name="purpose"
                placeholder="e.g. Acute twisting injury to left ankle during badminton, mild swelling, unable to bear weight without discomfort..."
                value={encounterData.purpose || (patientMode === 'new' ? newPatient.chiefComplaint : '')}
                onChange={(e) => {
                  handleEncounterChange(e);
                  if (patientMode === 'new') {
                    setNewPatient((p) => ({ ...p, chiefComplaint: e.target.value }));
                  }
                }}
                required
              />
            </div>
          </div>
        </div>

        <div className="doctor-modal-footer">
          <button type="button" className="doctor-btn doctor-btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="doctor-btn doctor-btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Registering Encounter...' : 'Create Walk-in'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function CreateWalkInModal({
  isOpen,
  patients = [],
  doctorProfile,
  onCreateWalkIn,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="doctor-modal-overlay" onClick={onClose}>
      <WalkInForm
        patients={patients}
        doctorProfile={doctorProfile}
        onCreateWalkIn={onCreateWalkIn}
        onClose={onClose}
      />
    </div>
  );
}

export default CreateWalkInModal;
