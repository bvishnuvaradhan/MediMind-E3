import React from 'react';
import StatCard from '../components/StatCard';

export function DashboardView({
  doctorProfile,
  patients = [],
  appointments = [],
  _consultations = [],
  onNavigate,
  onSelectPatient,
  onOpenNewConsultation,
  onOpenNewPrescription,
  onOpenAiExplain,
}) {
  const todayApts = appointments.filter((a) => a.date?.includes('Today'));
  const activePatients = patients.filter((p) => p.accessStatus === 'Active');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="doctor-card" style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(15, 118, 110, 0.05))', border: '1px solid rgba(37, 99, 235, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="doctor-badge doctor-badge-scheduled">{doctorProfile?.departmentName || 'Orthopedics'}</span>
              <span style={{ fontSize: '13px', color: 'var(--doctor-text-muted)' }}>{doctorProfile?.hospitalName || 'MediMind Central Hospital'} • {doctorProfile?.room || 'OPD Room 204'}</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              Clinical Workspace — {doctorProfile?.name || 'Dr. Rahul Mehta'}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-secondary)' }}>
              {doctorProfile?.specialization} • {doctorProfile?.qualification}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="doctor-btn doctor-btn-primary" onClick={onOpenNewConsultation}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Consultation
            </button>
            <button className="doctor-btn doctor-btn-outline" onClick={onOpenNewPrescription}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Issue Prescription
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="doctor-stat-grid">
        <StatCard
          label="Today's Appointments"
          value={todayApts.length || 3}
          tone="blue"
          change="100% Attended"
          changeType="positive"
          subtext="OPD consultation queue"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Authorized Patients"
          value={activePatients.length}
          tone="teal"
          change="Explicit Access"
          changeType="positive"
          subtext="Family authorized members"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Consultations Completed"
          value={doctorProfile?.totalConsultationsCompleted || 42}
          tone="indigo"
          change="★ 4.9 Satisfaction"
          changeType="positive"
          subtext="Total clinical records"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="AI Scans Screened"
          value="3"
          tone="coral"
          change="Fracture CNN Active"
          changeType="neutral"
          subtext="Decision support telemetry"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Two Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Today's Appointment Queue */}
        <div className="doctor-card">
          <div className="doctor-card-header">
            <div>
              <h3 className="doctor-card-title">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--doctor-primary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Today's Patient Queue ({todayApts.length})
              </h3>
              <div className="doctor-card-description">Live OPD consultation slots</div>
            </div>
            <button className="doctor-btn doctor-btn-ghost doctor-btn-sm" onClick={() => onNavigate('appointments')}>
              All Appointments &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {todayApts.map((apt) => (
              <div
                key={apt.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--doctor-bg)',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--doctor-border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--doctor-primary)', fontSize: '12.5px' }}>{apt.token}</span>
                    <strong style={{ fontSize: '14px', color: 'var(--doctor-text-primary)' }}>{apt.patientName}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>({apt.patientAge}y, {apt.patientGender})</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
                    {apt.time} • {apt.type} • {apt.purpose}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="doctor-btn doctor-btn-primary doctor-btn-sm"
                    onClick={() => {
                      onSelectPatient(apt.patientId);
                    }}
                  >
                    Open Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Decision Support & Screening Telemetry */}
        <div className="doctor-card">
          <div className="doctor-card-header">
            <div>
              <h3 className="doctor-card-title">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--doctor-coral)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                AI Decision Support Alerts (Today)
              </h3>
              <div className="doctor-card-description">Fracture Detection CNN pre-screened scans</div>
            </div>
            <button className="doctor-btn doctor-btn-ghost doctor-btn-sm" onClick={() => onNavigate('ai_diagnostics')}>
              Full Telemetry &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {patients.flatMap((p) => (p.aiPredictions || []).map((pred) => ({ ...pred, patientName: p.name, patientId: p.id }))).slice(0, 3).map((pred) => (
              <div
                key={pred.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: pred.riskLevel === 'High' ? 'var(--doctor-soft-coral)' : 'var(--doctor-soft-teal)',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--doctor-text-primary)' }}>{pred.patientName}</span>
                    <span className={`doctor-badge doctor-badge-${pred.riskLevel.toLowerCase()}`}>
                      {pred.finding}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
                    {pred.pipeline} • {pred.targetOrgan} • {pred.confidence}% confidence
                  </div>
                </div>

                <button
                  className="doctor-btn doctor-btn-outline doctor-btn-sm"
                  style={{ backgroundColor: 'var(--doctor-card)' }}
                  onClick={() => onOpenAiExplain(pred, pred.patientName)}
                >
                  Grad-CAM Heatmap
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Authorized Patients Quick Grid */}
      <div className="doctor-card">
        <div className="doctor-card-header">
          <div>
            <h3 className="doctor-card-title">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--doctor-teal)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Authorized Patients ({activePatients.length})
            </h3>
            <div className="doctor-card-description">
              Patients who have granted you access to their Unified Medical Record
            </div>
          </div>
          <button className="doctor-btn doctor-btn-outline doctor-btn-sm" onClick={() => onNavigate('patients')}>
            View All Patients &rarr;
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {activePatients.map((pat) => (
            <div
              key={pat.id}
              style={{
                padding: '16px',
                border: '1px solid var(--doctor-border)',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                backgroundColor: 'var(--doctor-bg)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--doctor-text-primary)' }}>
                    {pat.name}
                  </div>
                  <span className="doctor-badge doctor-badge-active">
                    Active Access
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
                  {pat.gender}, {pat.age}y • Blood Group <strong>{pat.bloodGroup}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--doctor-text-secondary)', marginTop: '6px', lineHeight: 1.3 }}>
                  <strong>Chief Complaint:</strong> {pat.chiefComplaint}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--doctor-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--doctor-text-muted)' }}>
                  {pat.medicalRecords?.length || 0} records • {pat.aiPredictions?.length || 0} AI scans
                </span>
                <button
                  className="doctor-btn doctor-btn-outline doctor-btn-sm"
                  onClick={() => onSelectPatient(pat.id)}
                >
                  Clinical Profile &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
