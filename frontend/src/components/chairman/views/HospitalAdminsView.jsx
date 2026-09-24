// MediMind Platform - Hospital Admins Management (Chairman / Platform Owner)
// Section 7 & 8 of PLATFORM OWNER.txt: Admin Directory, Create Admin, Edit, Deactivate/Activate

import { useState, useEffect } from 'react';
import {
  UserCheck,
  UserPlus,
  Search,
  Eye,
  Power,
  ShieldAlert,
  Building2,
  X,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function HospitalAdminsView({ initialAction = null, announce }) {
  const [admins, setAdmins] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(initialAction === 'create');
  const [statusToggleConfirm, setStatusToggleConfirm] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    hospitalId: '',
    hospitalName: '',
    tempPassword: '',
  });

  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      chairmanService.getHospitalAdmins(),
      chairmanService.getHospitals(),
    ]).then(([a, h]) => {
      if (isMounted) {
        setAdmins(a);
        setHospitals(h);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [dataVersion]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.tempPassword) {
      announce('Please fill all required fields.');
      return;
    }

    try {
      const hospitalIdToUse = formData.hospitalId || hospitals[0]?.id || '';
      const selectedHosp = hospitals.find((h) => h.id === hospitalIdToUse);
      await chairmanService.createHospitalAdmin({
        ...formData,
        hospitalId: hospitalIdToUse,
        hospitalName: selectedHosp ? selectedHosp.name : formData.hospitalName,
      });

      announce(`Hospital Admin account for ${formData.name} created successfully.`);
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        hospitalId: hospitals[0]?.id || '',
        hospitalName: hospitals[0]?.name || '',
        tempPassword: '',
      });
      setDataVersion((v) => v + 1);
    } catch {
      announce('Failed to create Hospital Admin account.');
    }
  };

  const handleToggleStatus = async (admin) => {
    try {
      const updated = await chairmanService.toggleAdminStatus(admin.id);
      announce(`Admin ${admin.name} is now ${updated.status}.`);
      setStatusToggleConfirm(null);
      setDataVersion((v) => v + 1);
    } catch {
      announce('Failed to update admin status.');
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const s = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(s) ||
      a.email.toLowerCase().includes(s) ||
      a.hospitalName.toLowerCase().includes(s)
    );
  });

  return (
    <div className="hospital-admins-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <UserCheck size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Hospital Governance
            </p>
            <h1>Hospital Administrators</h1>
            <p>Appoint, manage, and supervise institutional administrators across member hospitals.</p>
          </div>
        </div>

        <div className="view-actions">
          <button className="primary-button" onClick={() => setShowCreateModal(true)}>
            <UserPlus size={16} />
            <span>Create Hospital Admin</span>
          </button>
        </div>
      </div>

      {/* Search and summary */}
      <div className="filter-bar">
        <div className="chairman-search">
          <Search size={15} />
          <input
            placeholder="Search by name, email, or hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: '13px', color: 'var(--chair-muted)' }}>
          Showing <b>{filteredAdmins.length}</b> administrators
        </div>
      </div>

      {/* Administrators Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Assigned Hospital</th>
                <th>Contact</th>
                <th>Created Date</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--chair-muted)' }}>
                    No hospital administrators found.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((adm) => (
                  <tr key={adm.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            display: 'grid',
                            placeItems: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: '#e0e7ff',
                            color: '#312e81',
                            fontWeight: 700,
                            fontSize: '12px',
                          }}
                        >
                          {adm.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong>{adm.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>ID: {adm.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={13} color="var(--chair-muted)" />
                        <strong>{adm.hospitalName}</strong>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>{adm.email}</div>
                      <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>{adm.phone}</div>
                    </td>
                    <td>{adm.createdAt}</td>
                    <td>{adm.lastLogin}</td>
                    <td>
                      <span className={`badge badge-${adm.status.toLowerCase()}`}>{adm.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          className="secondary-button"
                          style={{ padding: '6px 10px', fontSize: '11px', gap: '4px' }}
                          onClick={() => setSelectedAdmin(adm)}
                          title="View Admin Details"
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                        <button
                          className="secondary-button"
                          style={{
                            padding: '6px 10px',
                            fontSize: '11px',
                            gap: '4px',
                            color: adm.status === 'Active' ? '#d97706' : '#16a34a',
                          }}
                          onClick={() => setStatusToggleConfirm(adm)}
                          title={adm.status === 'Active' ? 'Deactivate Admin' : 'Activate Admin'}
                        >
                          <Power size={13} />
                          <span>{adm.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
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

      {/* Admin Details Modal */}
      {selectedAdmin && (
        <div className="modal-overlay" onClick={() => setSelectedAdmin(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Administrator Profile
                </p>
                <h2>{selectedAdmin.name}</h2>
                <p>Institutional Administrator Credentials & Assignment</p>
              </div>
              <button className="close-form" onClick={() => setSelectedAdmin(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--chair-bg)' }}>
                <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>ORGANIZATIONAL ROLE</span>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>
                  Hospital Admin (Level 2 Platform Authority)
                </div>
              </div>

              <div>
                <strong>Assigned Healthcare Facility:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedAdmin.hospitalName}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong>Email:</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedAdmin.email}</p>
                </div>
                <div>
                  <strong>Phone:</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedAdmin.phone}</p>
                </div>
              </div>

              <div>
                <strong>Delegated Institutional Responsibilities:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: '18px', color: 'var(--chair-muted)', fontSize: '12px', lineHeight: 1.6 }}>
                  <li>Create and assign Department Heads (Orthopedics, Diabetology, Cardiology)</li>
                  <li>Oversee hospital-wide doctor and staff appointments</li>
                  <li>Monitor hospital-level operational and AI performance</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button className="primary-button" onClick={() => setSelectedAdmin(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Toggle Confirm Modal */}
      {statusToggleConfirm && (
        <div className="modal-overlay" onClick={() => setStatusToggleConfirm(null)}>
          <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={20} color={statusToggleConfirm.status === 'Active' ? '#d97706' : '#16a34a'} />
                <h2>{statusToggleConfirm.status === 'Active' ? 'Deactivate Administrator?' : 'Activate Administrator?'}</h2>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--chair-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
              {statusToggleConfirm.status === 'Active'
                ? `Deactivating ${statusToggleConfirm.name} will suspend their login access to ${statusToggleConfirm.hospitalName}. Existing department and doctor data will be preserved.`
                : `Activating ${statusToggleConfirm.name} will restore their login access to manage operations at ${statusToggleConfirm.hospitalName}.`}
            </p>
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setStatusToggleConfirm(null)}>
                Cancel
              </button>
              <button
                className="primary-button"
                style={{ background: statusToggleConfirm.status === 'Active' ? '#d97706' : '#16a34a' }}
                onClick={() => handleToggleStatus(statusToggleConfirm)}
              >
                {statusToggleConfirm.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Hospital Admin Modal (Section 8 of PLATFORM OWNER.txt) */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Create Hospital Administrator</h2>
                <p>Provision an institutional admin account for a member hospital</p>
              </div>
              <button className="close-form" onClick={() => setShowCreateModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin}>
              <div className="chair-form-grid">
                <div className="chair-form-group chair-form-full">
                  <label>Full Name *</label>
                  <input
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="chair-form-group">
                  <label>Official Email Address *</label>
                  <input
                    type="email"
                    placeholder="rajesh.kumar@medimind.hospital"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="chair-form-group">
                  <label>Contact Phone</label>
                  <input
                    placeholder="+91 98765 11223"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="chair-form-group chair-form-full">
                  <label>Assigned Hospital Facility *</label>
                  <select
                    value={formData.hospitalId}
                    onChange={(e) => {
                      const h = hospitals.find((item) => item.id === e.target.value);
                      setFormData({
                        ...formData,
                        hospitalId: e.target.value,
                        hospitalName: h ? h.name : '',
                      });
                    }}
                    required
                  >
                    {hospitals.map((hosp) => (
                      <option key={hosp.id} value={hosp.id}>
                        {hosp.name} ({hosp.city}, {hosp.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="chair-form-group chair-form-full">
                  <label>Initial Temporary Password *</label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={formData.tempPassword}
                    onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                    required
                  />
                  <small style={{ color: 'var(--chair-muted)', fontSize: '11px', marginTop: '4px' }}>
                    The administrator will be prompted to reset their password upon initial session login.
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
