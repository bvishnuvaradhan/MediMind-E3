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
  UsersRound,
  Plus,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { initialPresentationData, matchesFamilyMember } from '../../../data/medimindData';
import { RecordRow } from '../components/RecordRow';

export function DashboardView({
  records = [],
  bookedAppointments = [],
  predictionHistory = [],
  doctorAccess = [],
  navigate,
  announce,
  familyMembers = [],
  openFeatureModal,
  onOpenAppointmentDetail,
  onOpenUploadModal,
  activeFamily = null,
  appointments = null,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. All Appointments across the family
  const familyTitle = activeFamily?.name
    ? activeFamily.name.replace(' Account', '')
    : 'Family';

  const baseAppointments = appointments || initialPresentationData.Appointments || [];
  const allAppointments = [
    ...baseAppointments,
    ...bookedAppointments,
  ];

  const nextUpcomingAppointments = allAppointments.slice(0, 3);

  // 2. Recent Medical Records across the family
  const displayRecords = records.slice(0, 4);

  // 3. AI Predictions summary
  const totalPredictionsCount = 4 + predictionHistory.length;

  const handleRefreshDashboard = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      announce('Family dashboard telemetry and health records refreshed.');
    }, 400);
  };

  return (
    <>
      {/* 1. Family Welcome & Status Banner */}
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1>
            {familyTitle} Health Workspace <span>✦</span>
          </h1>
          <p className="subheading">
            Centralized health management, AI decision support, and specialist care for all {familyMembers.length} family members.
          </p>
        </div>
      </section>

      {/* 2. Family Members Roster Grid */}
      <section className="member-strip" style={{ marginBottom: '24px' }}>
        <div className="section-heading" style={{ marginBottom: '14px' }}>
          <div>
            <h2>Family members</h2>
            <p>Select any member to inspect their dedicated health records, history, and medical telemetry</p>
          </div>
          <button className="text-button" onClick={() => navigate('Family members')}>
            Manage members ({familyMembers.length}) <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="member-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {familyMembers.map((item, index) => {
            const itemDisplayName = item.fullName || item.name;
            const itemRelation = item.relationship || item.relation || 'Member';
            const memberRecs = records.filter((r) => matchesFamilyMember(r, item));
            const memberPreds = predictionHistory.filter((p) => matchesFamilyMember(p, item));
            const isNewMember = memberRecs.length === 0 && memberPreds.length === 0;

            return (
              <div
                className="member-card"
                key={`${item.id || item.name}-${index}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '16px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--family-card)',
                  border: '1px solid var(--family-border)',
                  boxShadow: 'var(--family-shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
                onClick={() => {
                  navigate('Member profile', { member: item });
                  announce(`Viewing profile for ${itemDisplayName}`);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                  <div className={`avatar avatar-${item.tone || 'coral'}`}>{item.initials}</div>
                  {isNewMember ? (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '600' }}>
                      New Profile
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: '600' }}>
                      Active
                    </span>
                  )}
                </div>

                <div className="member-info" style={{ width: '100%', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '15px', display: 'block', color: 'var(--family-ink)', marginBottom: '2px' }}>
                    {itemDisplayName}
                  </strong>
                  <span style={{ fontSize: '12.5px', color: 'var(--family-muted)', display: 'block' }}>
                    {itemRelation} · Age {item.age || 'N/A'} {item.bloodGroup ? `· ${item.bloodGroup}` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: '10px', borderTop: '1px solid var(--family-border)', fontSize: '12px', color: 'var(--family-subtle)' }}>
                  <span>{memberRecs.length} record{memberRecs.length !== 1 ? 's' : ''}</span>
                  <span style={{ color: 'var(--family-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    View profile <ArrowUpRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}

          <button
            className="member-card add-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 18px',
              borderRadius: '12px',
              border: '2px dashed var(--family-border)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              minHeight: '140px',
            }}
            onClick={() => navigate('Family members')}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--family-soft)', display: 'grid', placeItems: 'center', color: 'var(--family-primary)', marginBottom: '8px' }}>
              <Plus size={18} />
            </div>
            <strong style={{ fontSize: '13.5px', color: 'var(--family-ink)' }}>Add Family Member</strong>
            <span style={{ fontSize: '11.5px', color: 'var(--family-muted)' }}>Authorize new profile</span>
          </button>
        </div>
      </section>

      {/* 3. Mid Grid: Appointments & AI Decision Support Hub */}
      <section className="dashboard-grid">
        {/* Upcoming Family Appointments */}
        <div className="appointment-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-topline" style={{ marginBottom: '12px' }}>
            <div>
              <p className="card-kicker">FAMILY CARE SCHEDULE ({allAppointments.length})</p>
              <h3>Upcoming Consultations</h3>
            </div>
            <span className="date-badge">
              {nextUpcomingAppointments[0]?.meta?.split(' · ')[0]?.slice(0, 2) || '18'} <small>{nextUpcomingAppointments[0]?.meta?.split(' · ')[0]?.slice(3, 6).toUpperCase() || 'SEP'}</small>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {nextUpcomingAppointments.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--family-muted)', fontSize: '13px', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
                No upcoming consultations scheduled.
              </div>
            ) : (
              nextUpcomingAppointments.map((apt, idx) => (
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
              <CalendarDays size={15} /> MediMind Multi-Specialty Clinics
            </span>
            <button className="plain-button" onClick={() => navigate('Appointments')}>
              View all appointments <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* AI Health Screening Hub */}
        <div className="insight-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="insight-icon" style={{ margin: 0 }}>
                <Sparkles size={18} />
              </div>
              <div>
                <p className="card-kicker" style={{ margin: 0 }}>AI CLINICAL INTELLIGENCE</p>
                <h3 style={{ margin: 0 }}>Health Risk & Predictive Triage</h3>
              </div>
            </div>

            <p className="insight-copy" style={{ margin: '10px 0 16px 0', fontSize: '13px', lineHeight: '1.5' }}>
              Four specialized clinical decision support engines ready to screen radiographs, cardiovascular biomarkers, glycemic parameters, and holistic family health.
            </p>

            {/* Quick Action Pills for AI Modules */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <button
                className="secondary-button"
                style={{ padding: '8px 10px', fontSize: '12px', justifyContent: 'flex-start', gap: '6px' }}
                onClick={() => navigate('AI predictions')}
              >
                <Activity size={14} style={{ color: '#ea580c' }} /> Fracture Detection
              </button>
              <button
                className="secondary-button"
                style={{ padding: '8px 10px', fontSize: '12px', justifyContent: 'flex-start', gap: '6px' }}
                onClick={() => navigate('AI predictions')}
              >
                <Activity size={14} style={{ color: '#7c3aed' }} /> Diabetes Risk
              </button>
              <button
                className="secondary-button"
                style={{ padding: '8px 10px', fontSize: '12px', justifyContent: 'flex-start', gap: '6px' }}
                onClick={() => navigate('AI predictions')}
              >
                <HeartPulse size={14} style={{ color: '#0f766e' }} /> Cardiovascular Risk
              </button>
              <button
                className="secondary-button"
                style={{ padding: '8px 10px', fontSize: '12px', justifyContent: 'flex-start', gap: '6px' }}
                onClick={() => navigate('General health risk')}
              >
                <ShieldCheck size={14} style={{ color: '#d97706' }} /> General Health Index
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--family-border)' }}>
            <span style={{ fontSize: '12px', color: 'var(--family-muted)' }}>
              {totalPredictionsCount} AI screenings completed across family
            </span>
            <button
              className="text-button"
              onClick={() => navigate('AI predictions')}
            >
              Open AI Screening Hub <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Lower Grid: Unified Medical Records & Account Telemetry */}
      <section className="lower-grid">
        {/* Recent Family Medical Records */}
        <div className="records-panel">
          <div className="section-heading">
            <div>
              <h2>Recent family medical records</h2>
              <p>Unified diagnostic reports, prescriptions, and lab panels</p>
            </div>
            <button className="text-button" onClick={() => navigate('Medical records')}>
              View all ({records.length}) <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="record-list">
            {displayRecords.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--family-muted)', fontSize: '13px', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
                No recent medical records found in this family account.
              </div>
            ) : (
              displayRecords.map((record, idx) => (
                <RecordRow
                  record={record}
                  key={`${record.type}-${idx}`}
                  announce={announce}
                  onOpen={(rec) => openFeatureModal(rec, 'Medical record')}
                />
              ))
            )}
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
            <Upload size={17} /> Upload a medical document for a family member
          </button>
        </div>

        {/* Family Account At a Glance */}
        <div className="activity-panel">
          <div className="section-heading">
            <div>
              <h2>Account at a glance</h2>
              <p>Unified family health telemetry</p>
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
            <div className="stat" onClick={() => navigate('Family members')} style={{ cursor: 'pointer' }}>
              <span className="stat-icon coral-bg">
                <UsersRound size={17} />
              </span>
              <strong>{familyMembers.length}</strong>
              <span>Family members</span>
            </div>
            <div className="stat" onClick={() => navigate('Medical records')} style={{ cursor: 'pointer' }}>
              <span className="stat-icon mint-bg">
                <FileText size={17} />
              </span>
              <strong>{records.length}</strong>
              <span>Medical records</span>
            </div>
            <div className="stat" onClick={() => navigate('Appointments')} style={{ cursor: 'pointer' }}>
              <span className="stat-icon lilac-bg">
                <CalendarDays size={17} />
              </span>
              <strong>{allAppointments.length}</strong>
              <span>Care visits</span>
            </div>
            <div className="stat" onClick={() => navigate('Doctor access')} style={{ cursor: 'pointer' }}>
              <span className="stat-icon yellow-bg">
                <LockKeyhole size={17} />
              </span>
              <strong>{doctorAccess.length || 2}</strong>
              <span>Shared doctors</span>
            </div>
          </div>

          <div className="secure-banner">
            <ShieldCheck size={17} />
            <span>End-to-end HIPAA compliant family data boundary.</span>
          </div>
        </div>
      </section>

      <p className="disclaimer">
        <ShieldCheck size={14} /> MediMind supports clinical decisions. It does not replace professional medical diagnosis.
      </p>
    </>
  );
}
