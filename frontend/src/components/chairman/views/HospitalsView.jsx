// MediMind Platform - Hospital Network & Workforce Drill-Down (Chairman / Platform Owner)
// Hospital-First Hierarchical Drill-Down: All Hospitals -> Selected Hospital Departments -> Department Doctors

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  MapPin,
  X,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Layers,
  Stethoscope,
  Sparkles,
  Activity,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function HospitalsView({ initialTab = 'hospitals', initialHospitalId = null, initialDeptId = null, announce }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'hospitals' | 'requests'
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Drill-down State
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState(null);
  const [drillDownHospital, setDrillDownHospital] = useState(null);
  const [drillDownDept, setDrillDownDept] = useState(null);
  const [hospitalDepartments, setHospitalDepartments] = useState([]);
  const [departmentDoctors, setDepartmentDoctors] = useState([]);
  const [selectedDoctorModal, setSelectedDoctorModal] = useState(null);
  const [deptSearch, setDeptSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRequestForModal, setSelectedRequestForModal] = useState(null);
  const [actionConfirm, setActionConfirm] = useState(null); // { type: 'approve'|'reject', request }

  // New hospital form state
  const [newHospital, setNewHospital] = useState({
    name: '',
    type: 'Multi-Specialty Hospital',
    city: '',
    state: '',
    address: '',
    adminName: '',
    adminEmail: '',
    phone: '',
    bedCapacity: 250,
  });

  const [dataVersion, setDataVersion] = useState(0);

  // Load all hospitals and requests
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      chairmanService.getHospitals(statusFilter),
      chairmanService.getHospitalRequests(),
    ]).then(([h, r]) => {
      if (isMounted) {
        setHospitals(h);
        setRequests(r);

        if (initialHospitalId) {
          const matchedHosp = h.find((item) => item.id === initialHospitalId);
          if (matchedHosp) {
            setDrillDownHospital((prev) => prev || matchedHosp);
          }
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [statusFilter, dataVersion, initialHospitalId]);

  // Load departments when drillDownHospital changes
  useEffect(() => {
    let isMounted = true;
    if (!drillDownHospital) return;
    chairmanService.getDepartmentsByHospitalId(drillDownHospital.id).then((deps) => {
      if (isMounted) {
        setHospitalDepartments(deps);
        if (initialDeptId) {
          const matchedDept = deps.find((d) => d.id === initialDeptId || d.name.toLowerCase() === initialDeptId.toLowerCase());
          if (matchedDept) {
            setDrillDownDept((prev) => prev || matchedDept);
          }
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [drillDownHospital, initialDeptId]);

  // Load doctors when drillDownDept changes
  useEffect(() => {
    let isMounted = true;
    if (!drillDownHospital || !drillDownDept) return;
    chairmanService.getDoctorsByDepartmentAndHospital(drillDownDept.name, drillDownHospital.id).then((docs) => {
      if (isMounted) {
        setDepartmentDoctors(docs);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [drillDownHospital, drillDownDept]);

  const handleApprove = async (request) => {
    try {
      await chairmanService.approveHospitalRequest(request.id);
      announce?.(`Approved onboarding request for ${request.name}. Hospital is now active in network.`);
      setActionConfirm(null);
      setDataVersion((v) => v + 1);
    } catch {
      announce?.('Failed to approve request.');
    }
  };

  const handleReject = async (request) => {
    try {
      await chairmanService.rejectHospitalRequest(request.id);
      announce?.(`Rejected onboarding request for ${request.name}.`);
      setActionConfirm(null);
      setDataVersion((v) => v + 1);
    } catch {
      announce?.('Failed to reject request.');
    }
  };

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    if (!newHospital.name.trim() || !newHospital.city.trim()) {
      announce?.('Please provide hospital name and location.');
      return;
    }

    try {
      await chairmanService.createHospital(newHospital);
      announce?.(`Hospital ${newHospital.name} successfully registered.`);
      setShowAddModal(false);
      setNewHospital({
        name: '',
        type: 'Multi-Specialty Hospital',
        city: '',
        state: '',
        address: '',
        adminName: '',
        adminEmail: '',
        phone: '',
        bedCapacity: 250,
      });
      setDataVersion((v) => v + 1);
    } catch {
      announce?.('Failed to create hospital.');
    }
  };

  const filteredHospitals = hospitals.filter((h) => {
    const s = search.toLowerCase();
    return (
      h.name.toLowerCase().includes(s) ||
      h.city.toLowerCase().includes(s) ||
      (h.adminName && h.adminName.toLowerCase().includes(s))
    );
  });

  const filteredDepartments = hospitalDepartments.filter((d) => {
    const s = deptSearch.toLowerCase();
    return (
      d.name.toLowerCase().includes(s) ||
      (d.headName && d.headName.toLowerCase().includes(s)) ||
      (d.linkedAi && d.linkedAi.toLowerCase().includes(s))
    );
  });

  const filteredDoctors = departmentDoctors.filter((doc) => {
    const s = doctorSearch.toLowerCase();
    return (
      doc.name.toLowerCase().includes(s) ||
      (doc.specialization && doc.specialization.toLowerCase().includes(s)) ||
      (doc.role && doc.role.toLowerCase().includes(s))
    );
  });

  const pendingRequestsCount = requests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="hospitals-view">
      {/* ---------------- LEVEL 0: ALL HOSPITALS VIEW ---------------- */}
      {!drillDownHospital && (
        <>
          <div className="view-header">
            <div className="view-header-title">
              <span className="view-header-icon">
                <Building2 size={24} />
              </span>
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Network & Workforce Architecture
                </p>
                <h1>Hospital Network Management</h1>
                <p>Hospital-first institutional oversight. Select any hospital to inspect its clinical departments and medical workforce.</p>
              </div>
            </div>

            <div className="view-actions">
              <button className="primary-button" onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                <span>Register Hospital</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="filter-bar">
            <div className="filter-pills">
              <button
                className={`filter-pill ${activeTab === 'hospitals' ? 'active' : ''}`}
                onClick={() => setActiveTab('hospitals')}
              >
                Registered Hospitals ({hospitals.length})
              </button>
              <button
                className={`filter-pill ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                Onboarding Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount} Pending)`}
              </button>
            </div>

            {activeTab === 'hospitals' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div className="chairman-search">
                  <Search size={15} />
                  <input
                    placeholder="Search hospital or city..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* Tab 1: Registered Hospitals Cards & Directory */}
          {activeTab === 'hospitals' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              {filteredHospitals.length === 0 ? (
                <div className="table-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--chair-muted)' }}>
                  No hospitals match your search criteria.
                </div>
              ) : (
                filteredHospitals.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="table-card"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              display: 'grid',
                              placeItems: 'center',
                              width: '46px',
                              height: '46px',
                              borderRadius: '12px',
                              background: '#e0e7ff',
                              color: '#312e81',
                              fontWeight: 800,
                              fontSize: '13px',
                            }}
                          >
                            HOSP
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>{hosp.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--chair-muted)', marginTop: '2px' }}>
                              <MapPin size={12} color="var(--chair-muted)" />
                              <span>{hosp.city}, {hosp.state}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`badge badge-${hosp.status.toLowerCase()}`}>{hosp.status}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px 12px', background: 'var(--chair-bg)', borderRadius: '10px', fontSize: '12px', marginBottom: '14px' }}>
                        <div>
                          <span style={{ color: 'var(--chair-muted)', fontSize: '10px', display: 'block' }}>ADMINISTRATOR</span>
                          <strong style={{ fontSize: '12px' }}>{hosp.adminName || 'Unassigned'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--chair-muted)', fontSize: '10px', display: 'block' }}>BED CAPACITY</span>
                          <strong style={{ fontSize: '12px' }}>{hosp.bedCapacity} Beds</strong>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', padding: '12px 0', borderTop: '1px solid var(--chair-border)', borderBottom: '1px solid var(--chair-border)', marginBottom: '16px' }}>
                        <div>
                          <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>DEPTS</small>
                          <div style={{ fontWeight: 700, fontSize: '15px' }}>{hosp.departmentsCount}</div>
                        </div>
                        <div>
                          <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>DOCTORS</small>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--chair-sapphire)' }}>{hosp.doctorsCount}</div>
                        </div>
                        <div>
                          <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>VISITS</small>
                          <div style={{ fontWeight: 700, fontSize: '15px' }}>{hosp.appointmentsCount}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="primary-button"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '8px 12px' }}
                        onClick={() => {
                          setDrillDownHospital(hosp);
                          setDrillDownDept(null);
                        }}
                      >
                        <Layers size={14} />
                        <span>View Departments ({hosp.departmentsCount})</span>
                      </button>
                      <button
                        className="secondary-button"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                        onClick={() => setSelectedHospitalForModal(hosp)}
                        title="View facility details"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Hospital Onboarding Requests */}
          {activeTab === 'requests' && (
            <div style={{ display: 'grid', gap: '16px', marginBottom: '28px' }}>
              {requests.length === 0 ? (
                <div className="table-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--chair-muted)' }}>
                  No onboarding requests are currently pending.
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="table-card" style={{ padding: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <div
                          style={{
                            display: 'grid',
                            placeItems: 'center',
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: '#fef3c7',
                            color: '#d97706',
                          }}
                        >
                          <Clock size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>{req.name}</h3>
                            <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                          </div>
                          <p style={{ margin: '4px 0', color: 'var(--chair-muted)', fontSize: '12px' }}>
                            {req.type} · Bed Capacity: {req.bedCapacity} · {req.city}, {req.state}
                          </p>
                          <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--chair-ink)' }}>{req.notes}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          className="secondary-button"
                          style={{ fontSize: '12px', padding: '7px 12px' }}
                          onClick={() => setSelectedRequestForModal(req)}
                        >
                          <Eye size={14} />
                          <span>View Details</span>
                        </button>
                        {req.status === 'Pending' && (
                          <>
                            <button
                              className="primary-button"
                              style={{ background: '#16a34a', fontSize: '12px', padding: '7px 12px' }}
                              onClick={() => setActionConfirm({ type: 'approve', request: req })}
                            >
                              <CheckCircle size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              className="secondary-button"
                              style={{ color: '#dc2626', borderColor: '#fca5a5', fontSize: '12px', padding: '7px 12px' }}
                              onClick={() => setActionConfirm({ type: 'reject', request: req })}
                            >
                              <XCircle size={14} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        marginTop: '16px',
                        paddingTop: '14px',
                        borderTop: '1px solid var(--chair-border)',
                        fontSize: '12px',
                        color: 'var(--chair-muted)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>
                        Contact: <b>{req.contactPerson}</b> ({req.contactRole})
                      </span>
                      <span>
                        Email: <b>{req.email}</b>
                      </span>
                      <span>
                        Phone: <b>{req.phone}</b>
                      </span>
                      <span>
                        Requested Departments: <b>{req.requestedDepartments?.join(', ')}</b>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ---------------- LEVEL 1: HOSPITAL DEPARTMENTS VIEW ---------------- */}
      {drillDownHospital && !drillDownDept && (
        <div>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13px', color: 'var(--chair-muted)', flexWrap: 'wrap' }}>
            <button
              className="text-button"
              style={{ padding: 0, color: 'var(--chair-sapphire)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => {
                setDrillDownHospital(null);
                setDrillDownDept(null);
              }}
            >
              <Building2 size={14} />
              <span>All Hospitals</span>
            </button>
            <ChevronRight size={14} />
            <strong style={{ color: 'var(--chair-ink)' }}>{drillDownHospital.name}</strong>
            <ChevronRight size={14} />
            <span>Departments</span>
          </div>

          <div className="view-header">
            <div className="view-header-title">
              <span className="view-header-icon">
                <Layers size={24} />
              </span>
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Hospital Departments · Level 1 Drill-Down
                </p>
                <h1>{drillDownHospital.name} Departments</h1>
                <p>Clinical departments, appointed department heads, and AI diagnostic integrations configured at this hospital.</p>
              </div>
            </div>

            <div className="view-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setDrillDownHospital(null);
                  setDrillDownDept(null);
                }}
              >
                <ArrowLeft size={15} />
                <span>Back to All Hospitals</span>
              </button>
            </div>
          </div>

          {/* Hospital Context Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'var(--chair-indigo-soft)',
              border: '1px solid var(--chair-border)',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Building2 size={22} color="var(--chair-indigo)" />
              <div>
                <strong style={{ fontSize: '15px' }}>{drillDownHospital.name}</strong>
                <span style={{ fontSize: '12px', color: 'var(--chair-muted)', display: 'block' }}>
                  {drillDownHospital.city}, {drillDownHospital.state} · Code: {drillDownHospital.code} · {drillDownHospital.accreditation}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '12px' }}>
              <span><b>Bed Capacity:</b> {drillDownHospital.bedCapacity}</span>
              <span><b>Assigned Admin:</b> {drillDownHospital.adminName}</span>
              <span><b>Total Doctors:</b> {drillDownHospital.doctorsCount}</span>
            </div>
          </div>

          {/* Search Departments */}
          <div className="filter-bar">
            <div className="chairman-search" style={{ width: '100%', maxWidth: '320px' }}>
              <Search size={15} />
              <input
                placeholder="Search department, head, or AI model..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Department Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {filteredDepartments.length === 0 ? (
              <div className="table-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--chair-muted)' }}>
                <Layers size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>No Clinical Departments Found</h3>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  {hospitalDepartments.length === 0
                    ? `No departments are registered for ${drillDownHospital.name} yet.`
                    : 'No departments match your filter search.'}
                </p>
              </div>
            ) : (
              filteredDepartments.map((dept) => (
                <div key={dept.id} className="table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                            background: dept.id === 'DEP-ORTHO' ? '#e0e7ff' : dept.id === 'DEP-DIAB' ? '#ccfbf1' : '#fce7f3',
                            color: dept.id === 'DEP-ORTHO' ? '#4338ca' : dept.id === 'DEP-DIAB' ? '#0f766e' : '#db2777',
                          }}
                        >
                          {dept.id === 'DEP-ORTHO' ? <Activity size={22} /> : dept.id === 'DEP-DIAB' ? <Stethoscope size={22} /> : <HeartPulse size={22} />}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'Plus Jakarta Sans' }}>{dept.name}</h3>
                          <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>{drillDownHospital.name}</span>
                        </div>
                      </div>
                      <span className="badge badge-active">{dept.status}</span>
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--chair-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                      {dept.description}
                    </p>

                    <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--chair-bg)', marginBottom: '14px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--chair-muted)', display: 'block', fontWeight: 700 }}>DEPARTMENT HEAD</span>
                      <strong style={{ fontSize: '13px', display: 'block', marginTop: '2px' }}>{dept.headName}</strong>
                      <small style={{ color: 'var(--chair-muted)', fontSize: '11px' }}>{dept.headEmail}</small>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'var(--chair-indigo-soft)', color: 'var(--chair-indigo)', fontSize: '12px', marginBottom: '16px' }}>
                      <Sparkles size={16} />
                      <span><b>Linked AI:</b> {dept.linkedAi}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--chair-border)', textAlign: 'center', marginBottom: '16px' }}>
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
                    onClick={() => setDrillDownDept(dept)}
                  >
                    <Stethoscope size={15} />
                    <span>View Doctors / Workforce ({dept.doctorsCount}) →</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------- LEVEL 2: DEPARTMENT DOCTORS VIEW ---------------- */}
      {drillDownHospital && drillDownDept && (
        <div>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13px', color: 'var(--chair-muted)', flexWrap: 'wrap' }}>
            <button
              className="text-button"
              style={{ padding: 0, color: 'var(--chair-sapphire)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => {
                setDrillDownHospital(null);
                setDrillDownDept(null);
              }}
            >
              <Building2 size={14} />
              <span>All Hospitals</span>
            </button>
            <ChevronRight size={14} />
            <button
              className="text-button"
              style={{ padding: 0, color: 'var(--chair-sapphire)', fontWeight: 600 }}
              onClick={() => setDrillDownDept(null)}
            >
              {drillDownHospital.name}
            </button>
            <ChevronRight size={14} />
            <button
              className="text-button"
              style={{ padding: 0, color: 'var(--chair-sapphire)', fontWeight: 600 }}
              onClick={() => setDrillDownDept(null)}
            >
              Departments
            </button>
            <ChevronRight size={14} />
            <strong style={{ color: 'var(--chair-ink)' }}>{drillDownDept.name}</strong>
            <ChevronRight size={14} />
            <span>Doctors</span>
          </div>

          <div className="view-header">
            <div className="view-header-title">
              <span className="view-header-icon">
                <Stethoscope size={24} />
              </span>
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Workforce Roster · Level 2 Drill-Down
                </p>
                <h1>{drillDownDept.name} Doctors & Specialists</h1>
                <p>Credentialed medical specialists assigned to {drillDownHospital.name} · {drillDownDept.name} Department.</p>
              </div>
            </div>

            <div className="view-actions">
              <button className="secondary-button" onClick={() => setDrillDownDept(null)}>
                <ArrowLeft size={15} />
                <span>Back to Departments</span>
              </button>
            </div>
          </div>

          {/* Hierarchy Info Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: '10px',
              background: 'var(--chair-indigo-soft)',
              border: '1px solid var(--chair-border)',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '13px',
            }}
          >
            <div>
              <span><b>Hospital:</b> {drillDownHospital.name} ({drillDownHospital.city})</span>
              <span style={{ margin: '0 8px' }}>·</span>
              <span><b>Department Head:</b> {drillDownDept.headName}</span>
              <span style={{ margin: '0 8px' }}>·</span>
              <span><b>Linked AI:</b> {drillDownDept.linkedAi}</span>
            </div>
            <div>
              <span className="badge badge-info">{departmentDoctors.length} Specialists Registered</span>
            </div>
          </div>

          {/* Search Doctor */}
          <div className="filter-bar">
            <div className="chairman-search" style={{ width: '100%', maxWidth: '320px' }}>
              <Search size={15} />
              <input
                placeholder="Search doctor, specialization, role..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Doctors Table Card */}
          <div className="table-card" style={{ marginBottom: '28px' }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor / Specialist</th>
                    <th>Clinical Role</th>
                    <th>Specialization</th>
                    <th>Qualifications</th>
                    <th>Experience</th>
                    <th>Total Consultations</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--chair-muted)' }}>
                        <Stethoscope size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <p style={{ margin: 0 }}>No credentialed doctors found for this department.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doc) => (
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
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{doc.role}</span>
                        </td>
                        <td>{doc.specialization}</td>
                        <td>
                          <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>{doc.qualifications}</span>
                        </td>
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

      {/* ---------------- SHARED MODALS & OVERLAYS ---------------- */}

      {/* Hospital Details Modal */}
      {selectedHospitalForModal && (
        <div className="modal-overlay" onClick={() => setSelectedHospitalForModal(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Hospital Information
                </p>
                <h2>{selectedHospitalForModal.name}</h2>
                <p>Facility Identification & Operational Footprint</p>
              </div>
              <button
                className="close-form"
                onClick={() => setSelectedHospitalForModal(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'var(--chair-bg)', borderRadius: '10px' }}>
                <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>STATUS</small>
                <div style={{ marginTop: '4px' }}>
                  <span className={`badge badge-${selectedHospitalForModal.status.toLowerCase()}`}>
                    {selectedHospitalForModal.status}
                  </span>
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--chair-bg)', borderRadius: '10px' }}>
                <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>BED CAPACITY</small>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
                  {selectedHospitalForModal.bedCapacity} Beds
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--chair-bg)', borderRadius: '10px' }}>
                <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>ACCREDITATION</small>
                <div style={{ fontWeight: 700, fontSize: '12px', marginTop: '4px' }}>
                  {selectedHospitalForModal.accreditation}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <strong>Assigned Hospital Administrator:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>
                  {selectedHospitalForModal.adminName} ({selectedHospitalForModal.adminEmail})
                </p>
              </div>

              <div>
                <strong>Address:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedHospitalForModal.address}</p>
              </div>

              <div>
                <strong>Departments Configured:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>
                  {selectedHospitalForModal.departments?.join(' · ') || 'Orthopedics, Diabetology, Cardiology'}
                </p>
              </div>

              <div style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', background: 'var(--chair-indigo-soft)' }}>
                <strong>Platform Performance Snapshot:</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
                  <span><b>Doctors:</b> {selectedHospitalForModal.doctorsCount}</span>
                  <span><b>Visits:</b> {selectedHospitalForModal.appointmentsCount}</span>
                  <span><b>AI Runs:</b> {selectedHospitalForModal.aiPredictionsCount}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={() => {
                  const targetHosp = selectedHospitalForModal;
                  setSelectedHospitalForModal(null);
                  setDrillDownHospital(targetHosp);
                  setDrillDownDept(null);
                }}
              >
                <Layers size={14} />
                <span>Drill Down to Departments</span>
              </button>
              <button className="primary-button" onClick={() => setSelectedHospitalForModal(null)}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Administrative Profile Modal */}
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

      {/* Request Details Modal */}
      {selectedRequestForModal && (
        <div className="modal-overlay" onClick={() => setSelectedRequestForModal(null)}>
          <div className="modal-dialog" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#fef3c7',
                    color: '#d97706',
                  }}
                >
                  <Clock size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>{selectedRequestForModal.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--chair-muted)' }}>
                      ID: {selectedRequestForModal.id} · Submitted {selectedRequestForModal.submittedDate}
                    </span>
                    <span className={`badge badge-${selectedRequestForModal.status.toLowerCase()}`}>
                      {selectedRequestForModal.status}
                    </span>
                  </div>
                </div>
              </div>
              <button className="close-form" onClick={() => setSelectedRequestForModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', margin: '16px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--chair-bg)', padding: '14px', borderRadius: '10px' }}>
                <div>
                  <span style={{ color: 'var(--chair-muted)', fontSize: '11px', display: 'block' }}>FACILITY TYPE</span>
                  <strong>{selectedRequestForModal.type}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--chair-muted)', fontSize: '11px', display: 'block' }}>PROPOSED BED CAPACITY</span>
                  <strong>{selectedRequestForModal.bedCapacity} Beds</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--chair-muted)', fontSize: '11px', display: 'block' }}>ACCREDITATION</span>
                  <strong>{selectedRequestForModal.accreditation || 'NABH Certified'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--chair-muted)', fontSize: '11px', display: 'block' }}>HEALTHCARE LICENSE</span>
                  <strong>{selectedRequestForModal.licenseNumber || 'Verified State Registration'}</strong>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--chair-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>FACILITY LOCATION & ADDRESS</span>
                <p style={{ margin: 0, color: 'var(--chair-ink)' }}>
                  {selectedRequestForModal.address}, {selectedRequestForModal.city}, {selectedRequestForModal.state}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ color: 'var(--chair-muted)', fontSize: '11px', display: 'block' }}>PRIMARY CONTACT</span>
                  <strong>{selectedRequestForModal.contactPerson}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--chair-muted)' }}>{selectedRequestForModal.contactRole}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--chair-muted)', fontSize: '11px', display: 'block' }}>COMMUNICATION</span>
                  <div style={{ fontSize: '12px', color: 'var(--chair-ink)' }}>{selectedRequestForModal.email}</div>
                  <div style={{ fontSize: '12px', color: 'var(--chair-muted)' }}>{selectedRequestForModal.phone}</div>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--chair-muted)', fontSize: '11px', display: 'block', marginBottom: '6px' }}>REQUESTED CLINICAL DEPARTMENTS</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedRequestForModal.requestedDepartments?.map((dept) => (
                    <span
                      key={dept}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--chair-card)',
                        border: '1px solid var(--chair-border)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--chair-sapphire)',
                      }}
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              {selectedRequestForModal.notes && (
                <div style={{ background: '#f8fafc', border: '1px solid var(--chair-border)', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ color: 'var(--chair-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>APPLICATION JUSTIFICATION</span>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--chair-ink)', lineHeight: 1.5 }}>
                    {selectedRequestForModal.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="secondary-button" onClick={() => setSelectedRequestForModal(null)}>
                Close
              </button>

              {selectedRequestForModal.status === 'Pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="secondary-button"
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={() => {
                      const req = selectedRequestForModal;
                      setSelectedRequestForModal(null);
                      setActionConfirm({ type: 'reject', request: req });
                    }}
                  >
                    <XCircle size={15} />
                    <span>Reject Request</span>
                  </button>
                  <button
                    className="primary-button"
                    style={{ background: '#16a34a' }}
                    onClick={() => {
                      const req = selectedRequestForModal;
                      setSelectedRequestForModal(null);
                      setActionConfirm({ type: 'approve', request: req });
                    }}
                  >
                    <CheckCircle size={15} />
                    <span>Approve & Onboard</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Approve / Reject */}
      {actionConfirm && (
        <div className="modal-overlay" onClick={() => setActionConfirm(null)}>
          <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color={actionConfirm.type === 'approve' ? '#16a34a' : '#dc2626'} />
                <h2 style={{ fontSize: '17px' }}>
                  {actionConfirm.type === 'approve' ? 'Approve Hospital Onboarding?' : 'Reject Hospital Onboarding?'}
                </h2>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--chair-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
              {actionConfirm.type === 'approve'
                ? `Authorizing ${actionConfirm.request.name} will add the facility to the active MediMind network and prepare its departmental hierarchy.`
                : `Are you sure you want to decline the network onboarding application for ${actionConfirm.request.name}?`}
            </p>

            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setActionConfirm(null)}>
                Cancel
              </button>
              <button
                className="primary-button"
                style={{ background: actionConfirm.type === 'approve' ? '#16a34a' : '#dc2626' }}
                onClick={() =>
                  actionConfirm.type === 'approve'
                    ? handleApprove(actionConfirm.request)
                    : handleReject(actionConfirm.request)
                }
              >
                {actionConfirm.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Hospital Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Register New Hospital Facility</h2>
                <p>Add a verified healthcare institution directly to the MediMind network</p>
              </div>
              <button className="close-form" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateHospital}>
              <div className="chair-form-grid">
                <div className="chair-form-group chair-form-full">
                  <label>Hospital Facility Name *</label>
                  <input
                    placeholder="e.g. MediMind North City Hospital"
                    value={newHospital.name}
                    onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                    required
                  />
                </div>

                <div className="chair-form-group">
                  <label>City *</label>
                  <input
                    placeholder="e.g. Bengaluru"
                    value={newHospital.city}
                    onChange={(e) => setNewHospital({ ...newHospital, city: e.target.value })}
                    required
                  />
                </div>

                <div className="chair-form-group">
                  <label>State *</label>
                  <input
                    placeholder="e.g. Karnataka"
                    value={newHospital.state}
                    onChange={(e) => setNewHospital({ ...newHospital, state: e.target.value })}
                    required
                  />
                </div>

                <div className="chair-form-group chair-form-full">
                  <label>Full Address</label>
                  <input
                    placeholder="Street, locality, postal code"
                    value={newHospital.address}
                    onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                  />
                </div>

                <div className="chair-form-group">
                  <label>Bed Capacity</label>
                  <input
                    type="number"
                    value={newHospital.bedCapacity}
                    onChange={(e) => setNewHospital({ ...newHospital, bedCapacity: Number(e.target.value) })}
                  />
                </div>

                <div className="chair-form-group">
                  <label>Contact Phone</label>
                  <input
                    placeholder="+91 80 1234 5678"
                    value={newHospital.phone}
                    onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value })}
                  />
                </div>

                <div className="chair-form-group">
                  <label>Assigned Hospital Admin Name</label>
                  <input
                    placeholder="e.g. Rajesh Kumar"
                    value={newHospital.adminName}
                    onChange={(e) => setNewHospital({ ...newHospital, adminName: e.target.value })}
                  />
                </div>

                <div className="chair-form-group">
                  <label>Admin Email</label>
                  <input
                    type="email"
                    placeholder="admin@hospital.org"
                    value={newHospital.adminEmail}
                    onChange={(e) => setNewHospital({ ...newHospital, adminEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Register Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
