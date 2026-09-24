import React, { useState } from 'react';

export function PatientsView({
  patients = [],
  onSelectPatient,
  onOpenNewConsultation,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);

  const filteredPatients = patients.filter((pat) => {
    const matchesStatus = statusFilter === 'All' || pat.accessStatus === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      pat.name.toLowerCase().includes(q) ||
      pat.bloodGroup.toLowerCase().includes(q) ||
      pat.chiefComplaint.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Privacy Notice */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              Authorized Patient Clinical Directory
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Access is strictly restricted to patients who have explicitly granted permission via their Family Portal
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="doctor-btn doctor-btn-outline doctor-btn-sm"
              onClick={() => setShowUnauthorizedModal(true)}
              title="Demonstrate privacy firewall"
            >
              Simulate Unauthorized Access Check
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="doctor-card" style={{ padding: '16px 20px' }}>
        <div className="doctor-filter-bar" style={{ margin: 0 }}>
          <div className="doctor-filter-left">
            <div className="doctor-search-input">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="Search by patient name, blood group, symptoms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="doctor-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Access Statuses</option>
              <option value="Active">Active Authorization</option>
              <option value="Revoked">Revoked Access</option>
            </select>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
            Showing <strong>{filteredPatients.length}</strong> authorized patients
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="doctor-card">
        <div className="doctor-table-container">
          <table className="doctor-table">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Age / Gender / Blood</th>
                <th>Chief Clinical Presentation</th>
                <th>Medical Records & AI</th>
                <th>Authorization Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--doctor-text-muted)' }}>
                    No authorized patients found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((pat) => (
                  <tr key={pat.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--doctor-text-primary)' }}>{pat.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)' }}>
                          Emergency: {pat.emergencyContact}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{pat.gender}, {pat.age} yrs</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--doctor-primary)', fontWeight: 700 }}>
                        Blood: {pat.bloodGroup}
                      </div>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-secondary)', lineHeight: 1.3 }}>
                        {pat.chiefComplaint}
                      </div>
                      {pat.chronicConditions && pat.chronicConditions.length > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
                          Chronic: {pat.chronicConditions.join(' • ')}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                        <span>📁 {pat.medicalRecords?.length || 0} Reports & Scans</span>
                        <span style={{ color: 'var(--doctor-teal)', fontWeight: 600 }}>
                          🤖 {pat.aiPredictions?.length || 0} AI Findings
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`doctor-badge doctor-badge-${pat.accessStatus.toLowerCase()}`}>
                        ● {pat.accessStatus}
                      </span>
                      <div style={{ fontSize: '10.5px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
                        Granted: {pat.accessGrantedDate}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="doctor-btn doctor-btn-primary doctor-btn-sm"
                          onClick={() => onSelectPatient(pat.id)}
                        >
                          View Profile
                        </button>
                        <button
                          className="doctor-btn doctor-btn-outline doctor-btn-sm"
                          onClick={() => onOpenNewConsultation(pat)}
                        >
                          Consult
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unauthorized Access Simulation Modal */}
      {showUnauthorizedModal && (
        <div className="doctor-modal-overlay" onClick={() => setShowUnauthorizedModal(false)}>
          <div className="doctor-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="doctor-modal-header">
              <h3 className="doctor-modal-title" style={{ color: 'var(--doctor-coral)' }}>
                🔒 Unauthorized Patient Access Firewall
              </h3>
              <button className="doctor-btn-icon" onClick={() => setShowUnauthorizedModal(false)} aria-label="Close modal">
                ✕
              </button>
            </div>
            <div className="doctor-modal-body">
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--doctor-soft-coral)', borderRadius: '8px', borderLeft: '4px solid var(--doctor-coral)', fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>
                <strong>403 Forbidden:</strong> You do not have active clinical authorization for patient <em>"Suresh Verma (fam_004)"</em>.
                <br /><br />
                Under MediMind's strict patient authorization matrix, booking an appointment or being a hospital doctor does not grant access to medical records without explicit family consent.
              </div>
            </div>
            <div className="doctor-modal-footer">
              <button className="doctor-btn doctor-btn-primary" onClick={() => setShowUnauthorizedModal(false)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientsView;
