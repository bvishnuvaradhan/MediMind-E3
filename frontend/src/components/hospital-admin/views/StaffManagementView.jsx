import { useState } from 'react';
import {
  Users,
  Search,
  UserCheck,
  Stethoscope,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export function StaffManagementView({
  departmentHeads,
  doctors,
  departments,
  onToggleHeadStatus,
  onToggleDoctorStatus,
  onSelectHead,
  onSelectDoctor,
  onOpenCreateHead,
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const headsList = departmentHeads.map((h) => ({
    ...h,
    staffType: 'Department Head',
    roleTag: 'HEAD',
  }));

  const docsList = doctors.map((d) => ({
    ...d,
    staffType: 'Staff Doctor',
    roleTag: 'DOCTOR',
  }));

  const combinedStaff = [...headsList, ...docsList];

  const filteredStaff = combinedStaff.filter((staff) => {
    const matchesRole = roleFilter === 'ALL' || staff.roleTag === roleFilter;
    const matchesDept = deptFilter === 'ALL' || staff.departmentId === deptFilter;
    const matchesSearch =
      !search ||
      staff.name.toLowerCase().includes(search.toLowerCase()) ||
      staff.email.toLowerCase().includes(search.toLowerCase()) ||
      staff.department.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesDept && matchesSearch;
  });

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <Users size={24} />
          </div>
          <div>
            <h1>Hospital Staff Directory & Management</h1>
            <p>Unified oversight of clinical staff across 3 Department Heads and 9 Staff Doctors (Total: 12 Clinical Staff)</p>
          </div>
        </div>

        <button className="ha-btn ha-btn-primary" onClick={onOpenCreateHead}>
          <UserCheck size={16} /> Add Department Head
        </button>
      </div>

      {/* Staff Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--ha-card)', border: '1px solid var(--ha-border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Staff</span>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>12 Personnel</div>
        </div>
        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--ha-card)', border: '1px solid var(--ha-border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Department Heads</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ha-indigo)' }}>3 Heads</div>
        </div>
        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--ha-card)', border: '1px solid var(--ha-border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Practicing Doctors</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ha-primary)' }}>9 Doctors</div>
        </div>
        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--ha-card)', border: '1px solid var(--ha-border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Status</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ha-success)' }}>100% Active</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ha-filter-bar">
        <div className="ha-search-box" style={{ width: '280px' }}>
          <Search size={15} style={{ color: 'var(--ha-text-muted)' }} />
          <input
            placeholder="Search staff by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ha-filter-pills">
          <button
            className={`ha-filter-pill ${roleFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setRoleFilter('ALL')}
          >
            All Roles ({combinedStaff.length})
          </button>
          <button
            className={`ha-filter-pill ${roleFilter === 'HEAD' ? 'active' : ''}`}
            onClick={() => setRoleFilter('HEAD')}
          >
            Department Heads (3)
          </button>
          <button
            className={`ha-filter-pill ${roleFilter === 'DOCTOR' ? 'active' : ''}`}
            onClick={() => setRoleFilter('DOCTOR')}
          >
            Staff Doctors (9)
          </button>
        </div>

        <select
          className="ha-select"
          style={{ width: 'auto', minWidth: '180px', padding: '6px 12px', fontSize: '12px' }}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Staff Table */}
      <div className="ha-table-container">
        <table className="ha-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Role Type</th>
              <th>Department</th>
              <th>Contact Info</th>
              <th>Qualifications / Specialty</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff) => (
              <tr key={staff.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: staff.roleTag === 'HEAD' ? 'var(--ha-soft-bg)' : 'var(--ha-bg)',
                        color: staff.roleTag === 'HEAD' ? 'var(--ha-indigo)' : 'var(--ha-primary)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid var(--ha-border)',
                      }}
                    >
                      {staff.avatarInitials}
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>{staff.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>{staff.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: staff.roleTag === 'HEAD' ? 'var(--ha-indigo)' : 'var(--ha-primary)',
                    }}
                  >
                    {staff.roleTag === 'HEAD' ? <UserCheck size={13} /> : <Stethoscope size={13} />}
                    {staff.staffType}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>{staff.department}</span>
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: 'var(--ha-text-muted)' }}>{staff.phone}</span>
                </td>
                <td>
                  <span style={{ fontSize: '12px' }}>{staff.specialization || staff.qualification}</span>
                </td>
                <td>
                  <span className={`ha-badge ${staff.status.toLowerCase()}`}>{staff.status}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      className="ha-btn ha-btn-secondary ha-btn-sm"
                      onClick={() => {
                        if (staff.roleTag === 'HEAD') {
                          onSelectHead(staff);
                        } else {
                          onSelectDoctor(staff);
                        }
                      }}
                    >
                      View Details
                    </button>
                    <button
                      className="ha-btn ha-btn-outline ha-btn-sm"
                      onClick={() => {
                        if (staff.roleTag === 'HEAD') {
                          onToggleHeadStatus(staff.id);
                        } else {
                          onToggleDoctorStatus(staff.id);
                        }
                      }}
                    >
                      {staff.status === 'Active' ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      {staff.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

