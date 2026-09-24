// MediMind Platform - Family Accounts Overview (Chairman / Platform Owner)
// Section 11 of PLATFORM OWNER.txt: Platform-level family account statistics
// Strict Privacy: Aggregate account metadata only, strictly NO private patient records or scans.

import { useState, useEffect } from 'react';
import {
  UsersRound,
  Search,
  Eye,
  ShieldCheck,
  MapPin,
  X,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function FamilyAccountsView() {
  const [families, setFamilies] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFamily, setSelectedFamily] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await chairmanService.getFamilyAccounts(search);
      setFamilies(data);
    }
    load();
  }, [search]);

  return (
    <div className="family-accounts-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <UsersRound size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              End-User Accounts
            </p>
            <h1>Family Accounts Overview</h1>
            <p>Platform-level metrics and administrative account records for registered family healthcare portals.</p>
          </div>
        </div>
      </div>

      {/* Strict Privacy Guarantee Banner */}
      <div className="privacy-banner">
        <ShieldCheck size={18} />
        <div>
          <strong>Strict Patient Medical Record Confidentiality</strong>
          <p style={{ margin: '2px 0 0' }}>
            In accordance with the MediMind Permission Matrix, the Chairman role monitors only aggregate platform usage and account metadata. Individual patient health charts, diagnostic documents, and medical scans remain private and accessible only to authorized clinical practitioners.
          </p>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <p>Total Registered Families</p>
          <h3 style={{ marginTop: '8px' }}>{families.length}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Verified accounts</small>
        </div>
        <div className="stat-card">
          <p>Total Covered Members</p>
          <h3 style={{ marginTop: '8px' }}>
            {families.reduce((acc, f) => acc + f.membersCount, 0)}
          </h3>
          <small style={{ color: 'var(--chair-muted)' }}>Individual health profiles</small>
        </div>
        <div className="stat-card">
          <p>Health Documents Stored</p>
          <h3 style={{ marginTop: '8px' }}>
            {families.reduce((acc, f) => acc + f.totalRecordsUploaded, 0)}
          </h3>
          <small style={{ color: 'var(--chair-muted)' }}>Secured under family vault</small>
        </div>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="chairman-search">
          <Search size={15} />
          <input
            placeholder="Search family name, primary contact, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '13px', color: 'var(--chair-muted)' }}>
          Showing <b>{families.length}</b> registered accounts
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Family Account</th>
                <th>Primary Account Holder</th>
                <th>Location</th>
                <th>Member Profiles</th>
                <th>Total Uploads</th>
                <th>Appointments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {families.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--chair-muted)' }}>
                    No family accounts match your search.
                  </td>
                </tr>
              ) : (
                families.map((fam) => (
                  <tr key={fam.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            display: 'grid',
                            placeItems: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: '#fef3c7',
                            color: '#d97706',
                            fontWeight: 700,
                            fontSize: '12px',
                          }}
                        >
                          FAM
                        </div>
                        <div>
                          <strong>{fam.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>
                            ID: {fam.id} · Registered {fam.registeredDate}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{fam.primaryContact}</div>
                      <small style={{ color: 'var(--chair-muted)' }}>{fam.email}</small>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={13} color="var(--chair-muted)" />
                        <span>{fam.city}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{fam.membersCount}</strong> members
                    </td>
                    <td>{fam.totalRecordsUploaded} files</td>
                    <td>{fam.totalAppointmentsBooked} booked</td>
                    <td>
                      <span className={`badge badge-${fam.status.toLowerCase()}`}>{fam.status}</span>
                    </td>
                    <td>
                      <button
                        className="secondary-button"
                        style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }}
                        onClick={() => setSelectedFamily(fam)}
                      >
                        <Eye size={13} />
                        <span>Account Info</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Info Modal */}
      {selectedFamily && (
        <div className="modal-overlay" onClick={() => setSelectedFamily(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Account Metadata
                </p>
                <h2>{selectedFamily.name}</h2>
                <p>Administrative metadata and platform usage summary</p>
              </div>
              <button className="close-form" onClick={() => setSelectedFamily(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--chair-bg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                  <div>
                    <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>MEMBERS</small>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedFamily.membersCount} Profiles</div>
                  </div>
                  <div>
                    <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>UPLOADS</small>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedFamily.totalRecordsUploaded} Records</div>
                  </div>
                  <div>
                    <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>APPOINTMENTS</small>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedFamily.totalAppointmentsBooked} Visits</div>
                  </div>
                </div>
              </div>

              <div>
                <strong>Primary Account Creator:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>
                  {selectedFamily.primaryContact} ({selectedFamily.email} · {selectedFamily.phone})
                </p>
              </div>

              <div>
                <strong>Registration Date:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedFamily.registeredDate}</p>
              </div>

              <div>
                <strong>Last Platform Activity:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)' }}>{selectedFamily.lastActive}</p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '11px', color: '#991b1b' }}>
                Note: Individual patient names, relationships, diagnoses, and medical histories are encrypted and protected under patient privacy regulations.
              </div>
            </div>

            <div className="modal-footer">
              <button className="primary-button" onClick={() => setSelectedFamily(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
