import { ArrowUpRight, Stethoscope, CalendarDays } from 'lucide-react';

export function DoctorProfileView({ doctor: propDoctor, selectedDoctor, navigate, announce }) {
  const doctor = propDoctor || selectedDoctor || {
    title: 'Dr. Rahul Mehta',
    detail: 'Orthopedics · MediMind Hospital',
    meta: 'Available today · 10:30 AM',
    tone: 'coral',
    initials: 'RM',
  };

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className={`avatar avatar-${doctor.tone || 'coral'}`}>{doctor.initials || 'DR'}</span>
        <div>
          <p className="eyebrow">Doctor profile</p>
          <h1>{doctor.title}</h1>
          <p>{doctor.detail}</p>
        </div>
        <button
          className="secondary-button compact-button"
          onClick={() => navigate('Doctors')}
        >
          <ArrowUpRight size={16} /> Back to doctors
        </button>
      </div>

      <div className="dashboard-grid profile-summary-grid">
        <div className="insight-card">
          <div className="insight-icon">
            <Stethoscope size={18} />
          </div>
          <div>
            <p className="card-kicker">SPECIALIST OVERVIEW</p>
            <h3>{doctor.detail ? doctor.detail.split(' · ')[0] : 'Orthopedics'}</h3>
            <p className="insight-copy">
              Trusted care for your family account with appointment availability this week.
            </p>
            <button
              className="primary-button"
              onClick={() => navigate('Appointment assessment')}
            >
              <CalendarDays size={16} /> Book appointment
            </button>
          </div>
        </div>

        <div className="activity-panel">
          <div className="section-heading">
            <div>
              <h2>Availability</h2>
              <p>Current appointment information</p>
            </div>
          </div>
          <div className="secure-banner">
            <CalendarDays size={17} />
            <span>{doctor.meta}</span>
          </div>
          <button
            className="text-button"
            onClick={() => announce('Doctor profile details are ready for your presentation.')}
          >
            View clinic details <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
