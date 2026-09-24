import React, { useState } from 'react';

export function ConsultationsView({
  consultations = [],
  patients = [],
  onOpenNewConsultation,
  onAmendConsultation,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [amendingConsultation, setAmendingConsultation] = useState(null);
  const [amendmentForm, setAmendmentForm] = useState({
    reason: '',
    clinicalAddendum: '',
    updatedTreatmentPlan: '',
  });

  const filteredConsultations = consultations.filter((cons) => {
    const matchesStatus = statusFilter === 'All' || cons.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      cons.patientName.toLowerCase().includes(q) ||
      cons.consultationNumber.toLowerCase().includes(q) ||
      cons.diagnosis.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleStartAmend = (cons) => {
    setAmendingConsultation(cons);
    setAmendmentForm({
      reason: 'Additional radiographic observation review',
      clinicalAddendum: 'Follow-up plain radiograph reviewed post-splint application confirming adequate fracture reduction.',
      updatedTreatmentPlan: cons.treatmentPlan || '',
    });
  };

  const handleSaveAmendment = async (e) => {
    e.preventDefault();
    if (!amendmentForm.reason.trim() || !amendmentForm.clinicalAddendum.trim()) {
      return;
    }
    await onAmendConsultation(amendingConsultation.id, amendmentForm);
    setAmendingConsultation(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              Clinical Consultations & Medical Records
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Finalized clinical consultations are legally immutable — corrections are recorded as linked amendments
            </p>
          </div>
          <button className="doctor-btn doctor-btn-primary" onClick={() => onOpenNewConsultation()}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Consultation
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
                placeholder="Search by patient, consultation number, diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="doctor-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses (Draft, Final, Amended)</option>
              <option value="FINAL">FINAL (Immutable)</option>
              <option value="DRAFT">DRAFT (In Progress)</option>
              <option value="AMENDED">AMENDED</option>
            </select>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
            Showing <strong>{filteredConsultations.length}</strong> consultations
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredConsultations.length === 0 ? (
          <div className="doctor-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--doctor-text-muted)' }}>
            No consultations found matching current filter.
          </div>
        ) : (
          filteredConsultations.map((cons) => (
            <div key={cons.id} className="doctor-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--doctor-primary)', fontSize: '14px' }}>
                    {cons.consultationNumber}
                  </span>
                  <span className={`doctor-badge doctor-badge-${cons.status.toLowerCase()}`}>
                    ● {cons.status}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-muted)' }}>
                  Consultation Date: <strong>{cons.date}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--doctor-bg)', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>Authorized Patient:</span>
                  <strong style={{ fontSize: '14px', color: 'var(--doctor-text-primary)', marginLeft: '6px' }}>
                    {cons.patientName}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>Clinical Diagnosis:</span>
                  <strong style={{ fontSize: '13.5px', color: 'var(--doctor-text-primary)', marginLeft: '6px' }}>
                    {cons.diagnosis}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--doctor-text-muted)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Symptoms & Presentation</span>
                  <p style={{ margin: 0, color: 'var(--doctor-text-secondary)', lineHeight: 1.4 }}>{cons.symptoms}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--doctor-text-muted)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Observations & Assessment</span>
                  <p style={{ margin: 0, color: 'var(--doctor-text-secondary)', lineHeight: 1.4 }}>{cons.observations}</p>
                </div>
              </div>

              {cons.treatmentPlan && (
                <div style={{ padding: '10px 14px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '8px', fontSize: '13px' }}>
                  <strong style={{ color: 'var(--doctor-primary)' }}>Treatment Plan & Follow-Up ({cons.followUpDate || 'TBD'}):</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--doctor-text-primary)', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                    {cons.treatmentPlan}
                  </p>
                </div>
              )}

              {/* Amendments List */}
              {cons.amendments && cons.amendments.length > 0 && (
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--doctor-soft-teal)', borderRadius: '8px', borderLeft: '4px solid var(--doctor-teal)', fontSize: '12.5px' }}>
                  <strong style={{ color: 'var(--doctor-teal)' }}>Auditable Clinical Amendments:</strong>
                  {cons.amendments.map((am) => (
                    <div key={am.id} style={{ marginTop: '6px', color: 'var(--doctor-text-primary)' }}>
                      <strong>{am.amendmentNumber}</strong> ({am.date}) — <em>{am.reason}</em>: {am.clinicalAddendum}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--doctor-border)' }}>
                {cons.status === 'DRAFT' && (
                  <button
                    className="doctor-btn doctor-btn-primary doctor-btn-sm"
                    onClick={() => onOpenNewConsultation(patients.find((p) => p.id === cons.patientId), cons)}
                  >
                    Continue Draft & Finalize
                  </button>
                )}
                {cons.status !== 'DRAFT' && (
                  <button
                    className="doctor-btn doctor-btn-outline doctor-btn-sm"
                    onClick={() => handleStartAmend(cons)}
                  >
                    + Create Clinical Amendment
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Amendment Modal */}
      {amendingConsultation && (
        <div className="doctor-modal-overlay" onClick={() => setAmendingConsultation(null)}>
          <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
            <div className="doctor-modal-header">
              <div>
                <h3 className="doctor-modal-title">
                  Create Clinical Amendment for {amendingConsultation.consultationNumber}
                </h3>
                <div className="doctor-card-description">
                  Preserves original finalized consultation and appends an auditable addendum
                </div>
              </div>
              <button className="doctor-btn-icon" onClick={() => setAmendingConsultation(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveAmendment}>
              <div className="doctor-modal-body">
                <div className="doctor-form-group">
                  <label className="doctor-label">Reason for Amendment *</label>
                  <input
                    className="doctor-input"
                    value={amendmentForm.reason}
                    onChange={(e) => setAmendmentForm({ ...amendmentForm, reason: e.target.value })}
                    placeholder="e.g. Received secondary X-Ray report post-consultation"
                    required
                  />
                </div>

                <div className="doctor-form-group">
                  <label className="doctor-label">Clinical Addendum & Observation *</label>
                  <textarea
                    className="doctor-textarea"
                    rows="3"
                    value={amendmentForm.clinicalAddendum}
                    onChange={(e) => setAmendmentForm({ ...amendmentForm, clinicalAddendum: e.target.value })}
                    placeholder="Detailed explanation of updated findings..."
                    required
                  />
                </div>

                <div className="doctor-form-group">
                  <label className="doctor-label">Updated Treatment Plan (Optional)</label>
                  <textarea
                    className="doctor-textarea"
                    rows="3"
                    value={amendmentForm.updatedTreatmentPlan}
                    onChange={(e) => setAmendmentForm({ ...amendmentForm, updatedTreatmentPlan: e.target.value })}
                    placeholder="Adjusted medication or exercise regimen..."
                  />
                </div>
              </div>

              <div className="doctor-modal-footer">
                <button type="button" className="doctor-btn doctor-btn-outline" onClick={() => setAmendingConsultation(null)}>
                  Cancel
                </button>
                <button type="submit" className="doctor-btn doctor-btn-primary">
                  Sign & Append Amendment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultationsView;
