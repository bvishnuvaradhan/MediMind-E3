// MediMind Platform - Platform Dashboard (Chairman / Platform Owner)
// Section 3 & 23 of PLATFORM OWNER.txt

import { useState, useEffect } from 'react';
import {
  Building2,
  Stethoscope,
  UsersRound,
  Sparkles,
  CalendarDays,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileText,
  UserPlus,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';
import { DonutChart } from '../../common/charts';

export function PlatformDashboard({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const sum = await chairmanService.getPlatformSummary();
      const hosps = await chairmanService.getHospitals();
      const reqs = await chairmanService.getHospitalRequests('Pending');
      const ai = await chairmanService.getAiAnalytics();
      setSummary(sum);
      setHospitals(hosps);
      setRequests(reqs);
      setAiData(ai);
    }
    loadData();
  }, []);

  if (!summary || !aiData) {
    return <div className="loading-state">Loading Platform Dashboard...</div>;
  }

  return (
    <div className="dashboard-view">
      {/* Top Banner */}
      <div className="view-header">
        <div>
          <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
            MediMind Ecosystem · Executive Governance
          </p>
          <h1>Platform Dashboard</h1>
          <p>Complete network oversight across hospitals, medical staff, appointments, and clinical AI services.</p>
        </div>

        <div className="view-actions">
          {requests.length > 0 && (
            <button
              className="primary-button"
              style={{ background: '#d97706' }}
              onClick={() => onNavigate('Hospitals', { tab: 'requests' })}
            >
              <AlertTriangle size={15} />
              <span>{requests.length} Pending Hospital Requests</span>
            </button>
          )}
          <button className="primary-button" onClick={() => onNavigate('Hospital Admins', { action: 'create' })}>
            <UserPlus size={15} />
            <span>Create Admin</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="privacy-banner">
        <ShieldCheck size={18} />
        <div>
          <strong>Platform Governance Architecture</strong>
          <p style={{ margin: '2px 0 0' }}>
            The Chairman maintains platform-level administrative authority. Patient medical records are strictly protected under patient-doctor authorization protocols and are not accessible to platform administration.
          </p>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <Building2 size={20} />
            </span>
            <span className="stat-delta">Network</span>
          </div>
          <h3>{summary.totalHospitals}</h3>
          <p>Registered Hospitals</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            + {summary.pendingHospitalRequests} pending onboarding
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#ccfbf1', color: '#0f766e' }}>
              <Stethoscope size={20} />
            </span>
            <span className="stat-delta">{summary.totalDepartments || 17} Departments</span>
          </div>
          <h3>{summary.totalDoctors}</h3>
          <p>Total Medical Workforce</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            Across 3 Network Hospitals
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <UsersRound size={20} />
            </span>
            <span className="stat-delta">{summary.totalFamilyMembers || 29} Members</span>
          </div>
          <h3>{summary.totalFamilyAccounts}</h3>
          <p>Family Accounts</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            {summary.activeUsers || 29} active user sessions
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <CalendarDays size={20} />
            </span>
            <span className="stat-delta">{summary.completedAppointments} Completed</span>
          </div>
          <h3>{summary.totalAppointments}</h3>
          <p>Platform Appointments</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            {summary.upcomingAppointments} upcoming scheduled
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}>
              <Sparkles size={20} />
            </span>
            <span className="stat-delta">95.6% Accuracy</span>
          </div>
          <h3>{summary.totalAiPredictions}</h3>
          <p>Clinical AI Predictions</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            4 Active Diagnostic Pipelines
          </small>
        </div>
      </div>

      {/* Two Column Layout: Hospital Network + AI Services */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '22px', marginBottom: '28px' }}>
        {/* Hospital Network Status Card */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>
                Hospital Network Overview
              </h3>
              <p style={{ margin: 0, color: 'var(--chair-muted)', fontSize: '12px' }}>
                Active healthcare facilities and operating administration
              </p>
            </div>
            <button className="text-button" onClick={() => onNavigate('Hospitals')}>
              View all <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {hospitals.map((hosp) => (
              <div
                key={hosp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--chair-border)',
                  background: 'var(--chair-bg)',
                }}
              >
                <div style={{ display: 'grid', placeItems: 'center', width: '42px', height: '42px', borderRadius: '10px', background: '#dbeafe', color: '#2563eb' }}>
                  <Building2 size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px' }}>{hosp.name}</strong>
                    <span className="badge badge-active">{hosp.status}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--chair-muted)' }}>
                    Admin: {hosp.adminName} · {hosp.city}, {hosp.state}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px' }}>
                  <strong>{hosp.doctorsCount} Doctors</strong>
                  <div style={{ color: 'var(--chair-muted)', fontSize: '11px' }}>{hosp.appointmentsCount} Visits</div>
                </div>
              </div>
            ))}
          </div>

          {requests.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12px', color: '#92400e' }}>
                <Clock size={16} />
                <span><b>{requests[0].name}</b> requested network membership</span>
              </div>
              <button
                className="text-button"
                style={{ color: '#b45309' }}
                onClick={() => onNavigate('Hospitals', { tab: 'requests' })}
              >
                Review request
              </button>
            </div>
          )}
        </div>

        {/* Clinical AI Diagnostic Suite Card */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>
                Clinical AI Engine Utilization
              </h3>
              <p style={{ margin: 0, color: 'var(--chair-muted)', fontSize: '12px' }}>
                Aggregate inference volume across locked clinical models
              </p>
            </div>
            <button className="text-button" onClick={() => onNavigate('AI Analytics')}>
              Deep analytics <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(() => {
              const fRuns = aiData.modules?.fracture?.totalRuns || 165;
              const dRuns = aiData.modules?.diabetes?.totalRuns || 142;
              const hRuns = aiData.modules?.heartDisease?.totalRuns || 138;
              const gRuns = aiData.modules?.generalHealth?.totalRuns || 95;
              const total = fRuns + dRuns + hRuns + gRuns;

              const chartData = [
                { label: 'Fracture Detection (CNN)', value: fRuns, color: '#2563eb' },
                { label: 'Diabetes Risk (ML)', value: dRuns, color: '#0f766e' },
                { label: 'Heart Disease Risk (ML)', value: hRuns, color: '#4338ca' },
                { label: 'General Health (NLP)', value: gRuns, color: '#d97706' },
              ];

              return (
                <DonutChart
                  data={chartData}
                  size={170}
                  innerRadius={46}
                  outerRadius={72}
                  centerValue={total}
                  centerLabel="Inferences"
                />
              );
            })()}
          </div>

          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--chair-border)' }}>
            <div style={{ textAlign: 'center' }}>
              <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>AVG LATENCY</small>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>98ms</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>SYSTEM UPTIME</small>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#16a34a' }}>99.98%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>MICROSERVICES</small>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>5 Clusters</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Matrix & Platform Health */}
      <div className="table-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
          Executive Operations & Governance Shortcuts
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <button
            className="secondary-button"
            style={{ padding: '14px', justifyContent: 'flex-start', gap: '10px' }}
            onClick={() => onNavigate('Hospitals', { tab: 'requests' })}
          >
            <Building2 size={18} color="#2563eb" />
            <div style={{ textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '12px' }}>Hospital Requests</strong>
              <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>Review onboarding applicants</small>
            </div>
          </button>

          <button
            className="secondary-button"
            style={{ padding: '14px', justifyContent: 'flex-start', gap: '10px' }}
            onClick={() => onNavigate('Hospital Admins', { action: 'create' })}
          >
            <UserPlus size={18} color="#0f766e" />
            <div style={{ textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '12px' }}>Hospital Admins</strong>
              <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>Manage administrator accounts</small>
            </div>
          </button>

          <button
            className="secondary-button"
            style={{ padding: '14px', justifyContent: 'flex-start', gap: '10px' }}
            onClick={() => onNavigate('Reports')}
          >
            <FileText size={18} color="#4338ca" />
            <div style={{ textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '12px' }}>Generate Reports</strong>
              <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>Export network audits & KPIs</small>
            </div>
          </button>

          <button
            className="secondary-button"
            style={{ padding: '14px', justifyContent: 'flex-start', gap: '10px' }}
            onClick={() => onNavigate('Appointments')}
          >
            <CalendarDays size={18} color="#d97706" />
            <div style={{ textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '12px' }}>Appointments Overview</strong>
              <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>Aggregate scheduling metrics</small>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
