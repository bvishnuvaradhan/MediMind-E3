// MediMind Platform - Doctors Directory (Chairman / Platform Owner)
// Section 10 of PLATFORM OWNER.txt: Cross-platform medical workforce directory
// Strict Privacy: Administrative info only, NO patient medical records.

import { useState, useEffect } from 'react';
import {
  Stethoscope,
  Search,
  Eye,
  X,
  ShieldCheck,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function DoctorsView() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    async function load() {
      const docs = await chairmanService.getDoctors(search, departmentFilter);
      setDoctors(docs);
    }
    load();
  }, [search, departmentFilter]);

  return (
    <div className="doctors-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <Stethoscope size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Medical Workforce
            </p>
            <h1>Platform Doctors Directory</h1>
            <p>Institutional oversight of credentialed clinical specialists across member hospitals.</p>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="privacy-banner">
        <ShieldCheck size={18} />
        <div>
          <strong>Administrative Access Boundary</strong>
          <p style={{ margin: '2px 0 0' }}>
            The Chairman monitors medical workforce credentials, departmental allocation, and consultation volume. Individual patient clinical records and diagnostic charts are not accessible to platform administration.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-pills">
          <button
            className={`filter-pill ${departmentFilter === 'All' ? 'active' : ''}`}
            onClick={() => setDepartmentFilter('All')}
          >
            All Departments (9)
          </button>
          <button
            className={`filter-pill ${departmentFilter === 'Orthopedics' ? 'active' : ''}`}
            onClick={() => setDepartmentFilter('Orthopedics')}
          >
            Orthopedics (3)
          </button>
          <button
            className={`filter-pill ${departmentFilter === 'Diabetology' ? 'active' : ''}`}
            onClick={() => setDepartmentFilter('Diabetology')}
          >
            Diabetology (3)
          </button>
          <button
            className={`filter-pill ${departmentFilter === 'Cardiology' ? 'active' : ''}`}
            onClick={() => setDepartmentFilter('Cardiology')}
          >
            Cardiology (3)
          </button>
        </div>

        <div className="chairman-search">
          <Search size={15} />
          <input
            placeholder="Search doctor or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Doctors Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Department</th>
                <th>Specialization</th>
                <th>Hospital</th>
                <th>Experience</th>
                <th>Total Consultations</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--chair-muted)' }}>
                    No doctors match the specified filter criteria.
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            display: 'grid',
                            placeItems: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: '#dbeafe',
                            color: '#2563eb',
                            fontWeight: 700,
                            fontSize: '12px',
                          }}
                        >
                          DR
                        </div>
                        <div>
                          <strong>{doc.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>{doc.role}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{doc.department}</span>
                    </td>
                    <td>{doc.specialization}</td>
                    <td>{doc.hospital}</td>
                    <td>{doc.experience}</td>
                    <td>
                      <strong>{doc.totalConsultations}</strong> completed
                    </td>
                    <td>
                      <span className="badge badge-active">{doc.status}</span>
                    </td>
                    <td>
                      <button
                        className="secondary-button"
                        style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }}
                        onClick={() => setSelectedDoctor(doc)}
                      >
                        <Eye size={13} />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctor Administrative Profile Modal */}
      {selectedDoctor && (
        <div className="modal-overlay" onClick={() => setSelectedDoctor(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Clinical Workforce Profile
                </p>
                <h2>{selectedDoctor.name}</h2>
                <p>{selectedDoctor.role}</p>
              </div>
              <button className="close-form" onClick={() => setSelectedDoctor(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--chair-bg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div>
                    <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>DEPARTMENT</small>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedDoctor.department}</div>
                  </div>
                  <div>
                    <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>EXPERIENCE</small>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedDoctor.experience}</div>
                  </div>
                  <div>
                    <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>CONSULTATIONS</small>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedDoctor.totalConsultations}</div>
                  </div>
                </div>
              </div>

              <div>
                <strong>Primary Specialization:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedDoctor.specialization}</p>
              </div>

              <div>
                <strong>Academic & Clinical Qualifications:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedDoctor.qualifications}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong>Official Email:</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedDoctor.email}</p>
                </div>
                <div>
                  <strong>Contact Phone:</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedDoctor.phone}</p>
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--chair-indigo-soft)', fontSize: '11px', color: 'var(--chair-indigo)' }}>
                Patient Medical Record Access: Only granted when a family member selects this doctor under the MediMind 'Share Everything' patient-doctor protocol.
              </div>
            </div>

            <div className="modal-footer">
              <button className="primary-button" onClick={() => setSelectedDoctor(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
