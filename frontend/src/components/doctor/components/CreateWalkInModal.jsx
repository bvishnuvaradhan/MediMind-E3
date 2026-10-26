import React, { useState, useEffect } from 'react';
import { doctorService } from '../../../services/doctorService.js';

function WalkInForm({
  patients = [],
  doctorProfile,
  onCreateWalkIn,
  onClose,
}) {
  const [patientMode, setPatientMode] = useState('existing'); // 'existing' | 'new'
  const [families, setFamilies] = useState([]);
  const [familiesLoading, setFamiliesLoading] = useState(true);
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');

  // Load families on component mount
  useEffect(() => {
    async function loadFamilies() {
      const fams = await doctorService.getFamilies();
      setFamilies(fams);
      if (fams.length > 0) {
        const firstFamId = fams[0].id || fams[0]._id;
        setSelectedFamilyId(firstFamId);
        const mems = await doctorService.getFamilyMembers(firstFamId);
        setFamilyMembers(mems);
        if (mems.length > 0) {
          const firstMemId = mems[0].id || mems[0]._id || mems[0].memberId;
          setSelectedMemberId(firstMemId);
        }
      }
    }
    loadFamilies();
  }, []);

  // Handle family account selection change
  const handleFamilyChange = async (famId) => {
    setSelectedFamilyId(famId);
    setSelectedMemberId(''); // Immediately clear member selection on family change!
    setFamilyMembers([]);
    if (famId) {
      const mems = await doctorService.getFamilyMembers(famId);
      setFamilyMembers(mems);
      if (mems.length > 0) {
        setSelectedMemberId(mems[0].id || mems[0]._id || mems[0].memberId);
      }
    }
  };

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
      if (!selectedFamilyId) {
        setError('Please select an authorized family account.');
        return;
      }
      if (!selectedMemberId) {
        setError('Please select a dependent family member for this family account.');
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
        familyId: patientMode === 'existing' ? selectedFamilyId : null,
        familyMemberId: patientMode === 'existing' ? selectedMemberId : null,
        patientId: patientMode === 'existing' ? (selectedMemberId || selectedPatient?.id) : null,
        selectedMember: patientMode === 'existing' ? familyMembers.find(m => (m.id || m._id || m.memberId) === selectedMemberId) : null,
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
    <div
      className="doctor-modal-box lg"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'hidden',
      }}
    >
      <div className="doctor-modal-header" style={{ flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
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

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          margin: 0,
        }}
      >
        <div
          className="doctor-modal-body"
          style={{
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            overflowX: 'hidden',
          }}
        >
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
                style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}
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
                style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}
                onClick={() => setPatientMode('new')}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                + Add New Patient
              </button>
            </div>
          </div>

          {/* Option A: Select Family Account -> Family Member */}
          {patientMode === 'existing' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="doctor-form-group">
                <label className="doctor-label">Select Family Account *</label>
                <select
                  className="doctor-select"
                  value={selectedFamilyId}
                  onChange={(e) => handleFamilyChange(e.target.value)}
                  required
                >
                  <option value="">-- Choose Authorized Family Account --</option>
                  {families.map((fam) => (
                    <option key={fam.id || fam._id} value={fam.id || fam._id}>
                      {fam.familyName || fam.family_name} ({fam.email} • {fam.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div className="doctor-form-group">
                <label className="doctor-label">Select Family Member *</label>
                <select
                  className="doctor-select"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  disabled={!selectedFamilyId || familyMembers.length === 0}
                  required
                >
                  <option value="">
                    {familyMembers.length === 0 ? '-- No members found for selected family --' : '-- Choose Family Member --'}
                  </option>
                  {familyMembers.map((m) => {
                    const mId = m.id || m._id || m.memberId;
                    const birthYear = m.dateOfBirth ? new Date(m.dateOfBirth).getFullYear() : null;
                    const approxAge = birthYear ? (new Date().getFullYear() - birthYear) : (m.age || 35);
                    return (
                      <option key={mId} value={mId}>
                        {m.fullName || m.full_name} ({m.gender}, {approxAge}y • Blood {m.bloodGroup || m.blood_group || 'B+'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Member Quick Summary Card */}
              {(() => {
                const curMember = familyMembers.find(m => (m.id || m._id || m.memberId) === selectedMemberId);
                if (!curMember) return null;
                const birthYear = curMember.dateOfBirth ? new Date(curMember.dateOfBirth).getFullYear() : null;
                const approxAge = birthYear ? (new Date().getFullYear() - birthYear) : (curMember.age || 35);
                return (
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <strong>{curMember.fullName || curMember.full_name}</strong>
                      <span className="doctor-badge doctor-badge-active" style={{ fontSize: '11px' }}>
                        Authorized Encounter
                      </span>
                    </div>
                    <div style={{ color: 'var(--doctor-text-muted)' }}>
                      {curMember.gender}, {approxAge} yrs • Blood Group: <strong>{curMember.bloodGroup || curMember.blood_group || 'B+'}</strong> • Phone: {curMember.phone || 'N/A'}
                    </div>
                    {curMember.emergencyContact?.name && (
                      <div style={{ color: 'var(--doctor-text-secondary)' }}>
                        <strong>Emergency Contact:</strong> {curMember.emergencyContact.name} ({curMember.emergencyContact.relationship || 'Guardian'})
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Option B: Add New Patient */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--doctor-soft-teal)', borderRadius: '8px', fontSize: '12.5px', color: 'var(--doctor-text-primary)' }}>
                ℹ <strong>New Walk-in Patient Registration:</strong> Registers an encounter clinical profile for this visit. Consent boundaries remain protected for historical records.
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

        <div className="doctor-modal-footer" style={{ flexShrink: 0 }}>
          <button type="button" className="doctor-btn doctor-btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="doctor-btn doctor-btn-primary"
            disabled={submitting || (patientMode === 'existing' && (!selectedFamilyId || !selectedMemberId))}
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
  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

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
