import { ArrowUpRight, Stethoscope, CalendarDays, Clock, MapPin } from 'lucide-react';

export function DoctorProfileView({
  doctor: propDoctor,
  selectedDoctor,
  navigate,
  announce,
  setSelectedDoctor,
  setReturnTo,
}) {
  const doctor = propDoctor || selectedDoctor || {
    title: 'Dr. Rahul Mehta',
    detail: 'Orthopedics · MediMind Hospital',
    meta: 'Available today · 10:30 AM',
    tone: 'coral',
    initials: 'RM',
    qualifications: 'MBBS, MS (Orthopedics), Fellowship in Joint Replacement',
    experience: '14+ Years Clinical Experience',
    hospital: 'MediMind Central Hospital',
    department: 'Orthopedics & Traumatology',
    fee: '₹800 (In-person) / ₹650 (Video)',
    modes: ['In-person OPD', 'Video Consultation', 'Telehealth Review'],
    availabilitySlots: ['Mon-Fri: 10:00 AM - 2:00 PM', 'Sat: 10:00 AM - 1:00 PM'],
    specialties: ['Knee & Hip Arthroplasty', 'Sports Injury Rehabilitation', 'Fracture Management'],
  };

  const departmentName = doctor.detail ? doctor.detail.split(' · ')[0] : 'Orthopedics';
  const hospitalName = doctor.detail ? doctor.detail.split(' · ')[1] : 'MediMind Hospital';

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className={`avatar avatar-${doctor.tone || 'coral'}`} style={{ width: '48px', height: '48px', fontSize: '16px' }}>
          {doctor.initials || 'DR'}
        </span>
        <div>
          <p className="eyebrow">Clinician Specialist Profile</p>
          <h1>{doctor.title}</h1>
          <p>{departmentName} · {hospitalName}</p>
        </div>
        <button
          className="secondary-button compact-button"
          onClick={() => navigate('Doctors')}
        >
          <ArrowUpRight size={16} /> Back to doctors
        </button>
      </div>

      <div className="dashboard-grid profile-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="insight-card">
          <div className="insight-icon">
            <Stethoscope size={20} />
          </div>
          <div>
            <p className="card-kicker">SPECIALIST OVERVIEW</p>
            <h3>{departmentName} Care</h3>
            <p className="insight-copy">
              {doctor.qualifications || 'MBBS, MS Specialist'} with {doctor.experience || '10+ years experience'}.
            </p>
            <button
              className="primary-button"
              style={{ marginTop: '12px' }}
              onClick={() => {
                if (setSelectedDoctor) setSelectedDoctor(doctor);
                if (setReturnTo) setReturnTo('Doctor profile');
                navigate('Appointment assessment');
                announce(`Starting appointment assessment for ${doctor.title}`);
              }}
            >
              <CalendarDays size={16} /> Book appointment
            </button>
          </div>
        </div>

        <div className="activity-panel">
          <div className="section-heading">
            <div>
              <h2>Current OPD Availability</h2>
              <p>Consultation schedules this week</p>
            </div>
          </div>
          <div className="secure-banner" style={{ margin: '8px 0' }}>
            <CalendarDays size={17} />
            <span>{doctor.meta || 'Available today · 10:30 AM'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--family-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} style={{ color: 'var(--family-primary)' }} />
              <span>Monday – Saturday: 10:00 AM – 2:00 PM OPD</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} style={{ color: 'var(--family-primary)' }} />
              <span>{hospitalName} · Department of {departmentName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Doctor Information */}
      <div className="feature-panel profile-details-panel">
        <div className="profile-detail-section">
          <h2>Credentials & Experience</h2>
          <div className="profile-detail-grid">
            <span>
              <b>Medical Degree & Fellowship</b>
              {doctor.qualifications || 'MBBS, MS, Board Certified Specialist'}
            </span>
            <span>
              <b>Clinical Experience</b>
              {doctor.experience || '12+ Years Clinical Practice'}
            </span>
            <span>
              <b>Primary Hospital Affiliation</b>
              {hospitalName}
            </span>
            <span>
              <b>Clinical Department</b>
              {departmentName}
            </span>
          </div>
        </div>

        <div className="profile-detail-section">
          <h2>Consultation Details & Pricing</h2>
          <div className="profile-detail-grid">
            <span>
              <b>Consultation Fees</b>
              {doctor.fee || '₹800 (In-person) / ₹650 (Video)'}
            </span>
            <span>
              <b>Supported Modes</b>
              In-person OPD Clinic, Secure Video, Telehealth Follow-up
            </span>
            <span>
              <b>Next Available Booking Slot</b>
              {doctor.meta || 'Today at 10:30 AM'}
            </span>
            <span>
              <b>Patient Satisfaction Rating</b>
              4.9 / 5.0 (240+ verified family reviews)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
