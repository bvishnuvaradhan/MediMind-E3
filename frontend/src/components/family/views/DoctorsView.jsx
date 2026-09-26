import { useState, useMemo } from 'react';
import { Stethoscope, CalendarDays, ArrowUpRight, Clock, Search, Building2 } from 'lucide-react';
import { initialPresentationData, hospitals } from '../../../data/medimindData';

const allDoctors = initialPresentationData.Doctors || [];

export function DoctorsView({
  announce,
  navigate,
  setSelectedDoctor,
  setReturnTo,
}) {
  const [selectedHospital, setSelectedHospital] = useState('All Hospitals');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique departments dynamically
  const departmentOptions = useMemo(() => {
    const depts = new Set();
    allDoctors.forEach((d) => {
      const deptName = d.department || (d.detail ? d.detail.split(' · ')[0] : '');
      if (deptName) depts.add(deptName);
    });
    return ['All Departments', ...Array.from(depts).sort()];
  }, []);

  const hospitalOptions = useMemo(() => {
    return ['All Hospitals', ...hospitals.map((h) => h.name)];
  }, []);

  const filteredDoctors = useMemo(() => {
    return allDoctors.filter((doc) => {
      const docDept = doc.department || (doc.detail ? doc.detail.split(' · ')[0] : '');
      const docHosp = doc.hospital || (doc.detail ? doc.detail.split(' · ')[1] : '');

      // Hospital match
      if (selectedHospital !== 'All Hospitals' && docHosp.toLowerCase() !== selectedHospital.toLowerCase()) {
        return false;
      }

      // Department match
      if (selectedDepartment !== 'All Departments' && docDept.toLowerCase() !== selectedDepartment.toLowerCase()) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (doc.title || doc.name || '').toLowerCase().includes(query);
        const matchesSpecialty = (doc.specialty || '').toLowerCase().includes(query);
        const matchesDept = docDept.toLowerCase().includes(query);
        const matchesHosp = docHosp.toLowerCase().includes(query);
        const matchesQualifications = (doc.qualifications || '').toLowerCase().includes(query);

        if (!matchesName && !matchesSpecialty && !matchesDept && !matchesHosp && !matchesQualifications) {
          return false;
        }
      }

      return true;
    });
  }, [selectedHospital, selectedDepartment, searchQuery]);

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Stethoscope size={20} />
        </span>
        <div>
          <p className="eyebrow">Clinical Network</p>
          <h1>Doctors</h1>
          <p>Browse authorized healthcare specialists across all partner hospitals and schedule consultations.</p>
        </div>
      </div>

      <div className="feature-panel">
        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--family-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search specialists by name, specialty, condition, or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="feature-input"
              style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Hospital Filter Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building2 size={13} /> Hospital:
            </span>
            <div className="filter-row" style={{ margin: 0, gap: '6px' }}>
              {hospitalOptions.map((hosp) => (
                <button
                  key={hosp}
                  type="button"
                  className={`filter ${selectedHospital === hosp ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedHospital(hosp);
                    if (announce) announce(`Filtered by ${hosp}`);
                  }}
                  style={{ fontSize: '12px', padding: '5px 12px' }}
                >
                  {hosp}
                </button>
              ))}
            </div>
          </div>

          {/* Department Filter Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Stethoscope size={13} /> Department:
            </span>
            <div className="filter-row" style={{ margin: 0, gap: '6px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '4px' }}>
              {departmentOptions.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  className={`filter ${selectedDepartment === dept ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDepartment(dept);
                    if (announce) announce(`Filtered by ${dept}`);
                  }}
                  style={{ fontSize: '12px', padding: '5px 12px', whiteSpace: 'nowrap' }}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Status summary */}
          <div style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Showing <strong>{filteredDoctors.length}</strong> verified specialists
              {selectedHospital !== 'All Hospitals' ? ` at ${selectedHospital}` : ' across 3 partner hospitals'}
            </span>
            {(selectedHospital !== 'All Hospitals' || selectedDepartment !== 'All Departments' || searchQuery) && (
              <button
                type="button"
                className="text-button"
                style={{ fontSize: '11.5px', padding: '0 4px', textDecoration: 'underline' }}
                onClick={() => {
                  setSelectedHospital('All Hospitals');
                  setSelectedDepartment('All Departments');
                  setSearchQuery('');
                }}
              >
                Reset all filters
              </button>
            )}
          </div>
        </div>

        {/* Doctor Cards */}
        <div className="feature-list">
          {filteredDoctors.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--family-muted)' }}>
              No doctors found matching your search or filters. Try adjusting your criteria.
            </div>
          ) : (
            filteredDoctors.map((doctor) => {
              const departmentName = doctor.department || (doctor.detail ? doctor.detail.split(' · ')[0] : 'Specialist');
              const hospitalName = doctor.hospital || (doctor.detail ? doctor.detail.split(' · ')[1] : 'MediMind Hospital');

              return (
                <article className="feature-card" key={doctor.id || doctor.title} style={{ padding: '18px 20px', alignItems: 'flex-start' }}>
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '12px', color: 'var(--family-subtle)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} style={{ color: 'var(--family-primary)' }} /> {doctor.meta || 'Available today'}
                      </span>
                      <span>· {doctor.fee || '₹800 consult fee'}</span>
                      {doctor.experience && <span>· {doctor.experience}</span>}
                    </div>
                  </div>

                  <div className="feature-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'center' }}>
                    <button
                      className="text-button"
                      onClick={() => {
                        if (setSelectedDoctor) setSelectedDoctor(doctor);
                        if (setReturnTo) setReturnTo('Doctors');
                        navigate('Appointment assessment');
                        if (announce) announce(`Initiating symptom check for booking with ${doctor.title}.`);
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
                        if (announce) announce(`Viewing ${doctor.title}'s profile.`);
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
