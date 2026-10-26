import React, { useState } from 'react';

function ConsultationForm({
  initialData,
  patients = [],
  appointments = [],
  consultations = [],
  onSaveDraft,
  onFinalize,
  onClose,
}) {
  const completedAppointments = appointments.filter((a) => a.status === 'Completed' || a.status === 'COMPLETED');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(
    initialData?.appointmentId || (completedAppointments[0]?.id || '')
  );
  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    appointmentId: initialData?.appointmentId || (completedAppointments[0]?.id || ''),
    patientId: initialData?.patientId || (completedAppointments[0]?.patientId || patients[0]?.id || ''),
    symptoms: initialData?.symptoms || '',
    observations: initialData?.observations || '',
    diagnosis: initialData?.diagnosis || '',
    treatmentPlan: initialData?.treatmentPlan || '',
    doctorNotes: initialData?.doctorNotes || '',
    followUpDate: initialData?.followUpDate || '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedPatient = patients.find((p) => p.id === formData.patientId) || patients[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDraftSubmit = async (e) => {
    e.preventDefault();
    const targetAppt = appointments.find((a) => a.id === selectedAppointmentId);
    if (!targetAppt || (targetAppt.status !== 'Completed' && targetAppt.status !== 'COMPLETED')) {
      setError('Consultation can only be created for completed appointments. Please complete the appointment first.');
      return;
    }
    if (!formData.symptoms.trim()) {
      setError('Please provide chief clinical presentation & symptoms.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSaveDraft({
        ...formData,
        appointmentId: selectedAppointmentId,
        patientName: selectedPatient?.name || 'Patient',
      });
      onClose();
    } catch {
      setError('Failed to save consultation draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeSubmit = async () => {
    const targetAppt = appointments.find((a) => a.id === selectedAppointmentId);
    if (!targetAppt || (targetAppt.status !== 'Completed' && targetAppt.status !== 'COMPLETED')) {
      setError('Consultation can only be created for completed appointments. Please complete the appointment first.');
      return;
    }
    if (!formData.symptoms.trim() || !formData.diagnosis.trim()) {
      setError('Clinical diagnosis and chief symptoms are required to finalize a medical consultation.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onFinalize({
        ...formData,
        appointmentId: selectedAppointmentId,
        patientName: selectedPatient?.name || 'Patient',
      });
      onClose();
    } catch {
      setError('Failed to finalize consultation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
      <div className="doctor-modal-header">
        <div>
          <h3 className="doctor-modal-title">
            {initialData?.id ? 'Edit Consultation Draft' : 'New Clinical Consultation'}
          </h3>
          <div className="doctor-card-description">
            Orthopedic clinical assessment, diagnosis, and treatment planning
          </div>
        </div>
        <button className="doctor-btn-icon" onClick={onClose} aria-label="Close modal">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="doctor-modal-body">
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--doctor-error-bg)', color: 'var(--doctor-error)', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Completed Encounter Selection */}
        <div className="doctor-form-group">
          <label className="doctor-label">Associated Completed Encounter *</label>
          <select
            className="doctor-select"
            value={selectedAppointmentId}
            onChange={(e) => {
              const aId = e.target.value;
              setSelectedAppointmentId(aId);
              const appt = appointments.find((a) => a.id === aId);
              if (appt) {
                setFormData((prev) => ({ ...prev, appointmentId: aId, patientId: appt.patientId }));
              }
            }}
            disabled={!!initialData?.appointmentId}
          >
            {completedAppointments.length === 0 ? (
              <option value="">-- No completed appointments available --</option>
            ) : (
              completedAppointments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.token} — {a.patientName} ({a.date} • {a.type})
                </option>
              ))
            )}
          </select>
        </div>

        {completedAppointments.length === 0 && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fffbeb', color: '#92400e', fontSize: '12.5px', border: '1px solid #fde68a' }}>
            ⚠️ <strong>Encounter Requirement:</strong> Consultations can only be recorded for Completed appointments. Please mark an appointment as Completed first.
          </div>
        )}

        <div className="doctor-form-group">
          <label className="doctor-label">Patient *</label>
          <select
            className="doctor-select"
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            disabled={!!initialData?.patientId || !!selectedAppointmentId}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.gender}, {p.age}y — Blood {p.bloodGroup} • ID: {p.id})
              </option>
            ))}
          </select>
        </div>

        {/* Patient Vitals Quick Banner */}
        {selectedPatient?.vitals && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
            <span><strong>BP:</strong> {selectedPatient.vitals.bp}</span>
            <span><strong>Pulse:</strong> {selectedPatient.vitals.pulse}</span>
            <span><strong>Temp:</strong> {selectedPatient.vitals.temp}</span>
            <span><strong>Weight:</strong> {selectedPatient.vitals.weight}</span>
            <span style={{ color: 'var(--doctor-coral)', fontWeight: 600 }}>
              <strong>Allergies:</strong> {selectedPatient.allergies?.join(', ') || 'None'}
            </span>
          </div>
        )}

        <div className="doctor-form-group">
          <label className="doctor-label">Chief Symptoms & Clinical Presentation *</label>
          <textarea
            className="doctor-textarea"
            name="symptoms"
            rows="2"
            placeholder="e.g. Pain in medial compartment of right knee on weight-bearing..."
            value={formData.symptoms}
            onChange={handleChange}
            required
          />
        </div>

        <div className="doctor-form-group">
          <label className="doctor-label">Physical Examination Observations & Range of Motion</label>
          <textarea
            className="doctor-textarea"
            name="observations"
            rows="2"
            placeholder="e.g. Tenderness at medial joint line, no effusion, McMurray negative..."
            value={formData.observations}
            onChange={handleChange}
          />
        </div>

        <div className="doctor-form-group">
          <label className="doctor-label">Clinical Diagnosis & ICD-10 Code *</label>
          <input
            className="doctor-input"
            name="diagnosis"
            placeholder="e.g. Early Primary Osteoarthritis, Right Knee (ICD-10 M17.11)"
            value={formData.diagnosis}
            onChange={handleChange}
            required
          />
        </div>

        <div className="doctor-form-group">
          <label className="doctor-label">Treatment Plan, Exercises & Advice</label>
          <textarea
            className="doctor-textarea"
            name="treatmentPlan"
            rows="3"
            placeholder="1. Quadriceps isometric exercises&#10;2. Low impact cycling&#10;3. Avoid squatting"
            value={formData.treatmentPlan}
            onChange={handleChange}
          />
        </div>

        <div className="doctor-form-row">
          <div className="doctor-form-group">
            <label className="doctor-label">Doctor Private Clinical Notes</label>
            <input
              className="doctor-input"
              name="doctorNotes"
              placeholder="Internal surgical or progress notes"
              value={formData.doctorNotes}
              onChange={handleChange}
            />
          </div>

          <div className="doctor-form-group">
            <label className="doctor-label">Follow-up Date Recommendation</label>
            <input
              type="date"
              className="doctor-input"
              name="followUpDate"
              value={formData.followUpDate}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="doctor-modal-footer">
        <button type="button" className="doctor-btn doctor-btn-outline" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="doctor-btn doctor-btn-outline"
          onClick={handleDraftSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type="button"
          className="doctor-btn doctor-btn-primary"
          onClick={handleFinalizeSubmit}
          disabled={submitting}
        >
          {submitting ? 'Finalizing...' : 'Finalize & Sign (Immutable)'}
        </button>
      </div>
    </div>
  );
}

export function NewConsultationModal({
  isOpen,
  initialData,
  patients = [],
  onSaveDraft,
  onFinalize,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="doctor-modal-overlay" onClick={onClose}>
      <ConsultationForm
        key={initialData?.id || 'new_cons'}
        initialData={initialData}
        patients={patients}
        onSaveDraft={onSaveDraft}
        onFinalize={onFinalize}
        onClose={onClose}
      />
    </div>
  );
}

export default NewConsultationModal;
