import { useState } from 'react';
import { Stethoscope, CalendarDays, ArrowUpRight, Clock } from 'lucide-react';
import { initialPresentationData } from '../../../data/medimindData';

export function DoctorsView({
  announce,
  navigate,
  setSelectedDoctor,
  setReturnTo,
}) {
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const doctors = initialPresentationData.Doctors;

  const departments = ['All Departments', 'Orthopedics', 'Cardiology', 'Diabetology', 'General Medicine'];

  const filteredDoctors = doctors.filter((doc) => {
    if (selectedDepartment === 'All Departments') return true;
    const docDept = doc.department || (doc.detail ? doc.detail.split(' · ')[0] : '');
    return docDept.toLowerCase() === selectedDepartment.toLowerCase();
  });

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Stethoscope size={20} />
        </span>
        <div>
          <p className="eyebrow">Clinical Network</p>
          <h1>Doctors</h1>
          <p>Browse authorized healthcare specialists and schedule consultations.</p>
        </div>
      </div>

      <div className="feature-panel">
        {/* Department Filter Tabs */}
        <div className="filter-row" style={{ marginBottom: '20px' }}>
          {departments.map((dept) => (
            <button
              key={dept}
              className={`filter ${selectedDepartment === dept ? 'active' : ''}`}
              onClick={() => {
                setSelectedDepartment(dept);
                announce(`Filtered by ${dept}`);
              }}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Doctor Cards */}
        <div className="feature-list">
          {filteredDoctors.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--family-muted)' }}>
              No doctors found under {selectedDepartment}.
            </div>
          ) : (
            filteredDoctors.map((doctor) => {
              const departmentName = doctor.department || (doctor.detail ? doctor.detail.split(' · ')[0] : 'Specialist');
              const hospitalName = doctor.hospital || (doctor.detail ? doctor.detail.split(' · ')[1] : 'MediMind Hospital');

              return (
                <article className="feature-card" key={doctor.title} style={{ padding: '18px 20px', alignItems: 'flex-start' }}>
                  <div className={`avatar avatar-${doctor.tone || 'coral'}`} style={{ width: '44px', height: '44px', fontSize: '15px', marginTop: '2px' }}>
                    {doctor.initials || 'DR'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '15.5px' }}>{doctor.title}</h3>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--family-soft)',
                          color: 'var(--family-primary)',
                          fontWeight: '600',
                          border: '1px solid var(--family-border)',
                        }}
                      >
                        {departmentName}
                      </span>
                    </div>

                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--family-muted)' }}>
                      {doctor.specialty || departmentName} · <strong>{hospitalName}</strong>
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '12px', color: 'var(--family-subtle)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} style={{ color: 'var(--family-primary)' }} /> {doctor.meta || 'Available today'}
                      </span>
                      <span>· {doctor.fee || '₹800 consult fee'}</span>
                    </div>
                  </div>

                  <div className="feature-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'center' }}>
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
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
