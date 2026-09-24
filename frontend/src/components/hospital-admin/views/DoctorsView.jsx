import { useState } from 'react';
import {
  Stethoscope,
  Search,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Star,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export function DoctorsView({ doctors, departments, onSelectDoctor, onToggleStatus }) {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept = selectedDept === 'ALL' || doc.departmentId === selectedDept;
    const matchesSearch =
      !search ||
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(search.toLowerCase()) ||
      doc.department.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1>Hospital Clinical Doctors Directory</h1>
            <p>Operational overview of all 9 practicing doctors across Orthopedics, Diabetology, and Cardiology</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--ha-teal)' }} />
          <span>Doctor accounts are provisioned by Department Heads</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ha-filter-bar">
        <div className="ha-search-box" style={{ width: '280px' }}>
          <Search size={15} style={{ color: 'var(--ha-text-muted)' }} />
          <input
            placeholder="Search doctors, specializations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ha-filter-pills">
          <button
            className={`ha-filter-pill ${selectedDept === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedDept('ALL')}
          >
            All Departments ({doctors.length})
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              className={`ha-filter-pill ${selectedDept === dept.id ? 'active' : ''}`}
              onClick={() => setSelectedDept(dept.id)}
            >
              {dept.name} ({doctors.filter((d) => d.departmentId === dept.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredDoctors.map((doc) => (
          <div key={doc.id} className="ha-card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--ha-soft-bg)',
                    color: 'var(--ha-primary)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  {doc.avatarInitials}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '15px', fontWeight: 700 }}>
                    {doc.name}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--ha-primary)', fontWeight: 600 }}>
                    {doc.department}
                  </span>
                </div>
              </div>

              <span className={`ha-badge ${doc.status.toLowerCase()}`}>
                {doc.status}
              </span>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong>Specialization:</strong> {doc.specialization}</div>
              <div style={{ color: 'var(--ha-text-muted)' }}><strong>Qualifications:</strong> {doc.qualification} ({doc.experience})</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ha-text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> {doc.schedule}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308', fontWeight: 700 }}>
                <Star size={13} fill="#eab308" /> {doc.rating}
              </span>
            </div>

            {/* Workload Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--ha-text-muted)' }}>Current Workload</span>
                <strong>{doc.workload} / {doc.maxCapacity} Consultations</strong>
              </div>
              <div className="ha-progress-bar-bg">
                <div
                  className="ha-progress-bar-fill"
                  style={{ width: `${(doc.workload / doc.maxCapacity) * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '6px' }}>
              <button
                className="ha-btn ha-btn-secondary ha-btn-sm"
                style={{ flex: 1 }}
                onClick={() => onSelectDoctor(doc)}
              >
                Doctor Profile <ChevronRight size={14} />
              </button>
              <button
                className="ha-btn ha-btn-outline ha-btn-sm"
                onClick={() => onToggleStatus(doc.id)}
                title={doc.status === 'Active' ? 'Suspend doctor account' : 'Activate doctor account'}
              >
                {doc.status === 'Active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {doc.status === 'Active' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

