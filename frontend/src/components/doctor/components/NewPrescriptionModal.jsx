import React, { useState } from 'react';

function PrescriptionForm({
  initialData,
  patients = [],
  onSaveDraft,
  onFinalize,
  onClose,
}) {
  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    patientId: initialData?.patientId || (patients[0]?.id || ''),
    diagnosis: initialData?.diagnosis || 'Orthopedic Management',
    remarks: initialData?.remarks || 'Take medications after meals as prescribed.',
    medications: initialData?.medications || [
      {
        id: 'med_init_1',
        name: 'Tablet Calcium Citrate + Vit D3',
        dosage: '1250 mg',
        frequency: '1-0-0 (Morning after breakfast)',
        duration: '30 Days',
        instructions: 'Take with a full glass of water',
      },
    ],
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedPatient = patients.find((p) => p.id === formData.patientId) || patients[0];

  const handleAddMedication = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          id: `med_${Date.now()}`,
          name: '',
          dosage: '',
          frequency: '1-0-1 (After meals)',
          duration: '7 Days',
          instructions: 'Take after food',
        },
      ],
    }));
  };

  const handleRemoveMedication = (id) => {
    if (formData.medications.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((m) => m.id !== id),
    }));
  };

  const handleMedChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }));
  };

  const handleDraftSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      setError('Please select an authorized patient.');
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
      setError('Failed to save prescription draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeSubmit = async () => {
    if (!formData.patientId || formData.medications.some((m) => !m.name.trim())) {
      setError('Please provide medication names for all prescription rows.');
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
      setError('Failed to issue final prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
      <div className="doctor-modal-header">
        <div>
          <h3 className="doctor-modal-title">
            {initialData?.id ? 'Edit Prescription Draft' : 'Issue Medical Prescription'}
          </h3>
          <div className="doctor-card-description">
            Electronic prescription generation with dosage schedules and instructions
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
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
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
            <label className="doctor-label">Clinical Indication / Diagnosis</label>
            <input
              className="doctor-input"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="e.g. Right Knee Osteoarthritis"
            />
          </div>
        </div>

        {/* Allergy Warning */}
        {selectedPatient?.allergies && selectedPatient.allergies.length > 0 && (
          <div style={{ padding: '8px 12px', backgroundColor: 'var(--doctor-soft-coral)', borderRadius: '6px', fontSize: '12px', color: 'var(--doctor-coral)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚠</span>
            <strong>Known Patient Allergies:</strong> {selectedPatient.allergies.join(', ')}
          </div>
        )}

        {/* Medication Table */}
        <div className="doctor-form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="doctor-label" style={{ margin: 0 }}>Prescribed Medications</label>
            <button type="button" className="doctor-btn doctor-btn-outline doctor-btn-sm" onClick={handleAddMedication}>
              + Add Medicine Row
            </button>
          </div>

          <div className="doctor-table-container">
            <table className="doctor-table">
              <thead>
                <tr>
                  <th>Medicine Name *</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {formData.medications.map((med) => (
                  <tr key={med.id}>
                    <td>
                      <input
                        className="doctor-input"
                        placeholder="e.g. Tab Paracetamol"
                        value={med.name}
                        onChange={(e) => handleMedChange(med.id, 'name', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        className="doctor-input"
                        placeholder="650 mg"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(med.id, 'dosage', e.target.value)}
                        style={{ minWidth: '90px' }}
                      />
                    </td>
                    <td>
                      <input
                        className="doctor-input"
                        placeholder="1-0-1"
                        value={med.frequency}
                        onChange={(e) => handleMedChange(med.id, 'frequency', e.target.value)}
                        style={{ minWidth: '130px' }}
                      />
                    </td>
                    <td>
                      <input
                        className="doctor-input"
                        placeholder="5 Days"
                        value={med.duration}
                        onChange={(e) => handleMedChange(med.id, 'duration', e.target.value)}
                        style={{ minWidth: '90px' }}
                      />
                    </td>
                    <td>
                      <input
                        className="doctor-input"
                        placeholder="After food"
                        value={med.instructions}
                        onChange={(e) => handleMedChange(med.id, 'instructions', e.target.value)}
                      />
                    </td>
                    <td>
                      {formData.medications.length > 1 && (
                        <button
                          type="button"
                          className="doctor-btn-icon"
                          style={{ width: '28px', height: '28px', color: 'var(--doctor-coral)' }}
                          onClick={() => handleRemoveMedication(med.id)}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="doctor-form-group">
          <label className="doctor-label">Doctor Special Instructions & Lifestyle Remarks</label>
          <textarea
            className="doctor-textarea"
            rows="2"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="e.g. Drink plenty of water, avoid weight-bearing exercise for 10 days."
          />
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
          {submitting ? 'Issuing...' : 'Issue Final Prescription (Immutable)'}
        </button>
      </div>
    </div>
  );
}

export function NewPrescriptionModal({
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
      <PrescriptionForm
        key={initialData?.id || 'new_rx'}
        initialData={initialData}
        patients={patients}
        onSaveDraft={onSaveDraft}
        onFinalize={onFinalize}
        onClose={onClose}
      />
    </div>
  );
}

export default NewPrescriptionModal;
