import { Pagination } from '../../common/Pagination';
import { useState, useEffect } from 'react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when search or department filter changes
  useState(() => {}, []);
  useEffect(() => { setCurrentPage(1); }, [search, selectedDept]);


  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept = selectedDept === 'ALL' || doc.departmentId === selectedDept;
    const matchesSearch =
      !search ||
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(search.toLowerCase()) ||
      doc.department.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const totalFiltered = filteredDoctors.length;
  const pagedDoctors = filteredDoctors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1>Hospital Clinical Doctors Directory</h1>
            <p>
              Operational overview of {doctors.length} practicing doctors across {departments.length > 0 ? departments.map((d) => d.name).join(', ') : 'clinical departments'}
            </p>
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
        {pagedDoctors.map((doc) => (
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
              <div><strong>Specialization:</strong> {doc.specialization || 'Clinical Specialist'}</div>
              <div style={{ color: 'var(--ha-text-muted)' }}>
                <strong>Qualifications:</strong> {doc.qualification && doc.qualification !== 'Not provided' ? `${doc.qualification}${doc.experience ? ` (${doc.experience})` : ''}` : (doc.experience ? `Clinical Practice (${doc.experience})` : 'Not provided')}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ha-text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> {doc.schedule || 'No schedule configured'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308', fontWeight: 700 }}>
                <Star size={13} fill="#eab308" /> {doc.rating || 4.8}
              </span>
            </div>

            {/* Workload Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--ha-text-muted)' }}>Current Workload</span>
                <strong>{doc.workload || 0} / {doc.maxCapacity || 30} Consultations</strong>
              </div>
              <div className="ha-progress-bar-bg">
                <div
                  className="ha-progress-bar-fill"
                  style={{ width: `${Math.min(100, Math.round(((doc.workload || 0) / (doc.maxCapacity || 30)) * 100))}%` }}
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
      <Pagination
        currentPage={currentPage}
        totalItems={totalFiltered}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
      />
    </div>
  );
}

