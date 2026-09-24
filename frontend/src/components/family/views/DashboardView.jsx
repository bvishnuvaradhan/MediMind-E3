import {
  ArrowUpRight,
  MoreHorizontal,
  ChevronRight,
  CalendarDays,
  Sparkles,
  Upload,
  FileText,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { initialRecords } from '../../../data/familyMockData';
import { RecordRow } from '../components/RecordRow';

export function DashboardView({
  member,
  memberIndex,
  setMemberIndex,
  navigate,
  announce,
  familyMembers,
}) {
  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">Tuesday, 16 September 2026</p>
          <h1>
            Welcome back, Rohan <span>✦</span>
          </h1>
          <p className="subheading">Here’s a clear view of your family’s health, all in one place.</p>
        </div>
      </section>

      <section className="member-strip">
        <div className="section-heading">
          <div>
            <h2>Family members</h2>
            <p>Switch profiles to see their health overview</p>
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
              onClick={() => setMemberIndex(index)}
            >
              <div className={`avatar avatar-${item.tone}`}>{item.initials}</div>
              <div className="member-info">
                <strong>{item.name}</strong>
                <span>{item.relation}</span>
              </div>
              {memberIndex === index && <span className="selected-check">✓</span>}
              <MoreHorizontal size={18} className="member-more" />
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="appointment-card">
          <div className="card-topline">
            <div>
              <p className="card-kicker">NEXT APPOINTMENT</p>
              <h3>Orthopedics follow-up</h3>
            </div>
            <span className="date-badge">
              18 <small>SEP</small>
            </span>
          </div>

          <div className="doctor-line">
            <div className="doctor-avatar">DR</div>
            <div>
              <strong>Dr. Rahul Mehta</strong>
              <span>Orthopedic specialist · 10:30 AM</span>
            </div>
            <ChevronRight size={18} />
          </div>

          <div className="appointment-footer">
            <span>
              <CalendarDays size={15} /> MediMind Hospital
            </span>
            <button className="plain-button" onClick={() => navigate('Appointments')}>
              View appointment <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="card-kicker">LATEST AI INSIGHT</p>
            <h3>Heart health looks stable</h3>
            <p className="insight-copy">Based on your latest health assessment from 10 Sep.</p>
            <button className="text-button" onClick={() => navigate('AI predictions')}>
              View prediction <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="insight-ring">
            <span>86</span>
            <small>score</small>
          </div>
        </div>
      </section>

      <section className="lower-grid">
        <div className="records-panel">
          <div className="section-heading">
            <div>
              <h2>{member.name}’s recent records</h2>
              <p>Your latest health activity</p>
            </div>
            <button className="text-button" onClick={() => navigate('Medical records')}>
              View all <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="record-list">
            {initialRecords.map((record) => (
              <RecordRow record={record} key={record.type} announce={announce} />
            ))}
          </div>
          <button className="upload-button" onClick={() => navigate('Upload record')}>
            <Upload size={17} /> Upload a medical record
          </button>
        </div>

        <div className="activity-panel">
          <div className="section-heading">
            <div>
              <h2>At a glance</h2>
              <p>Across your family account</p>
            </div>
            <button
              className="icon-button"
              onClick={() => announce('Family account summary refreshed.')}
              aria-label="Refresh family account summary"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="stat-grid">
            <div className="stat">
              <span className="stat-icon coral-bg">
                <FileText size={17} />
              </span>
              <strong>24</strong>
              <span>Medical records</span>
            </div>
            <div className="stat">
              <span className="stat-icon lilac-bg">
                <Sparkles size={17} />
              </span>
              <strong>6</strong>
              <span>AI predictions</span>
            </div>
            <div className="stat">
              <span className="stat-icon mint-bg">
                <CalendarDays size={17} />
              </span>
              <strong>3</strong>
              <span>Appointments</span>
            </div>
            <div className="stat">
              <span className="stat-icon yellow-bg">
                <LockKeyhole size={17} />
              </span>
              <strong>2</strong>
              <span>Shared doctors</span>
            </div>
          </div>

          <div className="secure-banner">
            <ShieldCheck size={17} />
            <span>All family profiles are protected with secure access.</span>
          </div>
        </div>
      </section>

      <p className="disclaimer">
        <ShieldCheck size={14} /> MediMind supports better health decisions. It does not replace professional medical advice.
      </p>
    </>
  );
}
