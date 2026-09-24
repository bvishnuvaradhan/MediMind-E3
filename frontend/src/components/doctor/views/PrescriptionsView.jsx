import React, { useState } from 'react';

export function PrescriptionsView({
  prescriptions = [],
  patients = [],
  onOpenNewPrescription,
  onCorrectPrescription,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [correctingRx, setCorrectingRx] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    reasonForCorrection: '',
    remarks: '',
  });

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesStatus = statusFilter === 'All' || rx.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      rx.patientName.toLowerCase().includes(q) ||
      rx.prescriptionNumber.toLowerCase().includes(q) ||
      rx.diagnosis.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleStartCorrect = (rx) => {
    setCorrectingRx(rx);
    setCorrectionForm({
      reasonForCorrection: 'Dosage adjustment based on patient renal profile review',
      remarks: 'Reduced frequency to once daily.',
    });
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!correctionForm.reasonForCorrection.trim()) return;
    await onCorrectPrescription(correctingRx.id, {
      ...correctionForm,
      adjustedMedications: correctingRx.medications,
    });
    setCorrectingRx(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              Prescriptions & Medication Management
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Finalized prescriptions are immutable in patient records — changes are tracked as linked corrections
            </p>
          </div>
          <button className="doctor-btn doctor-btn-primary" onClick={() => onOpenNewPrescription()}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Issue New Prescription
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="doctor-card" style={{ padding: '16px 20px' }}>
        <div className="doctor-filter-bar" style={{ margin: 0 }}>
          <div className="doctor-filter-left">
            <div className="doctor-search-input">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="Search prescription number, patient, medication..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="doctor-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses (Final, Corrected, Draft)</option>
              <option value="FINAL">FINAL</option>
              <option value="CORRECTED">CORRECTED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
            Showing <strong>{filteredPrescriptions.length}</strong> prescriptions
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredPrescriptions.length === 0 ? (
          <div className="doctor-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--doctor-text-muted)' }}>
            No prescriptions found matching current filter.
          </div>
        ) : (
          filteredPrescriptions.map((rx) => (
            <div key={rx.id} className="doctor-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--doctor-teal)', fontSize: '14px' }}>
                    {rx.prescriptionNumber}
                  </span>
                  <span className={`doctor-badge doctor-badge-${rx.status.toLowerCase()}`}>
                    ● {rx.status}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-muted)' }}>
                  Issued Date: <strong>{rx.date}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--doctor-bg)', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>Patient:</span>
                  <strong style={{ fontSize: '14px', color: 'var(--doctor-text-primary)', marginLeft: '6px' }}>
                    {rx.patientName}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>Indication:</span>
                  <strong style={{ fontSize: '13px', color: 'var(--doctor-text-primary)', marginLeft: '6px' }}>
                    {rx.diagnosis}
                  </strong>
                </div>
              </div>

              <div className="doctor-table-container">
                <table className="doctor-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.medications.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                        <td>{m.dosage}</td>
                        <td>{m.frequency}</td>
                        <td>{m.duration}</td>
                        <td>{m.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rx.remarks && (
                <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-secondary)' }}>
                  <strong>Doctor Remarks:</strong> {rx.remarks}
                </div>
              )}

              {/* Linked Corrections */}
              {rx.corrections && rx.corrections.length > 0 && (
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--doctor-soft-coral)', borderRadius: '8px', borderLeft: '4px solid var(--doctor-coral)', fontSize: '12.5px' }}>
                  <strong style={{ color: 'var(--doctor-coral)' }}>Linked Prescription Corrections:</strong>
                  {rx.corrections.map((c) => (
                    <div key={c.id} style={{ marginTop: '6px', color: 'var(--doctor-text-primary)' }}>
                      <strong>{c.correctionNumber}</strong> ({c.date}) — <em>{c.reasonForCorrection}</em>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--doctor-border)' }}>
                {rx.status !== 'DRAFT' && (
                  <button
                    className="doctor-btn doctor-btn-outline doctor-btn-sm"
                    onClick={() => handleStartCorrect(rx)}
                  >
                    + Issue Linked Prescription Correction
                  </button>
                )}
                {rx.status === 'DRAFT' && (
                  <button
                    className="doctor-btn doctor-btn-primary doctor-btn-sm"
                    onClick={() => onOpenNewPrescription(patients.find((p) => p.id === rx.patientId), rx)}
                  >
                    Continue Draft & Finalize
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Correction Modal */}
      {correctingRx && (
        <div className="doctor-modal-overlay" onClick={() => setCorrectingRx(null)}>
          <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
            <div className="doctor-modal-header">
              <div>
                <h3 className="doctor-modal-title">
                  Issue Correction for {correctingRx.prescriptionNumber}
                </h3>
                <div className="doctor-card-description">
                  Creates an auditable correction linked to the original prescription
                </div>
              </div>
              <button className="doctor-btn-icon" onClick={() => setCorrectingRx(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveCorrection}>
              <div className="doctor-modal-body">
                <div className="doctor-form-group">
                  <label className="doctor-label">Clinical Reason for Correction *</label>
                  <input
                    className="doctor-input"
                    value={correctionForm.reasonForCorrection}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, reasonForCorrection: e.target.value })}
                    placeholder="e.g. Changed dosage schedule to once daily due to tolerance"
                    required
                  />
                </div>

                <div className="doctor-form-group">
                  <label className="doctor-label">Updated Directions & Remarks</label>
                  <textarea
                    className="doctor-textarea"
                    rows="3"
                    value={correctionForm.remarks}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, remarks: e.target.value })}
                    placeholder="Provide specific revised instructions..."
                  />
                </div>
              </div>

              <div className="doctor-modal-footer">
                <button type="button" className="doctor-btn doctor-btn-outline" onClick={() => setCorrectingRx(null)}>
                  Cancel
                </button>
                <button type="submit" className="doctor-btn doctor-btn-primary">
                  Sign & Issue Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrescriptionsView;
