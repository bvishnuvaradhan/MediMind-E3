import {
  ArrowLeft,
  Stethoscope,
  CalendarDays,
  Clock,
  MapPin,
  GraduationCap,
  ShieldCheck,
  Star,
  CreditCard,
} from 'lucide-react';

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
    name: 'Dr. Rahul Mehta',
    department: 'Orthopedics',
    specialty: 'Orthopedic Surgery & Joint Replacement',
    hospital: 'MediMind Central Hospital',
    detail: 'Orthopedics · MediMind Central Hospital',
    meta: 'Available today · 10:30 AM',
    tone: 'coral',
    initials: 'RM',
    qualifications: 'MBBS, MS (Orthopedics), MCh (Joint Replacement)',
    boardCertification: 'Board Certified in Orthopedic Surgery (National Board of Examinations)',
    experience: '14+ Years Clinical Practice',
    fee: '₹800 (In-person) / ₹650 (Video)',
    modes: ['In-person OPD Clinic', 'Secure Video Consultation', 'Post-Op Follow-up'],
    nextSlot: 'Today at 10:30 AM',
    rating: '4.9 / 5.0 (248 verified family reviews)',
    schedule: 'Monday – Saturday: 10:00 AM – 2:00 PM OPD',
    summary: 'Senior consultant orthopedic surgeon specializing in robotic joint arthroplasty, complex trauma management, and sports ligament reconstruction.',
  };

  const departmentName = doctor.department || (doctor.detail ? doctor.detail.split(' · ')[0] : 'Orthopedics');
  const hospitalName = doctor.hospital || (doctor.detail ? doctor.detail.split(' · ')[1] : 'MediMind Central Hospital');

  return (
    <section className="feature-view">
      {/* 1. Header */}
      <div className="feature-heading" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span className={`avatar avatar-${doctor.tone || 'coral'}`} style={{ width: '48px', height: '48px', fontSize: '17px' }}>
            {doctor.initials || 'DR'}
          </span>
          <div>
            <p className="eyebrow" style={{ margin: '0 0 2px 0' }}>Specialist Profile</p>
            <h1 style={{ margin: 0, fontSize: '22px' }}>{doctor.title}</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--family-muted)' }}>
              {departmentName} · {hospitalName}
            </p>
          </div>
        </div>

        <button
          className="secondary-button compact-button"
          onClick={() => navigate('Doctors')}
        >
          <ArrowLeft size={16} /> Back to doctors
        </button>
      </div>

      {/* 2. Profile Overview & 3. Availability Row */}
      <div className="dashboard-grid profile-summary-grid" style={{ marginBottom: '20px', marginTop: 0 }}>
        {/* Profile Overview Card */}
        <div className="doctor-section-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="doctor-section-title">
            <Stethoscope size={18} />
            <span>Professional Summary</span>
          </div>

          <p style={{ fontSize: '13.5px', color: 'var(--family-ink)', lineHeight: '1.6', margin: '0 0 16px 0', flex: 1 }}>
            {doctor.summary || `${doctor.title} is a dedicated ${departmentName} specialist at ${hospitalName}, providing comprehensive clinical consultations, evidence-based diagnosis, and personalized family treatment plans.`}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '11.5px', padding: '4px 10px', backgroundColor: 'var(--family-soft)', borderRadius: '6px', color: 'var(--family-primary)', fontWeight: '600', border: '1px solid var(--family-border)' }}>
              {doctor.specialty || departmentName}
            </span>
            <span style={{ fontSize: '11.5px', padding: '4px 10px', backgroundColor: 'var(--family-soft)', borderRadius: '6px', color: 'var(--family-primary)', fontWeight: '600', border: '1px solid var(--family-border)' }}>
              {doctor.experience || '10+ Years Experience'}
            </span>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              if (setSelectedDoctor) setSelectedDoctor(doctor);
              if (setReturnTo) setReturnTo('Doctor profile');
              navigate('Appointment assessment');
              announce(`Starting appointment assessment for ${doctor.title}`);
            }}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <CalendarDays size={16} /> Book Appointment with {doctor.title}
          </button>
        </div>

        {/* Availability Card */}
        <div className="doctor-section-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="doctor-section-title">
            <Clock size={18} />
            <span>OPD Availability & Hospital</span>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--family-soft)', borderRadius: '10px', border: '1px solid var(--family-border)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarDays size={18} style={{ color: 'var(--family-primary)', flexShrink: 0 }} />
            <div>
              <span className="info-tile-label" style={{ display: 'block', marginBottom: '2px' }}>Next Available Slot</span>
              <strong style={{ fontSize: '13.5px', color: 'var(--family-ink)' }}>{doctor.nextSlot || doctor.meta || 'Today at 10:30 AM'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--family-ink)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Clock size={16} style={{ color: 'var(--family-primary)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span className="info-tile-label" style={{ display: 'block', marginBottom: '2px' }}>Weekly OPD Schedule</span>
                <span style={{ color: 'var(--family-ink)', fontWeight: '500' }}>{doctor.schedule || 'Monday – Saturday: 10:00 AM – 2:00 PM OPD'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <MapPin size={16} style={{ color: 'var(--family-primary)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span className="info-tile-label" style={{ display: 'block', marginBottom: '2px' }}>Clinical Wing & Location</span>
                <span style={{ color: 'var(--family-ink)', fontWeight: '500' }}>{hospitalName} · Department of {departmentName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Credentials & Experience Section */}
      <div className="doctor-section-card">
        <div className="doctor-section-title">
          <GraduationCap size={18} />
          <span>Credentials & Experience</span>
        </div>

        <div className="doctor-info-grid">
          <div className="info-tile">
            <span className="info-tile-label">Medical Degree & Fellowship</span>
            <span className="info-tile-value">{doctor.qualifications || 'MBBS, MS, Board Certified Specialist'}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Board Certification</span>
            <span className="info-tile-value">{doctor.boardCertification || 'National Board of Examinations (Specialist Certification)'}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Clinical Experience</span>
            <span className="info-tile-value">{doctor.experience || '12+ Years Clinical Practice'}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Primary Hospital Affiliation</span>
            <span className="info-tile-value">{hospitalName}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Clinical Department</span>
            <span className="info-tile-value">{departmentName}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Licensing & HIPAA Verification</span>
            <span className="info-tile-value" style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> Verified Active License
            </span>
          </div>
        </div>
      </div>

      {/* 5. Consultation Details & Pricing Section */}
      <div className="doctor-section-card">
        <div className="doctor-section-title">
          <CreditCard size={18} />
          <span>Consultation Details & Pricing</span>
        </div>

        <div className="doctor-info-grid">
          <div className="info-tile">
            <span className="info-tile-label">Consultation Fee</span>
            <span className="info-tile-value">{doctor.fee || '₹800 (In-person) / ₹650 (Video)'}</span>
            <span className="info-tile-sub">Includes 7-day post-consult follow-up review</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Supported Modes</span>
            <span className="info-tile-value">
              {Array.isArray(doctor.modes) ? doctor.modes.join(' · ') : 'In-person OPD Clinic · Secure Video Consultation'}
            </span>
            <span className="info-tile-sub">Encrypted telehealth connection</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Next Available Booking Slot</span>
            <span className="info-tile-value">{doctor.nextSlot || doctor.meta || 'Today at 10:30 AM'}</span>
            <span className="info-tile-sub">Real-time scheduling availability</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Patient Satisfaction</span>
            <span className="info-tile-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={16} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
              {doctor.rating || '4.9 / 5.0 (240+ verified family reviews)'}
            </span>
            <span className="info-tile-sub">Verified MediMind patient ratings</span>
          </div>
        </div>
      </div>
    </section>
  );
}
