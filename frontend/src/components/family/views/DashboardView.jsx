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
import { initialRecords, initialPresentationData, aiPredictions } from '../../../data/medimindData';
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

  const memberName = member?.fullName || member?.name || 'Rohan Kapoor';
  const memberRelation = member?.relationship || member?.relation || 'Father';
  const memberShortName = member?.name || 'Rohan';

  // 1. Filter appointments STRICTLY for the selected member
  const allAppointments = [
    ...initialPresentationData.Appointments,
    ...bookedAppointments,
  ];

  const memberAppointments = allAppointments.filter((apt) => {
    const detail = (apt.detail || '').toLowerCase();
    const patientName = (apt.patientName || apt.patient || '').toLowerCase();
    const targetName = memberName.toLowerCase();
    const targetShort = memberShortName.toLowerCase();
    const targetId = (member?.id || '').toLowerCase();
    const targetMemberId = (apt.memberId || '').toLowerCase();

    return (
      (targetMemberId && targetMemberId === targetId) ||
      detail.includes(targetName) ||
      detail.includes(targetShort) ||
      patientName.includes(targetName) ||
      patientName.includes(targetShort)
    );
  });

  const nextThreeAppointments = memberAppointments.slice(0, 3);

  // 2. Filter records STRICTLY for the selected member
  const memberRecords = records.filter((r) => {
    const patient = (r.patient || r.patientName || '').toLowerCase();
    const targetName = memberName.toLowerCase();
    const targetShort = memberShortName.toLowerCase();
    const targetId = (member?.id || '').toLowerCase();
    const recordMemberId = (r.memberId || '').toLowerCase();

    return (
      (recordMemberId && recordMemberId === targetId) ||
      patient === targetName ||
      patient === targetShort ||
      patient.includes(targetShort)
    );
  });

  const displayRecords = memberRecords.slice(0, 3);

  // 3. Dynamic member AI Insight
  const memberPredFromData = aiPredictions.find(
    (p) =>
      (p.memberId && p.memberId === member?.id) ||
      (p.patientName && p.patientName.toLowerCase().includes(memberShortName.toLowerCase()))
  );

  const getMemberAiInsight = () => {
    if (memberPredFromData) {
      const scoreNum = parseInt(memberPredFromData.confidence || memberPredFromData.riskScore || '86', 10) || 86;
      return {
        title: `${memberPredFromData.moduleName || 'AI Health Screening'} · ${memberName}`,
        heading: memberPredFromData.summary || `${memberPredFromData.moduleName} is within normal parameters`,
        subtext: `Telemetry based on ${memberPredFromData.modality || 'clinical review'} for ${memberName}.`,
        score: scoreNum,
        riskLevel: memberPredFromData.riskLevel || 'Low Risk',
        result: `${memberPredFromData.finding || 'Normal baseline'} (Score ${scoreNum}/100)`,
        date: memberPredFromData.date || '16 Sep 2026',
        factors: memberPredFromData.keyFactors || [
          `Patient: ${memberName} (${member?.age || 50} yrs, ${member?.gender || 'Adult'})`,
          'Automated AI triaging complete and verified by clinical rules engine',
        ],
        recommendation: memberPredFromData.recommendation || 'Continue routine healthy habits and schedule regular follow-up reviews.',
        gaugeColor: memberPredFromData.riskLevel === 'High Risk' ? '#ef4444' : memberPredFromData.riskLevel === 'Moderate Risk' ? '#f59e0b' : '#0f766e',
      };
    }

    // Tailored defaults by member relation/name
    if (memberShortName.toLowerCase().includes('priya') || memberRelation.toLowerCase().includes('mother')) {
      return {
        title: `Diabetes & Glycemic Risk · ${memberName}`,
        heading: 'Metabolic & Glycemic Review',
        subtext: `Based on HbA1c 5.9% and continuous glucose monitoring for ${memberName}.`,
        score: 76,
        riskLevel: 'Moderate Risk',
        result: 'Prediabetes Monitoring (Score 76/100)',
        date: '10 Sep 2026',
        factors: [
          'Fasting Serum Glucose: 112 mg/dL (Borderline elevated)',
          'HbA1c: 5.9% (Pre-diabetic monitoring threshold)',
          'Body Mass Index: 25.4 kg/m²',
          `Patient Profile: ${memberName} (${member?.age || 51} yrs, ${member?.gender || 'Female'})`,
        ],
        recommendation: 'Adopt low-glycemic dietary plan and repeat HbA1c screening in 3 months.',
        gaugeColor: '#d97706',
      };
    }

    if (memberShortName.toLowerCase().includes('arjun') || memberRelation.toLowerCase().includes('son')) {
      return {
        title: `Musculoskeletal & Pediatric Triage · ${memberName}`,
        heading: 'Bone & Joint Integrity Stable',
        subtext: `Radiographic bone density and cortical margin review for ${memberName}.`,
        score: 96,
        riskLevel: 'Low Risk',
        result: 'No Acute Skeletal Disruption (Score 96/100)',
        date: '04 Sep 2026',
        factors: [
          'Cortical Margins: Intact and aligned',
          'Joint Space: Preserved physiological alignment',
          'Soft Tissue: Minimal reactive edema',
          `Patient Profile: ${memberName} (${member?.age || 15} yrs, ${member?.gender || 'Male'})`,
        ],
        recommendation: 'Bone alignment normal. Suitable for gradual return to physical sports.',
        gaugeColor: '#0f766e',
      };
    }

    if (memberShortName.toLowerCase().includes('ananya') || memberRelation.toLowerCase().includes('daughter')) {
      return {
        title: `General Health & Wellness · ${memberName}`,
        heading: 'Overall Health Index is Optimal',
        subtext: `Comprehensive biometrics and routine wellness assessment for ${memberName}.`,
        score: 92,
        riskLevel: 'Low Risk',
        result: 'Optimal Health Telemetry (Score 92/100)',
        date: '12 Sep 2026',
        factors: [
          'Blood Pressure: 110/72 mmHg (Optimal)',
          'Hemoglobin: 13.2 g/dL (Normal)',
          'BMI: 21.0 kg/m²',
          `Patient Profile: ${memberName} (${member?.age || 19} yrs, ${member?.gender || 'Female'})`,
        ],
        recommendation: 'Maintain active physical lifestyle and balanced hydration routine.',
        gaugeColor: '#0f766e',
      };
    }

    return {
      title: `Heart Health & Cardiovascular Risk · ${memberName}`,
      heading: 'Heart health looks stable',
      subtext: `Based on validated hemodynamics and glycemic review for ${memberName}.`,
      score: 86,
      riskLevel: 'Low Risk',
      result: 'Stable Cardiovascular Telemetry (Score 86/100)',
      date: '16 Sep 2026',
      factors: [
        'Resting Blood Pressure: 122/78 mmHg (Optimal hemodynamic baseline)',
        'Total Serum Cholesterol: 182 mg/dL (Desirable reference range)',
        'Resting Heart Rate: 70 bpm (Regular sinus rhythm)',
        `Patient Profile: ${memberName} (${member?.age || 54} yrs, ${member?.gender || 'Male'})`,
      ],
      recommendation: 'Cardiovascular parameters remain optimal. Continue current diet, hydration, and regular exercise schedule.',
      gaugeColor: '#0f766e',
    };
  };

  const aiInsight = getMemberAiInsight();

  const handleRefreshDashboard = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      announce(`Dashboard telemetry & health metrics refreshed for ${memberName}.`);
    }, 450);
  };

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1>
            Welcome back, {memberName} <span>✦</span>
          </h1>
          <p className="subheading">Viewing personal health overview for {memberName} ({memberRelation}).</p>
        </div>
      </section>

      <section className="member-strip">
        <div className="section-heading">
          <div>
            <h2>Family members</h2>
            <p>Switch profiles to see individual personal health records and appointments</p>
          </div>
          <button className="text-button" onClick={() => navigate('Family members')}>
            View all <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="member-cards">
          {familyMembers.map((item, index) => {
            const itemDisplayName = item.fullName || item.name;
            const itemRelation = item.relationship || item.relation || 'Member';
            return (
              <button
                className={`member-card ${memberIndex === index ? 'selected' : ''}`}
                key={`${item.id || item.name}-${index}`}
                onClick={() => {
                  setMemberIndex(index);
                  announce(`Switched dashboard view to ${itemDisplayName} — ${itemRelation}`);
                }}
              >
                <div className={`avatar avatar-${item.tone}`}>{item.initials}</div>
                <div className="member-info">
                  <strong>{itemDisplayName}</strong>
                  <span>{itemDisplayName} — {itemRelation}</span>
                </div>
                {memberIndex === index && <span className="selected-check">✓</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-grid">
        {/* Next 3 Upcoming Appointments for this member */}
        <div className="appointment-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-topline" style={{ marginBottom: '12px' }}>
            <div>
              <p className="card-kicker">UPCOMING APPOINTMENTS ({memberAppointments.length})</p>
              <h3>Care for {memberName}</h3>
            </div>
            <span className="date-badge">
              {nextThreeAppointments[0]?.meta?.split(' · ')[0]?.slice(0, 2) || '18'} <small>{nextThreeAppointments[0]?.meta?.split(' · ')[0]?.slice(3, 6).toUpperCase() || 'SEP'}</small>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {nextThreeAppointments.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--family-muted)', fontSize: '13px', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
                No upcoming appointments scheduled for {memberName}.
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

        {/* Latest AI Insight for this member */}
        <div className="insight-card">
          <div className="insight-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="card-kicker">LATEST AI INSIGHT · {memberName.toUpperCase()}</p>
            <h3>{aiInsight.heading}</h3>
            <p className="insight-copy">
              {aiInsight.subtext}
            </p>
            <button
              className="text-button"
              onClick={() => {
                if (onOpenPredictionDetail) {
                  onOpenPredictionDetail({
                    title: aiInsight.title,
                    score: `${aiInsight.score}/100`,
                    riskLevel: aiInsight.riskLevel,
                    result: aiInsight.result,
                    date: aiInsight.date,
                    memberName: memberName,
                    factors: aiInsight.factors,
                    recommendation: aiInsight.recommendation,
                  });
                } else {
                  navigate('AI predictions');
                }
              }}
            >
              View prediction <ArrowUpRight size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <RadialGauge
              value={aiInsight.score}
              min={0}
              max={100}
              unit=""
              label="Score"
              size={95}
              color={aiInsight.gaugeColor}
            />
          </div>
        </div>
      </section>

      <section className="lower-grid">
        {/* Recent Records with Dedicated Click */}
        <div className="records-panel">
          <div className="section-heading">
            <div>
              <h2>{memberName}’s recent records</h2>
              <p>Latest health activity and diagnostic reports for {memberName}</p>
            </div>
            <button className="text-button" onClick={() => navigate('Medical records')}>
              View all ({memberRecords.length}) <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="record-list">
            {displayRecords.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--family-muted)', fontSize: '13px', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
                No recent medical records found for {memberName}.
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
            <Upload size={17} /> Upload a medical record for {memberShortName}
          </button>
        </div>

        {/* At a glance with recognizable Refresh icon */}
        <div className="activity-panel">
          <div className="section-heading">
            <div>
              <h2>At a glance</h2>
              <p>Family account overview ({memberShortName} focused)</p>
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
              <strong>{memberRecords.length}</strong>
              <span>{memberShortName}'s records ({records.length} family)</span>
            </div>
            <div className="stat" onClick={() => navigate('AI predictions')} style={{ cursor: 'pointer' }}>
              <span className="stat-icon lilac-bg">
                <Sparkles size={17} />
              </span>
              <strong>{member?.predictions || 2}</strong>
              <span>{memberShortName}'s AI predictions</span>
            </div>
            <div className="stat" onClick={() => navigate('Appointments')} style={{ cursor: 'pointer' }}>
              <span className="stat-icon mint-bg">
                <CalendarDays size={17} />
              </span>
              <strong>{memberAppointments.length}</strong>
              <span>{memberShortName}'s visits ({allAppointments.length} family)</span>
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

