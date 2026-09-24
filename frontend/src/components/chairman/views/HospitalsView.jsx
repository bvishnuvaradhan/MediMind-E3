// MediMind Platform - Hospitals Management (Chairman / Platform Owner)
// Section 4, 5, 6 of PLATFORM OWNER.txt: Hospitals directory, Onboarding Requests, and Hospital Details

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
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function HospitalsView({ initialTab = 'hospitals', announce }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'hospitals' | 'requests'
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
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

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      chairmanService.getHospitals(statusFilter),
      chairmanService.getHospitalRequests(),
    ]).then(([h, r]) => {
      if (isMounted) {
        setHospitals(h);
        setRequests(r);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [statusFilter, dataVersion]);

  const handleApprove = async (request) => {
    try {
      await chairmanService.approveHospitalRequest(request.id);
      announce(`Approved onboarding request for ${request.name}. Hospital is now active in network.`);
      setActionConfirm(null);
      setDataVersion((v) => v + 1);
    } catch {
      announce('Failed to approve request.');
    }
  };

  const handleReject = async (request) => {
    try {
      await chairmanService.rejectHospitalRequest(request.id);
      announce(`Rejected onboarding request for ${request.name}.`);
      setActionConfirm(null);
      setDataVersion((v) => v + 1);
    } catch {
      announce('Failed to reject request.');
    }
  };

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    if (!newHospital.name.trim() || !newHospital.city.trim()) {
      announce('Please provide hospital name and location.');
      return;
    }

    try {
      await chairmanService.createHospital(newHospital);
      announce(`Hospital ${newHospital.name} successfully registered.`);
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
      announce('Failed to create hospital.');
    }
  };

  const filteredHospitals = hospitals.filter((h) => {
    const s = search.toLowerCase();
    return (
      h.name.toLowerCase().includes(s) ||
      h.city.toLowerCase().includes(s) ||
      h.adminName.toLowerCase().includes(s)
    );
  });

  const pendingRequestsCount = requests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="hospitals-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <Building2 size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Network Infrastructure
            </p>
            <h1>Hospital Network Management</h1>
            <p>Govern member hospitals, inspect facility details, and authorize new onboarding requests.</p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

      {/* Tab 1: Registered Hospitals */}
      {activeTab === 'hospitals' && (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hospital Facility</th>
                  <th>Location</th>
                  <th>Hospital Admin</th>
                  <th>Departments</th>
                  <th>Workforce</th>
                  <th>Total Visits</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHospitals.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--chair-muted)' }}>
                      No hospitals match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHospitals.map((hosp) => (
                    <tr key={hosp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              display: 'grid',
                              placeItems: 'center',
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: '#e0e7ff',
                              color: '#312e81',
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                          >
                            HOSP
                          </div>
                          <div>
                            <strong>{hosp.name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>
                              Code: {hosp.code} · Joined {hosp.joinedDate}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={13} color="var(--chair-muted)" />
                          <span>
                            {hosp.city}, {hosp.state}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong>{hosp.adminName}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>{hosp.adminEmail}</div>
                      </td>
                      <td>{hosp.departmentsCount} Depts</td>
                      <td>{hosp.doctorsCount} Doctors</td>
                      <td>{hosp.appointmentsCount} Appointments</td>
                      <td>
                        <span className={`badge badge-${hosp.status.toLowerCase()}`}>{hosp.status}</span>
                      </td>
                      <td>
                        <button
                          className="secondary-button"
                          style={{ padding: '6px 12px', fontSize: '11px', gap: '5px' }}
                          onClick={() => setSelectedHospital(hosp)}
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Hospital Onboarding Requests */}
      {activeTab === 'requests' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {requests.length === 0 ? (
            <div className="table-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--chair-muted)' }}>
              No onboarding requests are currently pending.
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="table-card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
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

                  {req.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="primary-button"
                        style={{ background: '#16a34a' }}
                        onClick={() => setActionConfirm({ type: 'approve', request: req })}
                      >
                        <CheckCircle size={15} />
                        <span>Approve</span>
                      </button>
                      <button
                        className="secondary-button"
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        onClick={() => setActionConfirm({ type: 'reject', request: req })}
                      >
                        <XCircle size={15} />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
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

      {/* Hospital Details Modal (Section 6 of PLATFORM OWNER.txt) */}
      {selectedHospital && (
        <div className="modal-overlay" onClick={() => setSelectedHospital(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Hospital Information
                </p>
                <h2>{selectedHospital.name}</h2>
                <p>Facility Identification & Operational Footprint</p>
              </div>
              <button
                className="close-form"
                onClick={() => setSelectedHospital(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', background: 'var(--chair-bg)', borderRadius: '10px' }}>
                <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>STATUS</small>
                <div style={{ marginTop: '4px' }}>
                  <span className={`badge badge-${selectedHospital.status.toLowerCase()}`}>
                    {selectedHospital.status}
                  </span>
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--chair-bg)', borderRadius: '10px' }}>
                <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>BED CAPACITY</small>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
                  {selectedHospital.bedCapacity} Beds
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--chair-bg)', borderRadius: '10px' }}>
                <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>ACCREDITATION</small>
                <div style={{ fontWeight: 700, fontSize: '12px', marginTop: '4px' }}>
                  {selectedHospital.accreditation}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <strong>Assigned Hospital Administrator:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>
                  {selectedHospital.adminName} ({selectedHospital.adminEmail})
                </p>
              </div>

              <div>
                <strong>Address:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedHospital.address}</p>
              </div>

              <div>
                <strong>Departments Configured:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>
                  {selectedHospital.departments?.join(' · ') || 'Orthopedics, Diabetology, Cardiology'}
                </p>
              </div>

              <div style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', background: 'var(--chair-indigo-soft)' }}>
                <strong>Platform Performance Snapshot:</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
                  <span><b>Doctors:</b> {selectedHospital.doctorsCount}</span>
                  <span><b>Visits:</b> {selectedHospital.appointmentsCount}</span>
                  <span><b>AI Runs:</b> {selectedHospital.aiPredictionsCount}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="primary-button" onClick={() => setSelectedHospital(null)}>
                Close Details
              </button>
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
