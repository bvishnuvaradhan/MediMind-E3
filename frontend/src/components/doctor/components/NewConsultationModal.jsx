import React, { useState } from 'react';

function ConsultationForm({
  initialData,
  patients = [],
  appointments = [],
  onSaveDraft,
  onFinalize,
  onClose,
}) {
  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    patientId: initialData?.patientId || (patients[0]?.id || ''),
    appointmentId: initialData?.appointmentId || '',
    symptoms: initialData?.symptoms || '',
    observations: initialData?.observations || '',
    diagnosis: initialData?.diagnosis || '',
    aiPredictionReviewed: initialData?.aiPredictionReviewed || 'Fracture Detection CNN validated (No cortical bone discontinuity observed).',
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
    if (!formData.patientId || !formData.symptoms.trim()) {
      setError('Please select a patient and provide chief symptoms.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSaveDraft({
        ...formData,
        patientName: selectedPatient?.name || 'Authorized Patient',
      });
      onClose();
    } catch {
      setError('Failed to save consultation draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeSubmit = async () => {
    if (!formData.patientId || !formData.symptoms.trim() || !formData.diagnosis.trim()) {
      setError('Diagnosis and symptoms are required to finalize a medical consultation.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onFinalize({
        ...formData,
        patientName: selectedPatient?.name || 'Authorized Patient',
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

        <div className="doctor-form-row">
          <div className="doctor-form-group">
            <label className="doctor-label">Authorized Patient *</label>
            <select
              className="doctor-select"
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              disabled={!!initialData?.patientId}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.gender}, {p.age}y - Blood {p.bloodGroup})
                </option>
              ))}
            </select>
          </div>

          <div className="doctor-form-group">
            <label className="doctor-label">Linked Appointment Slot</label>
            <select
              className="doctor-select"
              name="appointmentId"
              value={formData.appointmentId}
              onChange={handleChange}
            >
              <option value="">-- Standalone Consultation --</option>
              {appointments
                .filter((a) => a.patientId === formData.patientId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.token} ({a.time} - {a.type})
                  </option>
                ))}
            </select>
          </div>
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

        <div className="doctor-form-row">
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
            <label className="doctor-label">AI Diagnostic Decision Support Note</label>
            <input
              className="doctor-input"
              name="aiPredictionReviewed"
              placeholder="e.g. Fracture CNN reviewed (No cortical fracture, 94.8% confidence)"
              value={formData.aiPredictionReviewed}
              onChange={handleChange}
            />
          </div>
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
  appointments = [],
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
        appointments={appointments}
        onSaveDraft={onSaveDraft}
        onFinalize={onFinalize}
        onClose={onClose}
      />
    </div>
  );
}

export default NewConsultationModal;
