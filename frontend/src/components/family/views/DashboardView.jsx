import { useState } from 'react';
import {
  ArrowUpRight,
  ChevronRight,
  CalendarDays,
  Sparkles,
  Upload,
  FileText,
  LockKeyhole,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { initialRecords, initialPresentationData } from '../../../data/medimindData';
import { RecordRow } from '../components/RecordRow';
import { RadialGauge } from '../../common/charts';

export function DashboardView({
  member,
  records = initialRecords,
  bookedAppointments = [],
  memberIndex,
  setMemberIndex,
  navigate,
  announce,
  familyMembers = [],
  openFeatureModal,
  onOpenAppointmentDetail,
  onOpenUploadModal,
  onOpenPredictionDetail,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter or aggregate appointments for this member
  const allAppointments = [
    ...initialPresentationData.Appointments,
    ...bookedAppointments,
  ];

  // Appointments relevant to current member or family
  const memberAppointments = allAppointments.filter((apt) => {
    if (!apt.detail) return true;
    return apt.detail.toLowerCase().includes(member.name.toLowerCase());
  });

  const nextThreeAppointments = (memberAppointments.length > 0 ? memberAppointments : allAppointments).slice(0, 3);

  const memberRecords = records.filter(
    (r) => !r.patient || r.patient.toLowerCase() === member.name.toLowerCase()
  );
  const displayRecords = (memberRecords.length > 0 ? memberRecords : records).slice(0, 3);

  const handleRefreshDashboard = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      announce('Dashboard telemetry & family health metrics refreshed.');
    }, 450);
  };

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1>
            Welcome back, {member?.name || 'Rohan'} <span>✦</span>
          </h1>
          <p className="subheading">Here’s a clear view of your family’s health, all in one place.</p>
        </div>
      </section>

      <section className="member-strip">
        <div className="section-heading">
          <div>
            <h2>Family members</h2>
            <p>Switch profiles to see their personal health overview</p>
          </div>
          <button className="text-button" onClick={() => navigate('Family members')}>
            View all <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="member-cards">
          {familyMembers.map((item, index) => (
            <button
              className={`member-card ${memberIndex === index ? 'selected' : ''}`}
              key={`${item.name}-${index}`}
              onClick={() => {
                setMemberIndex(index);
                announce(`Switched dashboard view to ${item.name}`);
              }}
            >
              <div className={`avatar avatar-${item.tone}`}>{item.initials}</div>
              <div className="member-info">
                <strong>{item.name}</strong>
                <span>{item.relation}</span>
              </div>
              {memberIndex === index && <span className="selected-check">✓</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        {/* Next 3 Upcoming Appointments */}
        <div className="appointment-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-topline" style={{ marginBottom: '12px' }}>
            <div>
              <p className="card-kicker">UPCOMING APPOINTMENTS ({nextThreeAppointments.length})</p>
              <h3>Care for {member.name}</h3>
            </div>
            <span className="date-badge">
              18 <small>SEP</small>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {nextThreeAppointments.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--family-muted)', fontSize: '13px' }}>
                No upcoming appointments scheduled for {member.name}.
              </div>
            ) : (
              nextThreeAppointments.map((apt, idx) => (
                <div
                  key={`${apt.title}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: 'var(--family-soft)',
                    borderRadius: '10px',
                    border: '1px solid var(--family-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div className="doctor-avatar" style={{ width: '32px', height: '32px', fontSize: '11px', flexShrink: 0 }}>
                      {apt.initials || 'DR'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '13px', color: 'var(--family-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {apt.title}
                      </strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--family-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {apt.detail} · {apt.meta?.split(' · ')[0] || '18 Sep'}
                      </span>
                    </div>
                  </div>

                  <button
                    className="icon-button"
                    onClick={() => {
                      if (onOpenAppointmentDetail) {
                        onOpenAppointmentDetail(apt);
                      } else {
                        openFeatureModal(apt, 'Appointments');
                      }
                    }}
                    aria-label={`View details for ${apt.title}`}
                    title="View appointment details"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--family-card)',
                      border: '1px solid var(--family-border)',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      marginLeft: '8px',
                      color: 'var(--family-primary)',
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="appointment-footer" style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--family-border)' }}>
            <span>
              <CalendarDays size={15} /> MediMind Outpatient Clinic
            </span>
            <button className="plain-button" onClick={() => navigate('Appointments')}>
              View all appointments <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Latest AI Insight */}
        <div className="insight-card">
          <div className="insight-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="card-kicker">LATEST AI INSIGHT · {member.name.toUpperCase()}</p>
            <h3>Heart health looks stable</h3>
            <p className="insight-copy">
              Based on validated hemodynamics and glycemic review for {member.name}.
            </p>
            <button
              className="text-button"
              onClick={() => {
                if (onOpenPredictionDetail) {
                  onOpenPredictionDetail({
                    title: `Heart Health & Cardiovascular Risk · ${member.name}`,
                    score: '86/100',
                    riskLevel: 'Low Risk',
                    result: 'Stable Cardiovascular Telemetry (Score 86/100)',
                    date: '16 Sep 2026',
                    memberName: member.name,
                    factors: [
                      'Resting Blood Pressure: 122/78 mmHg (Optimal hemodynamic baseline)',
                      'Total Serum Cholesterol: 182 mg/dL (Desirable reference range)',
                      'Resting Heart Rate: 70 bpm (Regular sinus rhythm)',
                      `Patient Profile: ${member.name} (${member.age} yrs, ${member.gender})`,
                    ],
                    recommendation: 'Cardiovascular parameters remain optimal. Continue current diet, hydration, and regular exercise schedule.',
                  });
                } else {
                  navigate('General health risk');
                }
              }}
            >
              View prediction <ArrowUpRight size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <RadialGauge
              value={86}
              min={0}
              max={100}
              unit=""
              label="Score"
              size={95}
              color="#0f766e"
            />
          </div>
        </div>
      </section>

      <section className="lower-grid">
        {/* Recent Records with Dedicated Click */}
        <div className="records-panel">
          <div className="section-heading">
            <div>
              <h2>{member.name}’s recent records</h2>
              <p>Your latest health activity and reports</p>
            </div>
            <button className="text-button" onClick={() => navigate('Medical records')}>
              View all <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="record-list">
            {displayRecords.map((record, idx) => (
              <RecordRow
                record={record}
                key={`${record.type}-${idx}`}
                announce={announce}
                onOpen={(rec) => openFeatureModal(rec, 'Medical record')}
              />
            ))}
          </div>
          <button
            className="upload-button"
            onClick={() => {
              if (onOpenUploadModal) {
                onOpenUploadModal();
              } else {
                navigate('Medical records');
              }
            }}
          >
            <Upload size={17} /> Upload a medical record
          </button>
        </div>

        {/* At a glance with recognizable Refresh icon */}
        <div className="activity-panel">
          <div className="section-heading">
            <div>
              <h2>At a glance</h2>
              <p>Across your family account</p>
            </div>
            <button
              className="icon-button"
              onClick={handleRefreshDashboard}
              aria-label="Refresh family account summary"
              title="Refresh summary data"
              style={{
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                transform: isRefreshing ? 'rotate(180deg)' : 'none',
              }}
            >
              <RefreshCw size={17} />
            </button>
          </div>

          <div className="stat-grid">
            <div className="stat" onClick={() => navigate('Medical records')} style={{ cursor: 'pointer' }}>
              <span className="stat-icon coral-bg">
                <FileText size={17} />
              </span>
              <strong>{records.length}</strong>
              <span>Medical records</span>
            </div>
            <div className="stat" onClick={() => navigate('AI predictions')} style={{ cursor: 'pointer' }}>
              <span className="stat-icon lilac-bg">
                <Sparkles size={17} />
              </span>
              <strong>6</strong>
              <span>AI predictions</span>
            </div>
            <div className="stat" onClick={() => navigate('Appointments')} style={{ cursor: 'pointer' }}>
              <span className="stat-icon mint-bg">
                <CalendarDays size={17} />
              </span>
              <strong>{allAppointments.length}</strong>
              <span>Appointments</span>
            </div>
            <div className="stat" onClick={() => navigate('Doctor access')} style={{ cursor: 'pointer' }}>
              <span className="stat-icon yellow-bg">
                <LockKeyhole size={17} />
              </span>
              <strong>2</strong>
              <span>Shared doctors</span>
            </div>
          </div>

          <div className="secure-banner">
            <ShieldCheck size={17} />
            <span>All family profiles are protected with HIPAA-ready secure access.</span>
          </div>
        </div>
      </section>

      <p className="disclaimer">
        <ShieldCheck size={14} /> MediMind supports better health decisions. It does not replace professional medical advice.
      </p>
    </>
  );
}
