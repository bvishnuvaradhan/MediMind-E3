import {
  ArrowUpRight,
  HeartPulse,
  FileText,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { initialRecords } from '../../../data/familyMockData';
import { RecordRow } from '../components/RecordRow';

export function MemberProfileView({ member, navigate, announce }) {
  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className={`avatar avatar-${member.tone}`}>{member.initials}</span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>{member.name}'s profile</h1>
          <p>{member.relation} · Personal health overview and activity.</p>
        </div>
        <button
          className="secondary-button compact-button"
          onClick={() => navigate('Family members')}
        >
          <ArrowUpRight size={16} /> Back to family members
        </button>
      </div>

      <div className="dashboard-grid profile-summary-grid">
        <div className="insight-card">
          <div className="insight-icon">
            <HeartPulse size={18} />
          </div>
          <div>
            <p className="card-kicker">HEALTH OVERVIEW</p>
            <h3>Health profile is ready</h3>
            <p className="insight-copy">
              Review records, appointments, and AI-supported health updates for {member.name}.
            </p>
            <button className="text-button" onClick={() => navigate('Medical records')}>
              View records <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="insight-ring">
            <span>78</span>
            <small>score</small>
          </div>
        </div>

        <div className="activity-panel">
          <div className="section-heading">
            <div>
              <h2>At a glance</h2>
              <p>{member.name}'s account activity</p>
            </div>
          </div>
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-icon coral-bg">
                <FileText size={17} />
              </span>
              <strong>{member.records}</strong>
              <span>Medical records</span>
            </div>
            <div className="stat">
              <span className="stat-icon lilac-bg">
                <Sparkles size={17} />
              </span>
              <strong>{member.predictions}</strong>
              <span>AI predictions</span>
            </div>
          </div>
          <div className="secure-banner">
            <ShieldCheck size={17} />
            <span>This profile is protected with secure access.</span>
          </div>
        </div>
      </div>

      <div className="records-panel recent-records-panel">
        <div className="section-heading">
          <div>
            <h2>Recent records</h2>
            <p>Latest health activity for {member.name}</p>
          </div>
          <button className="text-button" onClick={() => navigate('Medical records')}>
            View all <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="record-list">
          {initialRecords.map((record) => (
            <RecordRow record={record} announce={announce} key={record.type} />
          ))}
        </div>
      </div>

      <div className="feature-panel profile-details-panel">
        <div className="profile-detail-section">
          <h2>Personal information</h2>
          <div className="profile-detail-grid">
            <span>
              <b>Date of birth</b>
              {member.dob}
            </span>
            <span>
              <b>Age</b>
              {member.age} years
            </span>
            <span>
              <b>Gender</b>
              {member.gender}
            </span>
            <span>
              <b>Blood group</b>
              {member.bloodGroup}
            </span>
            <span>
              <b>Phone</b>
              {member.phone}
            </span>
            <span>
              <b>Email</b>
              {member.email}
            </span>
            <span>
              <b>Address</b>
              {member.address}
            </span>
            <span>
              <b>Emergency contact</b>
              {member.emergencyContact}
            </span>
          </div>
        </div>
        <div className="profile-detail-section">
          <h2>Health information</h2>
          <div className="profile-detail-grid">
            <span>
              <b>Medical conditions</b>
              {member.conditions}
            </span>
            <span>
              <b>Allergies</b>
              {member.allergies}
            </span>
            <span>
              <b>Previous treatments</b>
              {member.treatments}
            </span>
            <span>
              <b>Other health information</b>Family health profile under active review
            </span>
          </div>
        </div>
        <div className="profile-detail-section">
          <h2>Activity</h2>
          <div className="profile-detail-grid">
            <span>
              <b>Appointments</b>
              {member.appointments}
            </span>
            <span>
              <b>Consultations</b>
              {member.consultations}
            </span>
            <span>
              <b>Prescriptions</b>
              {member.prescriptions}
            </span>
            <span>
              <b>Shared doctors</b>1 authorized doctor
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
