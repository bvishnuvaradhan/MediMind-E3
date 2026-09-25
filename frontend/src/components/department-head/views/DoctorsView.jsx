import React, { useState } from 'react';

export function DoctorsView({
  doctors = [],
  onSelectDoctor,
  onOpenCreateDoctor,
  onOpenEditDoctor,
  onToggleStatus,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredDoctors = doctors.filter((doc) => {
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      doc.name.toLowerCase().includes(query) ||
      doc.specialization.toLowerCase().includes(query) ||
      doc.email.toLowerCase().includes(query) ||
      (doc.room && doc.room.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Quick Action */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              Department Doctors & Clinical Faculty
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              Manage and provision clinical staff for Orthopedics & Musculoskeletal Care
            </p>
          </div>
          <button className="dh-btn dh-btn-primary" onClick={onOpenCreateDoctor}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Provision Doctor Account
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="dh-card" style={{ padding: '16px 20px' }}>
        <div className="dh-filter-bar" style={{ margin: 0 }}>
          <div className="dh-filter-left">
            <div className="dh-search-input">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="Search by doctor name, specialty, room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="dh-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Doctor Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--dh-text-muted)' }}>
            Showing <strong>{filteredDoctors.length}</strong> of {doctors.length} doctors
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="dh-card">
        <div className="dh-table-container">
          <table className="dh-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization & Qualification</th>
                <th>Allocated OPD Room</th>
                <th>Active Caseload</th>
                <th>Satisfaction</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--dh-text-muted)' }}>
                    No department doctors found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => {
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="dh-avatar-circle" style={{ width: '36px', height: '36px', fontSize: '12px' }}>
                            {doc.avatarInitials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--dh-text-primary)' }}>{doc.name}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>{doc.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{doc.specialization}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>
                          {doc.qualification} • {doc.experience}
                        </div>
                      </td>
                      <td>
                        <span className="dh-badge dh-badge-draft" style={{ fontWeight: 600 }}>
                          {doc.room}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--dh-text-primary)', fontSize: '13px' }}>
                          {doc.workload} active bookings
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--dh-warning)' }}>
                          <span>★</span>
                          <span style={{ color: 'var(--dh-text-primary)' }}>{doc.rating}</span>
                          <span style={{ fontSize: '11px', color: 'var(--dh-text-muted)', fontWeight: 'normal' }}>({doc.consultationsCompleted})</span>
                        </div>
                      </td>
                      <td>
                        <span className={`dh-badge dh-badge-${doc.status.toLowerCase().replace(' ', '-')}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="dh-btn dh-btn-outline dh-btn-sm"
                            onClick={() => onSelectDoctor(doc.id)}
                            title="View Doctor Details"
                          >
                            Profile
                          </button>
                          <button
                            className="dh-btn dh-btn-outline dh-btn-sm"
                            onClick={() => onOpenEditDoctor(doc)}
                            title="Edit Doctor Profile"
                          >
                            Edit
                          </button>
                          <button
                            className={`dh-btn dh-btn-sm ${doc.status === 'Active' ? 'dh-btn-outline' : 'dh-btn-primary'}`}
                            onClick={() => onToggleStatus(doc.id, doc.status === 'Active' ? 'Inactive' : 'Active')}
                            title={doc.status === 'Active' ? 'Deactivate Doctor' : 'Activate Doctor'}
                          >
                            {doc.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DoctorsView;
