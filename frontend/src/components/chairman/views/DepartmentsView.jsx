// MediMind Platform - Departments Overview (Chairman / Platform Owner)
// Hospital-first clinical department overview and doctor workforce drill-down

import { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Stethoscope,
  HeartPulse,
  Activity,
  ShieldCheck,
  Building2,
  Eye,
  ChevronRight,
  ArrowLeft,
  Search,
  X,
  Brain,
  Wind,
  Droplets,
  UsersRound,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';
import { getDepartmentSpecialtyConfig } from '../../../utils/departmentTheme';

export function DepartmentsView({ onNavigate: _onNavigate }) {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('All');
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptDoctors, setDeptDoctors] = useState([]);
  const [selectedDoctorModal, setSelectedDoctorModal] = useState(null);
  const [docSearch, setDocSearch] = useState('');

  useEffect(() => {
    async function load() {
      const hosps = await chairmanService.getHospitals();
      setHospitals(hosps);
      const deps = await chairmanService.getDepartments(selectedHospitalId);
      setDepartments(deps);
    }
    load();
  }, [selectedHospitalId]);

  useEffect(() => {
    async function loadDocs() {
      if (selectedDept) {
        const docs = await chairmanService.getDoctorsByDepartmentAndHospital(
          selectedDept.name,
          selectedDept.hospitalId || selectedHospitalId
        );
        setDeptDoctors(docs);
      } else {
        setDeptDoctors([]);
      }
    }
    loadDocs();
  }, [selectedDept, selectedHospitalId]);

  const filteredDepts = departments.filter((dept) => {
    const s = search.toLowerCase();
    return (
      dept.name.toLowerCase().includes(s) ||
      dept.hospitalName.toLowerCase().includes(s) ||
      dept.headName.toLowerCase().includes(s) ||
      dept.linkedAi.toLowerCase().includes(s)
    );
  });

  const filteredDocs = deptDoctors.filter((doc) => {
    const s = docSearch.toLowerCase();
    return (
      doc.name.toLowerCase().includes(s) ||
      doc.specialization.toLowerCase().includes(s) ||
      doc.role.toLowerCase().includes(s)
    );
  });

  return (
    <div className="departments-view">
      {/* Level 0: Departments Directory */}
      {!selectedDept ? (
        <>
          <div className="view-header">
            <div className="view-header-title">
              <span className="view-header-icon">
                <Layers size={24} />
              </span>
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Clinical Organization & Hierarchy
                </p>
                <h1>Departments Overview</h1>
                <p>Cross-hospital oversight of specialized clinical departments, appointed department heads, and AI integrations.</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} color="var(--chair-muted)" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--chair-muted)' }}>Hospital:</span>
              </div>
              <select
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--chair-border)',
                  background: 'var(--chair-card)',
                  color: 'var(--chair-ink)',
                  fontSize: '12px',
                }}
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
              >
                <option value="All">All Hospitals ({hospitals.length})</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="chairman-search">
              <Search size={15} />
              <input
                placeholder="Search department or head..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Clinical Department Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {filteredDepts.length === 0 ? (
              <div className="table-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--chair-muted)' }}>
                No clinical departments found matching your filter criteria.
              </div>
            ) : (
              filteredDepts.map((dept) => {
                const specialty = getDepartmentSpecialtyConfig(dept);
                const renderIcon = () => {
                  switch (specialty.iconName) {
                    case 'Activity': return <Activity size={22} />;
                    case 'HeartPulse': return <HeartPulse size={22} />;
                    case 'Brain': return <Brain size={22} />;
                    case 'Wind': return <Wind size={22} />;
                    case 'UsersRound': return <UsersRound size={22} />;
                    case 'Layers': return <Layers size={22} />;
                    case 'Droplets': return <Droplets size={22} />;
                    case 'ShieldCheck': return <ShieldCheck size={22} />;
                    default: return <Stethoscope size={22} />;
                  }
                };

                return (
                  <div
                    key={dept.id}
                    className="table-card"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--chair-border)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              display: 'grid',
                              placeItems: 'center',
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: specialty.bgColor,
                              color: specialty.textColor,
                            }}
                          >
                            {renderIcon()}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'Plus Jakarta Sans' }}>{dept.name}</h3>
                            <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>{dept.hospitalName}</span>
                          </div>
                        </div>
                        <span className="badge badge-active">{dept.status}</span>
                      </div>

                      <p style={{ fontSize: '12px', color: 'var(--chair-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                        {dept.description}
                      </p>

                      <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--chair-bg)', marginBottom: '16px', border: '1px solid var(--chair-border)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--chair-muted)', display: 'block', fontWeight: 700 }}>DEPARTMENT HEAD</span>
                        <strong style={{ fontSize: '13px', display: 'block', marginTop: '2px' }}>{dept.headName}</strong>
                        <small style={{ color: 'var(--chair-muted)', fontSize: '11px' }}>{dept.headEmail}</small>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: specialty.badgeBg, color: specialty.textColor, fontSize: '12px', marginBottom: '18px', border: `1px solid ${specialty.borderColor}` }}>
                        <Sparkles size={16} />
                        <span><b>Linked Clinical AI:</b> {dept.linkedAi}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--chair-border)', textAlign: 'center', marginBottom: '16px' }}>
                        <div>
                          <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>DOCTORS</small>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--chair-sapphire)' }}>{dept.doctorsCount}</div>
                        </div>
                        <div>
                          <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>VISITS</small>
                          <div style={{ fontWeight: 700, fontSize: '15px' }}>{dept.appointmentsCount}</div>
                        </div>
                        <div>
                          <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>AI RUNS</small>
                          <div style={{ fontWeight: 700, fontSize: '15px' }}>{dept.predictionsCount}</div>
                        </div>
                      </div>
                    </div>

                    <button
                      className="primary-button"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => setSelectedDept(dept)}
                    >
                      <Stethoscope size={15} />
                      <span>View Department Faculty ({dept.doctorsCount}) →</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Level 1: Department Doctors Drill-Down */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13px', color: 'var(--chair-muted)', flexWrap: 'wrap' }}>
            <button
              className="text-button"
              style={{ padding: 0, color: 'var(--chair-sapphire)', fontWeight: 600 }}
              onClick={() => setSelectedDept(null)}
            >
              All Departments
            </button>
            <ChevronRight size={14} />
            <strong style={{ color: 'var(--chair-ink)' }}>{selectedDept.name} ({selectedDept.hospitalName})</strong>
            <ChevronRight size={14} />
            <span>Medical Workforce</span>
          </div>

          <div className="view-header">
            <div className="view-header-title">
              <span className="view-header-icon">
                <Stethoscope size={24} />
              </span>
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Workforce Roster · {selectedDept.hospitalName}
                </p>
                <h1>{selectedDept.name} Specialists</h1>
                <p>Credentialed medical specialists assigned to {selectedDept.name} Department.</p>
              </div>
            </div>

            <div className="view-actions">
              <button className="secondary-button" onClick={() => setSelectedDept(null)}>
                <ArrowLeft size={15} />
                <span>Back to Departments</span>
              </button>
            </div>
          </div>

          <div className="filter-bar">
            <div className="chairman-search" style={{ width: '100%', maxWidth: '320px' }}>
              <Search size={15} />
              <input
                placeholder="Search specialist or qualification..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-card" style={{ marginBottom: '28px' }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Role</th>
                    <th>Specialization</th>
                    <th>Qualifications</th>
                    <th>Experience</th>
                    <th>Consultations</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--chair-muted)' }}>
                        No doctors found for this department.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => (
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
                              <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>{doc.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{doc.role}</td>
                        <td>{doc.specialization}</td>
                        <td>{doc.qualifications}</td>
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
                            onClick={() => setSelectedDoctorModal(doc)}
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
        </div>
      )}

      {/* Doctor Profile Modal */}
      {selectedDoctorModal && (
        <div className="modal-overlay" onClick={() => setSelectedDoctorModal(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Clinical Workforce Profile
                </p>
                <h2>{selectedDoctorModal.name}</h2>
                <p>{selectedDoctorModal.role}</p>
              </div>
              <button className="close-form" onClick={() => setSelectedDoctorModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--chair-bg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div>
                    <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>DEPARTMENT</small>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedDoctorModal.department}</div>
                  </div>
                  <div>
                    <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>EXPERIENCE</small>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedDoctorModal.experience}</div>
                  </div>
                  <div>
                    <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>CONSULTATIONS</small>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedDoctorModal.totalConsultations}</div>
                  </div>
                </div>
              </div>

              <div>
                <strong>Hospital Facility:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedDoctorModal.hospital}</p>
              </div>

              <div>
                <strong>Primary Specialization:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedDoctorModal.specialization}</p>
              </div>

              <div>
                <strong>Academic & Clinical Qualifications:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedDoctorModal.qualifications}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong>Official Email:</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedDoctorModal.email}</p>
                </div>
                <div>
                  <strong>Contact Phone:</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedDoctorModal.phone}</p>
                </div>
              </div>

              <div className="privacy-banner" style={{ margin: 0 }}>
                <ShieldCheck size={16} />
                <span>
                  Administrative boundary active: Patient clinical charts are strictly protected under patient-doctor consent.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="primary-button" onClick={() => setSelectedDoctorModal(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Departmental Policy Note */}
      <div className="privacy-banner">
        <ShieldCheck size={18} />
        <div>
          <strong>Organizational Hierarchy</strong>
          <p style={{ margin: '2px 0 0' }}>
            Chairman oversees Department operational KPIs and cross-network workforce deployment. Department Heads manage doctor creation and clinical schedules for their specialized department.
          </p>
        </div>
      </div>
    </div>
  );
}
