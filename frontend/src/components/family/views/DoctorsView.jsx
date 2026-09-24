import { Stethoscope, CalendarDays, ArrowUpRight } from 'lucide-react';
import { initialPresentationData } from '../../../data/familyMockData';

export function DoctorsView({ announce, navigate, setSelectedDoctor, setReturnTo }) {
  const doctors = initialPresentationData.Doctors;

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Stethoscope size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Doctors</h1>
          <p>Browse authorized healthcare specialists and schedule consultations.</p>
        </div>
      </div>

      <div className="feature-panel">
        <div className="feature-list">
          {doctors.map((doctor) => (
            <article className="feature-card" key={doctor.title}>
              <div className={`avatar avatar-${doctor.tone || 'coral'}`}>{doctor.initials || 'DR'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 2px 0' }}>{doctor.title}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--family-muted)' }}>
                  {doctor.detail}
                </p>
                <span className="feature-meta" style={{ marginTop: '3px', display: 'block', fontSize: '12px' }}>
                  {doctor.meta}
                </span>
              </div>

              <div className="feature-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="text-button"
                  onClick={() => {
                    if (setSelectedDoctor) setSelectedDoctor(doctor);
                    if (setReturnTo) setReturnTo('Doctors');
                    navigate('Appointment assessment');
                    announce(`Initiating symptom check for booking with ${doctor.title}.`);
                  }}
                >
                  Book appointment <CalendarDays size={14} />
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    if (setSelectedDoctor) setSelectedDoctor(doctor);
                    if (setReturnTo) setReturnTo('Doctors');
                    navigate('Doctor profile');
                    announce(`Viewing ${doctor.title}'s profile.`);
                  }}
                >
                  View profile <ArrowUpRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
