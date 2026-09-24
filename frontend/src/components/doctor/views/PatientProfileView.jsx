import React, { useState } from 'react';

export function PatientProfileView({
  patient,
  consultations = [],
  prescriptions = [],
  onBack,
  onOpenNewConsultation,
  onOpenNewPrescription,
  onOpenAiExplain,
}) {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedRecord, setSelectedRecord] = useState(null);

  if (!patient) {
    return (
      <div className="doctor-card" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Patient not found or unauthorized.</p>
        <button className="doctor-btn doctor-btn-primary" onClick={onBack}>
          Back to Patients List
        </button>
      </div>
    );
  }

  const patientConsultations = consultations.filter((c) => c.patientId === patient.id);
  const patientPrescriptions = prescriptions.filter((p) => p.patientId === patient.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar with Back button and Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button className="doctor-btn doctor-btn-outline" onClick={onBack}>
          &larr; Back to Authorized Patients
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="doctor-btn doctor-btn-primary" onClick={() => onOpenNewConsultation(patient)}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start Consultation
          </button>
          <button className="doctor-btn doctor-btn-outline" onClick={() => onOpenNewPrescription(patient)}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Write Prescription
          </button>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="doctor-avatar-circle" style={{ width: '56px', height: '56px', fontSize: '18px' }}>
              {patient.name.split(' ').map((p) => p[0]).join('')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--doctor-text-primary)' }}>
                  {patient.name}
                </h2>
                <span className="doctor-badge doctor-badge-active">
                  ● Authorized Access
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--doctor-text-muted)', marginTop: '3px' }}>
                {patient.gender} • {patient.age} years (DOB: {patient.dob}) • Blood Group: <strong style={{ color: 'var(--doctor-primary)' }}>{patient.bloodGroup}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
                Emergency Contact: {patient.emergencyContact} • Phone: {patient.phone}
              </div>
            </div>
          </div>

          <div style={{ padding: '10px 16px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '8px', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Authorization Scope</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--doctor-primary)', marginTop: '2px' }}>{patient.accessScope}</div>
            <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)' }}>Granted on {patient.accessGrantedDate}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="doctor-card">
        <div className="doctor-tabs">
          <button
            className={`doctor-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Clinical Summary & Vitals
          </button>
          <button
            className={`doctor-tab-btn ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            Medical Records ({patient.medicalRecords?.length || 0})
          </button>
          <button
            className={`doctor-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI Predictions ({patient.aiPredictions?.length || 0})
          </button>
          <button
            className={`doctor-tab-btn ${activeTab === 'consultations' ? 'active' : ''}`}
            onClick={() => setActiveTab('consultations')}
          >
            Consultations History ({patientConsultations.length})
          </button>
          <button
            className={`doctor-tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescriptions')}
          >
            Prescriptions ({patientPrescriptions.length})
          </button>
        </div>

        {/* Tab 1: Clinical Summary & Vitals */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Vitals */}
              <div style={{ padding: '16px', backgroundColor: 'var(--doctor-bg)', borderRadius: '10px', border: '1px solid var(--doctor-border)' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
                  Current Baseline Vitals
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--doctor-text-muted)', display: 'block', fontSize: '11.5px' }}>Blood Pressure</span>
                    <strong>{patient.vitals?.bp || '120/80 mmHg'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--doctor-text-muted)', display: 'block', fontSize: '11.5px' }}>Heart / Pulse Rate</span>
                    <strong>{patient.vitals?.pulse || '72 bpm'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--doctor-text-muted)', display: 'block', fontSize: '11.5px' }}>Body Temp</span>
                    <strong>{patient.vitals?.temp || '98.6 °F'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--doctor-text-muted)', display: 'block', fontSize: '11.5px' }}>Weight / Height</span>
                    <strong>{patient.vitals?.weight} / {patient.vitals?.height}</strong>
                  </div>
                </div>
              </div>

              {/* Allergies & Chronic Conditions */}
              <div style={{ padding: '16px', backgroundColor: 'var(--doctor-bg)', borderRadius: '10px', border: '1px solid var(--doctor-border)' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
                  Allergies & Risk Factors
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--doctor-coral)', fontWeight: 600, display: 'block', fontSize: '12px' }}>
                      ⚠ Drug / Substance Allergies:
                    </span>
                    <span>{patient.allergies?.join(', ') || 'No known allergies reported'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--doctor-text-muted)', fontWeight: 600, display: 'block', fontSize: '12px' }}>
                      Chronic Diagnoses:
                    </span>
                    <span>{patient.chronicConditions?.join(', ') || 'None recorded'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 16px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '8px', borderLeft: '4px solid var(--doctor-primary)' }}>
              <strong style={{ fontSize: '13px', color: 'var(--doctor-text-primary)' }}>Chief Complaint: </strong>
              <span style={{ fontSize: '13px', color: 'var(--doctor-text-secondary)' }}>{patient.chiefComplaint}</span>
            </div>
          </div>
        )}

        {/* Tab 2: Medical Records */}
        {activeTab === 'records' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {patient.medicalRecords?.length === 0 ? (
              <p style={{ color: 'var(--doctor-text-muted)', fontSize: '13px' }}>No medical records uploaded for this patient.</p>
            ) : (
              patient.medicalRecords.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '14px 16px',
                    border: '1px solid var(--doctor-border)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--doctor-bg)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="doctor-badge doctor-badge-draft">{rec.type}</span>
                      <strong style={{ fontSize: '14px', color: 'var(--doctor-text-primary)' }}>{rec.title}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginTop: '4px' }}>
                      {rec.date} • {rec.uploader} • Size: {rec.fileSize}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-secondary)', marginTop: '4px' }}>
                      {rec.summary}
                    </div>
                  </div>

                  <button
                    className="doctor-btn doctor-btn-outline doctor-btn-sm"
                    onClick={() => setSelectedRecord(rec)}
                  >
                    View Report
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: AI Predictions & Explainability */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {patient.aiPredictions?.length === 0 ? (
              <p style={{ color: 'var(--doctor-text-muted)', fontSize: '13px' }}>No AI predictions available for this patient.</p>
            ) : (
              patient.aiPredictions.map((pred) => (
                <div
                  key={pred.id}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--doctor-border)',
                    borderRadius: '10px',
                    backgroundColor: pred.riskLevel === 'High' ? 'var(--doctor-soft-coral)' : 'var(--doctor-soft-teal)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="doctor-badge doctor-badge-scheduled">{pred.pipeline}</span>
                        <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>Date: {pred.date}</span>
                      </div>
                      <h4 style={{ margin: '6px 0 2px', fontSize: '16px', fontWeight: 800, color: 'var(--doctor-text-primary)' }}>
                        {pred.finding}
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                        Target: {pred.targetOrgan} • Engine: {pred.modelEngine || 'Deep CNN'}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: pred.riskLevel === 'High' ? 'var(--doctor-coral)' : 'var(--doctor-teal)' }}>
                        {pred.confidence}%
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)' }}>Confidence</div>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-secondary)', lineHeight: 1.4 }}>
                    {pred.explanation}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '6px' }}>
                    {pred.gradCamAvailable && (
                      <button
                        className="doctor-btn doctor-btn-primary doctor-btn-sm"
                        onClick={() => onOpenAiExplain(pred, patient.name)}
                      >
                        Launch Grad-CAM Heatmap Analysis &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Consultations History */}
        {activeTab === 'consultations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {patientConsultations.length === 0 ? (
              <p style={{ color: 'var(--doctor-text-muted)', fontSize: '13px' }}>No previous consultations on record for this patient.</p>
            ) : (
              patientConsultations.map((cons) => (
                <div
                  key={cons.id}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--doctor-border)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--doctor-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: 'var(--doctor-primary)', fontSize: '13px' }}>
                        {cons.consultationNumber}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginLeft: '8px' }}>
                        {cons.date}
                      </span>
                    </div>
                    <span className={`doctor-badge doctor-badge-${cons.status.toLowerCase()}`}>
                      {cons.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
                    Diagnosis: {cons.diagnosis}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--doctor-text-secondary)', whiteSpace: 'pre-line' }}>
                    <strong>Treatment Plan:</strong><br />
                    {cons.treatmentPlan}
                  </div>

                  {cons.amendments && cons.amendments.length > 0 && (
                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '6px', fontSize: '12px' }}>
                      <strong>Amendments ({cons.amendments.length}):</strong>
                      {cons.amendments.map((a) => (
                        <div key={a.id} style={{ marginTop: '4px' }}>
                          • {a.date}: {a.reason} — {a.clinicalAddendum}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Prescriptions */}
        {activeTab === 'prescriptions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {patientPrescriptions.length === 0 ? (
              <p style={{ color: 'var(--doctor-text-muted)', fontSize: '13px' }}>No active prescriptions issued for this patient.</p>
            ) : (
              patientPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--doctor-border)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--doctor-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: 'var(--doctor-teal)', fontSize: '13px' }}>
                        {rx.prescriptionNumber}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginLeft: '8px' }}>
                        Issued on {rx.date}
                      </span>
                    </div>
                    <span className={`doctor-badge doctor-badge-${rx.status.toLowerCase()}`}>
                      {rx.status}
                    </span>
                  </div>

                  <div className="doctor-table-container">
                    <table className="doctor-table">
                      <thead>
                        <tr>
                          <th>Medication</th>
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
                      <strong>Remarks:</strong> {rx.remarks}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Record Preview Modal */}
      {selectedRecord && (
        <div className="doctor-modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="doctor-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="doctor-modal-header">
              <h3 className="doctor-modal-title">{selectedRecord.title}</h3>
              <button className="doctor-btn-icon" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>
            <div className="doctor-modal-body">
              <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-muted)' }}>
                {selectedRecord.category} • {selectedRecord.date} • {selectedRecord.uploader}
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--doctor-text-primary)', marginTop: '10px', lineHeight: 1.5 }}>
                {selectedRecord.summary}
              </p>
            </div>
            <div className="doctor-modal-footer">
              <button className="doctor-btn doctor-btn-primary" onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientProfileView;
