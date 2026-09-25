import React, { useState } from 'react';

export function PatientProfileView({
  patient,
  consultations = [],
  prescriptions = [],
  onBack,
  onOpenNewConsultation,
  onOpenNewPrescription,
  onOpenAiExplain,
  onOpenFullAiAnalysis,
}) {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedRecord, setSelectedRecord] = useState(null);

  if (!patient) {
    return (
      <div className="doctor-card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--doctor-text-primary)' }}>Patient Not Found</h3>
        <p style={{ color: 'var(--doctor-text-muted)', fontSize: '13.5px', marginBottom: '20px' }}>
          This patient record does not exist or you do not have active clinical authorization.
        </p>
        <button className="doctor-btn doctor-btn-primary" onClick={onBack}>
          &larr; Back to Authorized Patients
        </button>
      </div>
    );
  }

  const patientConsultations = consultations.filter((c) => c.patientId === patient.id);
  const patientPrescriptions = prescriptions.filter((p) => p.patientId === patient.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar with Navigation & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button className="doctor-btn doctor-btn-outline" onClick={onBack}>
          &larr; Back to Authorized Patients
        </button>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="doctor-btn doctor-btn-primary" onClick={() => onOpenNewConsultation(patient)}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start Clinical Consultation
          </button>
          <button className="doctor-btn doctor-btn-outline" onClick={() => onOpenNewPrescription(patient)}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Issue Prescription
          </button>
        </div>
      </div>

      {/* Patient Master Identity Header */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              className="doctor-avatar-circle"
              style={{
                width: '64px',
                height: '64px',
                fontSize: '20px',
                background: 'linear-gradient(135deg, #2563eb, #0f766e)',
              }}
            >
              {patient.name.split(' ').map((p) => p[0]).join('')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--doctor-text-primary)' }}>
                  {patient.name}
                </h2>
                <span className="doctor-badge doctor-badge-active">
                  ● Active Authorization
                </span>
                <span className="doctor-badge doctor-badge-scheduled">
                  {patient.relationship || 'Family Member'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--doctor-text-muted)', marginTop: '4px' }}>
                Patient ID: <strong style={{ color: 'var(--doctor-text-secondary)', fontFamily: 'monospace' }}>{patient.id}</strong> • Family Group: <strong style={{ color: 'var(--doctor-text-secondary)', fontFamily: 'monospace' }}>{patient.familyId}</strong>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-secondary)', marginTop: '2px' }}>
                Emergency: <strong>{patient.emergencyContact}</strong> • Contact: <strong>{patient.phone}</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 18px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '10px', border: '1px solid var(--doctor-border)', textAlign: 'right' }}>
            <div className="doctor-info-label" style={{ color: 'var(--doctor-primary)' }}>Consent Scope</div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--doctor-text-primary)', marginTop: '2px' }}>
              {patient.accessScope}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
              Authorized on {patient.accessGrantedDate}
            </div>
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
            Clinical Overview & Vitals
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
            AI Decision Support ({patient.aiPredictions?.length || 0})
          </button>
          <button
            className={`doctor-tab-btn ${activeTab === 'consultations' ? 'active' : ''}`}
            onClick={() => setActiveTab('consultations')}
          >
            Consultation History ({patientConsultations.length})
          </button>
          <button
            className={`doctor-tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescriptions')}
          >
            Prescriptions ({patientPrescriptions.length})
          </button>
          <button
            className={`doctor-tab-btn ${activeTab === 'authorization' ? 'active' : ''}`}
            onClick={() => setActiveTab('authorization')}
          >
            Consent & Access Log
          </button>
        </div>

        {/* Tab 1: Clinical Overview & Vitals */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Chief Complaint Callout */}
            <div style={{ padding: '14px 18px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '10px', borderLeft: '4px solid var(--doctor-primary)' }}>
              <div className="doctor-info-label" style={{ color: 'var(--doctor-primary)', marginBottom: '4px' }}>
                Chief Presenting Complaint
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--doctor-text-primary)', lineHeight: 1.4 }}>
                {patient.chiefComplaint}
              </div>
            </div>

            {/* Section 1: Personal Information Grid */}
            <div>
              <div className="doctor-section-header">
                <h4 className="doctor-section-title">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--doctor-primary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h4>
              </div>

              <div className="doctor-info-grid">
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Full Legal Name</span>
                  <span className="doctor-info-value">{patient.name}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Date of Birth</span>
                  <span className="doctor-info-value">{patient.dob || '14 May 1984'}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Age / Gender</span>
                  <span className="doctor-info-value">{patient.age} yrs • {patient.gender}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Blood Group</span>
                  <span className="doctor-info-value highlight">{patient.bloodGroup}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Primary Phone</span>
                  <span className="doctor-info-value">{patient.phone}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Email Address</span>
                  <span className="doctor-info-value" style={{ wordBreak: 'break-all' }}>{patient.email}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Emergency Contact</span>
                  <span className="doctor-info-value">{patient.emergencyContact}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Family Relation</span>
                  <span className="doctor-info-value">{patient.relationship || 'Primary Member'}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Clinical Baseline Vitals Grid */}
            <div>
              <div className="doctor-section-header">
                <h4 className="doctor-section-title">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--doctor-teal)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Baseline Clinical Vitals & Biometrics
                </h4>
              </div>

              <div className="doctor-info-grid">
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Blood Pressure</span>
                  <span className="doctor-info-value teal">{patient.vitals?.bp || '120/80 mmHg'}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Pulse / Heart Rate</span>
                  <span className="doctor-info-value teal">{patient.vitals?.pulse || '72 bpm'}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Body Temperature</span>
                  <span className="doctor-info-value">{patient.vitals?.temp || '98.6 °F'}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Body Weight</span>
                  <span className="doctor-info-value">{patient.vitals?.weight || '64 kg'}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Height</span>
                  <span className="doctor-info-value">{patient.vitals?.height || '162 cm'}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Recent Consultation</span>
                  <span className="doctor-info-value">{patient.recentConsultationDate || '24 Sep 2026'}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Allergies & Chronic Conditions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--doctor-soft-coral)', borderRadius: '10px', border: '1px solid rgba(225, 29, 72, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--doctor-coral)', fontSize: '16px' }}>⚠</span>
                  <strong style={{ fontSize: '13.5px', color: 'var(--doctor-coral)' }}>Known Drug & Substance Allergies</strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {patient.allergies && patient.allergies.length > 0 ? (
                    patient.allergies.map((allergy, idx) => (
                      <span key={idx} className="doctor-badge doctor-badge-high" style={{ fontSize: '12px' }}>
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--doctor-text-muted)' }}>No known allergies reported.</span>
                  )}
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'var(--doctor-bg)', borderRadius: '10px', border: '1px solid var(--doctor-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--doctor-primary)', fontSize: '16px' }}>📋</span>
                  <strong style={{ fontSize: '13.5px', color: 'var(--doctor-text-primary)' }}>Chronic Diagnoses & Co-morbidities</strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                    patient.chronicConditions.map((condition, idx) => (
                      <span key={idx} className="doctor-badge doctor-badge-scheduled" style={{ fontSize: '12px' }}>
                        {condition}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--doctor-text-muted)' }}>No chronic conditions recorded.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Medical Records */}
        {activeTab === 'records' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {patient.medicalRecords?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--doctor-text-muted)' }}>
                No medical records uploaded for this patient.
              </div>
            ) : (
              patient.medicalRecords.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--doctor-border)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--doctor-bg)',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="doctor-badge doctor-badge-draft">{rec.type}</span>
                      <strong style={{ fontSize: '14.5px', color: 'var(--doctor-text-primary)' }}>{rec.title}</strong>
                      {rec.aiScreened && (
                        <span className="doctor-badge doctor-badge-completed" style={{ fontSize: '11px' }}>
                          🤖 AI Screened
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginTop: '4px' }}>
                      {rec.category} • Date: {rec.date} • {rec.uploader} • Size: {rec.fileSize}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--doctor-text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                      {rec.summary}
                    </div>
                  </div>

                  <button
                    className="doctor-btn doctor-btn-primary doctor-btn-sm"
                    onClick={() => setSelectedRecord(rec)}
                  >
                    View Report & Telemetry
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
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--doctor-text-muted)' }}>
                No AI predictions available for this patient.
              </div>
            ) : (
              patient.aiPredictions.map((pred) => (
                <div
                  key={pred.id}
                  style={{
                    padding: '18px',
                    border: '1px solid var(--doctor-border)',
                    borderRadius: '10px',
                    backgroundColor: pred.riskLevel === 'High' ? 'var(--doctor-soft-coral)' : 'var(--doctor-soft-teal)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="doctor-badge doctor-badge-scheduled">{pred.pipeline}</span>
                        <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>Screened: {pred.date}</span>
                      </div>
                      <h4 style={{ margin: '8px 0 2px', fontSize: '17px', fontWeight: 800, color: 'var(--doctor-text-primary)' }}>
                        {pred.finding}
                      </h4>
                      <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-muted)' }}>
                        Target: <strong>{pred.targetOrgan}</strong> • Engine: <strong>{pred.modelEngine || 'ResNet50-Ortho-v2.4'}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: pred.riskLevel === 'High' ? 'var(--doctor-coral)' : 'var(--doctor-teal)' }}>
                        {pred.confidence}%
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)', fontWeight: 600 }}>Confidence</div>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-secondary)', lineHeight: 1.5, backgroundColor: 'var(--doctor-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--doctor-border)' }}>
                    <strong>Clinical Saliency Interpretation:</strong> {pred.explanation}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px', flexWrap: 'wrap' }}>
                    {onOpenAiExplain && (
                      <button
                        type="button"
                        className="doctor-btn doctor-btn-outline doctor-btn-sm"
                        onClick={() => onOpenAiExplain(pred, patient.name)}
                      >
                        AI Summary
                      </button>
                    )}
                    {onOpenFullAiAnalysis ? (
                      <button
                        type="button"
                        className="doctor-btn doctor-btn-primary doctor-btn-sm"
                        onClick={() => onOpenFullAiAnalysis(pred, patient.id, 'patient_profile')}
                      >
                        View Full AI Analysis &rarr;
                      </button>
                    ) : (
                      pred.gradCamAvailable && (
                        <button
                          type="button"
                          className="doctor-btn doctor-btn-primary doctor-btn-sm"
                          onClick={() => onOpenAiExplain(pred, patient.name)}
                        >
                          Launch Grad-CAM Heatmap Analysis &rarr;
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Consultations History */}
        {activeTab === 'consultations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {patientConsultations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--doctor-text-muted)' }}>
                No previous clinical consultations on record for this patient.
              </div>
            ) : (
              patientConsultations.map((cons) => (
                <div
                  key={cons.id}
                  style={{
                    padding: '18px',
                    border: '1px solid var(--doctor-border)',
                    borderRadius: '10px',
                    backgroundColor: 'var(--doctor-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--doctor-primary)', fontSize: '14px' }}>
                        {cons.consultationNumber}
                      </span>
                      <span className={`doctor-badge doctor-badge-${cons.status.toLowerCase()}`}>
                        ● {cons.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                      Consultation Date: <strong>{cons.date}</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
                    Diagnosis: {cons.diagnosis}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '13px' }}>
                    <div className="doctor-info-tile">
                      <span className="doctor-info-label">Chief Symptoms</span>
                      <span style={{ fontSize: '13px', color: 'var(--doctor-text-secondary)', lineHeight: 1.4 }}>{cons.symptoms}</span>
                    </div>
                    <div className="doctor-info-tile">
                      <span className="doctor-info-label">Physical Observations</span>
                      <span style={{ fontSize: '13px', color: 'var(--doctor-text-secondary)', lineHeight: 1.4 }}>{cons.observations}</span>
                    </div>
                  </div>

                  {cons.treatmentPlan && (
                    <div style={{ padding: '12px 14px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '8px', fontSize: '13px' }}>
                      <strong style={{ color: 'var(--doctor-primary)' }}>Treatment Plan & Follow-up ({cons.followUpDate || 'TBD'}):</strong>
                      <p style={{ margin: '4px 0 0', color: 'var(--doctor-text-primary)', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                        {cons.treatmentPlan}
                      </p>
                    </div>
                  )}

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
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Prescriptions */}
        {activeTab === 'prescriptions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {patientPrescriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--doctor-text-muted)' }}>
                No active electronic prescriptions issued for this patient.
              </div>
            ) : (
              patientPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  style={{
                    padding: '18px',
                    border: '1px solid var(--doctor-border)',
                    borderRadius: '10px',
                    backgroundColor: 'var(--doctor-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--doctor-teal)', fontSize: '14px' }}>
                        {rx.prescriptionNumber}
                      </span>
                      <span className={`doctor-badge doctor-badge-${rx.status.toLowerCase()}`}>
                        ● {rx.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                      Prescription Date: <strong>{rx.date}</strong>
                    </div>
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
                      <strong>Doctor Remarks:</strong> {rx.remarks}
                    </div>
                  )}

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
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 6: Consent & Access Log */}
        {activeTab === 'authorization' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '10px', border: '1px solid var(--doctor-border)' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
                ABDM & Privacy Consent Parameters
              </h4>
              <div className="doctor-info-grid">
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Authorization Status</span>
                  <span className="doctor-info-value highlight">● {patient.accessStatus}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Access Granted Date</span>
                  <span className="doctor-info-value">{patient.accessGrantedDate}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Granted Scope</span>
                  <span className="doctor-info-value">{patient.accessScope}</span>
                </div>
                <div className="doctor-info-tile">
                  <span className="doctor-info-label">Authorizing Account</span>
                  <span className="doctor-info-value">{patient.emergencyContact || 'Family Portal'}</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-muted)', lineHeight: 1.5, padding: '12px 14px', backgroundColor: 'var(--doctor-bg)', borderRadius: '8px', border: '1px solid var(--doctor-border)' }}>
              <strong>Clinical Access Policy:</strong> Access to this patient’s electronic health records, imaging studies, and AI decision telemetry is bounded by the current clinical session and family permission. Clinical records created during consultations become immutable permanent health records.
            </div>
          </div>
        )}
      </div>

      {/* Record Preview Modal */}
      {selectedRecord && (
        <div className="doctor-modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
            <div className="doctor-modal-header">
              <div>
                <span className="doctor-badge doctor-badge-draft">{selectedRecord.type}</span>
                <h3 className="doctor-modal-title" style={{ marginTop: '4px' }}>
                  {selectedRecord.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                  {selectedRecord.category} • Date: {selectedRecord.date} • Uploaded by: {selectedRecord.uploader}
                </div>
              </div>
              <button className="doctor-btn-icon" onClick={() => setSelectedRecord(null)} aria-label="Close modal">
                ✕
              </button>
            </div>
            <div className="doctor-modal-body">
              <div style={{ padding: '14px 16px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '8px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--doctor-text-primary)' }}>Clinical Summary & Radiologist Notes:</strong>
                <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: 'var(--doctor-text-secondary)', lineHeight: 1.5 }}>
                  {selectedRecord.summary}
                </p>
              </div>

              {selectedRecord.imageUrl && (
                <div style={{ border: '1px solid var(--doctor-border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0f172a', padding: '16px', textAlign: 'center' }}>
                  <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    <span>Digital Radiograph ({selectedRecord.type}) Preview</span>
                  </div>
                </div>
              )}
            </div>
            <div className="doctor-modal-footer">
              <button className="doctor-btn doctor-btn-primary" onClick={() => setSelectedRecord(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientProfileView;
