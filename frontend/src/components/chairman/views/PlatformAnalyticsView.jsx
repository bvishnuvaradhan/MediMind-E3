// MediMind Platform - Platform Analytics (Chairman / Platform Owner)
// Section 16 of PLATFORM OWNER.txt: Cross-platform utilization, user distribution, and appointment analytics
// Comprehensive Platform User Directory with Active & Deactivated account classification

import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  UsersRound,
  CalendarDays,
  CheckCircle,
  Clock,
  Calendar,
  Search,
  ShieldCheck,
  UserX,
  UserCheck,
  Filter,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';
import { DonutChart } from '../../common/charts';
import { RELATIVE_PERIOD_OPTIONS } from '../../../utils/dateUtils';

export function PlatformAnalyticsView() {
  const [summary, setSummary] = useState(null);
  const [dateRange, setDateRange] = useState('All Time');
  const [usersList, setUsersList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const [data, doctors, admins, families, heads] = await Promise.all([
        chairmanService.getPlatformSummary(),
        chairmanService.getDoctors('', 'All', 'All'),
        chairmanService.getHospitalAdmins(),
        chairmanService.getFamilyAccounts(),
        chairmanService.getDepartmentHeads(),
      ]);
      setSummary(data);

      // Build unified platform accounts roster
      const roster = [];

      // 1. Doctors (66 Active + 2 Deactivated)
      doctors.forEach((d) => {
        const isDeact = (d.status || '').toLowerCase() === 'inactive';
        roster.push({
          id: d.id || d._id,
          name: d.name || d.fullName,
          email: d.email,
          role: 'Doctor',
          specialty: d.specialization || d.department,
          facility: d.hospital || d.hospitalName || 'MediMind Network Hospital',
          status: isDeact ? 'Deactivated' : 'Active',
          authStatus: isDeact ? 'Login Denied (HTTP 403)' : 'Authorized',
          deactivationReason: isDeact ? (d.professionalDescription || 'Retired / Inactive Account') : null,
        });
      });

      // 2. Department Heads
      (heads || []).forEach((h) => {
        const isDeact = (h.status || '').toUpperCase() === 'INACTIVE' || h.status === 'Inactive' || h.status === 'Deactivated';
        roster.push({
          id: h.id || h.headId || h._id,
          name: h.fullName || h.name || 'Department Head',
          email: h.email,
          role: 'Department Head',
          specialty: h.specialization || h.departmentName || 'Clinical Management',
          facility: h.hospitalName || 'Network Facility',
          status: isDeact ? 'Deactivated' : 'Active',
          authStatus: isDeact ? 'Login Denied (HTTP 403)' : 'Authorized',
          deactivationReason: isDeact ? (h.deactivationReason || 'Administrative Deactivation') : null,
        });
      });

      // 3. Hospital Admins
      admins.forEach((a) => {
        const isDeact = (a.status || '').toLowerCase() === 'inactive' || a.status === 'Deactivated';
        roster.push({
          id: a.id,
          name: a.name,
          email: a.email,
          role: 'Hospital Admin',
          specialty: 'Administration',
          facility: a.hospitalName || 'Network Facility',
          status: isDeact ? 'Deactivated' : 'Active',
          authStatus: isDeact ? 'Login Denied (HTTP 403)' : 'Authorized',
          deactivationReason: isDeact ? (a.deactivationReason || 'Administrative Deactivation') : null,
        });
      });

      // 4. Family Accounts
      families.forEach((f) => {
        const isDeact = (f.status || '').toLowerCase() === 'inactive' || f.status === 'Deactivated';
        roster.push({
          id: f.id,
          name: f.name,
          email: f.email || f.primaryContact,
          role: 'Family Account',
          specialty: `${f.membersCount ?? 0} Members`,
          facility: f.city || 'Bengaluru',
          status: isDeact ? 'Deactivated' : 'Active',
          authStatus: isDeact ? 'Login Denied (HTTP 403)' : 'Authorized',
          deactivationReason: isDeact ? (f.deactivationReason || 'Household Deactivation') : null,
        });
      });

      // 5. Platform Owners (Chairmen)
      roster.push({
        id: 'CHAIR-01',
        name: 'Executive Chairman',
        email: 'chairman@medimind.org',
        role: 'Platform Owner',
        specialty: 'Executive Governance',
        facility: 'MediMind Healthcare Group',
        status: 'Active',
        authStatus: 'Authorized',
      });
      roster.push({
        id: 'CHAIR-02',
        name: 'Co-Chairman & Clinical Director',
        email: 'chairman@medimind.com',
        role: 'Platform Owner',
        specialty: 'Clinical Governance',
        facility: 'MediMind Healthcare Group',
        status: 'Active',
        authStatus: 'Authorized',
      });

      setUsersList(roster);
    }
    load();
  }, [dateRange]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (statusFilter !== 'All' && u.status !== statusFilter) return false;
      if (roleFilter !== 'All' && u.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.facility.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          (u.specialty && u.specialty.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [usersList, statusFilter, roleFilter, search]);

  if (!summary) return <div className="loading-state">Loading Platform Analytics...</div>;

  const totalUsers =
    (summary.totalFamilyMembers ?? 0) +
    summary.totalDoctors +
    summary.totalDepartmentHeads +
    summary.totalHospitalAdmins;

  const userData = [
    { label: 'Family Members', value: summary.totalFamilyMembers ?? 0, color: '#f59e0b' },
    { label: 'Doctors', value: summary.totalDoctors ?? 0, color: '#0f766e' },
    { label: 'Department Heads', value: summary.totalDepartmentHeads ?? 0, color: '#2563eb' },
    { label: 'Hospital Admins', value: summary.totalHospitalAdmins ?? 0, color: '#4338ca' },
  ];

  const totalAppts = summary.totalAppointments ?? 0;
  const compAppts = summary.completedAppointments ?? 0;
  const upcomAppts = summary.upcomingAppointments ?? 0;
  const cancAppts = summary.cancelledAppointments ?? 0;

  const apptData = [
    { label: 'Completed', value: compAppts, color: '#16a34a' },
    { label: 'Upcoming', value: upcomAppts, color: '#f59e0b' },
    { label: 'Cancelled', value: cancAppts, color: '#dc2626' },
  ];

  const activeCount = usersList.filter((u) => u.status === 'Active').length;
  const deactCount = usersList.filter((u) => u.status === 'Deactivated').length;

  return (
    <div className="platform-analytics-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <TrendingUp size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Executive Metrics
            </p>
            <h1>Platform Usage & Growth Analytics</h1>
            <p>Comprehensive statistical breakdown across users, appointments, and clinical throughput.</p>
          </div>
        </div>

        {/* Standardized Dynamic Relative Date Range Selector */}
        <div className="view-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--chair-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--chair-border)' }}>
            <Calendar size={15} style={{ color: 'var(--chair-sapphire)' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--chair-muted)' }}>Range:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontSize: '13px', fontWeight: '600', color: 'var(--chair-text)', cursor: 'pointer', outline: 'none' }}
            >
              {RELATIVE_PERIOD_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid: 2 Pillars of Platform Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px', marginBottom: '28px' }}>
        {/* Pillar 1: User Analytics with Donut Visualization */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#dbeafe', color: '#2563eb' }}>
              <UsersRound size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>Platform User Distribution</h3>
              <small style={{ color: 'var(--chair-muted)' }}>Distribution across {totalUsers} registered clinical and patient accounts</small>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <DonutChart
              data={userData}
              size={150}
              innerRadius={42}
              outerRadius={65}
              centerValue={totalUsers}
              centerLabel="Accounts"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--chair-border)', fontSize: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--chair-bg)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--chair-muted)', fontSize: '11px' }}>Families</span>
              <div style={{ fontWeight: 700, marginTop: '2px' }}>{summary.totalFamilyAccounts} ({summary.totalFamilyMembers ?? 0} members)</div>
            </div>
            <div style={{ padding: '8px', background: 'var(--chair-bg)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--chair-muted)', fontSize: '11px' }}>Clinical Staff</span>
              <div style={{ fontWeight: 700, marginTop: '2px' }}>{summary.totalDoctors + summary.totalDepartmentHeads} Faculty</div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Appointment Analytics with Donut Visualization */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#ccfbf1', color: '#0f766e' }}>
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>Appointment Resolution</h3>
              <small style={{ color: 'var(--chair-muted)' }}>{totalAppts} total registered patient visits</small>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <DonutChart
              data={apptData}
              size={150}
              innerRadius={42}
              outerRadius={65}
              centerValue={totalAppts}
              centerLabel="Visits"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#dcfce7', borderRadius: '6px', color: '#166534' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle size={13} /> Completed</span>
              <strong>{compAppts} ({Math.round((compAppts / totalAppts) * 100)}%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#fef3c7', borderRadius: '6px', color: '#92400e' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={13} /> Upcoming</span>
              <strong>{upcomAppts} ({Math.round((upcomAppts / totalAppts) * 100)}%)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Platform User Directory Section */}
      <div className="table-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UsersRound size={20} style={{ color: 'var(--chair-sapphire)' }} />
              <h3 style={{ margin: 0, fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>
                Platform User Directory
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--chair-muted)', fontSize: '12px' }}>
              Canonical authentication and identity registry across active operational staff and deactivated accounts ({usersList.length} Accounts Total)
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--chair-bg)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--chair-border)' }}>
              <Search size={14} style={{ color: 'var(--chair-muted)' }} />
              <input
                type="text"
                placeholder="Search name, email, facility..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontSize: '12px', color: 'var(--chair-text)', outline: 'none', width: '180px' }}
              />
            </div>

            {/* Role Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--chair-bg)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--chair-border)' }}>
              <Filter size={13} style={{ color: 'var(--chair-muted)' }} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontSize: '12px', fontWeight: '600', color: 'var(--chair-text)', cursor: 'pointer', outline: 'none' }}
              >
                <option value="All">All Roles</option>
                <option value="Doctor">Doctors</option>
                <option value="Department Head">Department Heads</option>
                <option value="Hospital Admin">Hospital Admins</option>
                <option value="Family Account">Family Accounts</option>
                <option value="Platform Owner">Platform Owners</option>
              </select>
            </div>

            {/* Status Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`chair-pill ${statusFilter === 'All' ? 'active' : ''}`}
                onClick={() => setStatusFilter('All')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--chair-border)',
                  backgroundColor: statusFilter === 'All' ? 'var(--chair-sapphire)' : 'var(--chair-bg)',
                  color: statusFilter === 'All' ? '#fff' : 'var(--chair-text)',
                }}
              >
                All ({usersList.length})
              </button>
              <button
                className={`chair-pill ${statusFilter === 'Active' ? 'active' : ''}`}
                onClick={() => setStatusFilter('Active')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--chair-border)',
                  backgroundColor: statusFilter === 'Active' ? '#0f766e' : 'var(--chair-bg)',
                  color: statusFilter === 'Active' ? '#fff' : 'var(--chair-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <UserCheck size={12} /> Active ({activeCount})
              </button>
              <button
                className={`chair-pill ${statusFilter === 'Deactivated' ? 'active' : ''}`}
                onClick={() => setStatusFilter('Deactivated')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--chair-border)',
                  backgroundColor: statusFilter === 'Deactivated' ? '#b91c1c' : 'var(--chair-bg)',
                  color: statusFilter === 'Deactivated' ? '#fff' : 'var(--chair-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <UserX size={12} /> Deactivated ({deactCount})
              </button>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--chair-border)', textAlign: 'left', color: 'var(--chair-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>User / Identity</th>
                <th style={{ padding: '10px 12px' }}>Role</th>
                <th style={{ padding: '10px 12px' }}>Affiliation / Facility</th>
                <th style={{ padding: '10px 12px' }}>Email Address</th>
                <th style={{ padding: '10px 12px' }}>Account Status</th>
                <th style={{ padding: '10px 12px' }}>Auth Enforcement</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--chair-muted)' }}>
                    No users match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--chair-border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {u.status === 'Deactivated' ? (
                          <UserX size={15} style={{ color: '#dc2626' }} />
                        ) : (
                          <UserCheck size={15} style={{ color: '#16a34a' }} />
                        )}
                        <div>
                          <div>{u.name}</div>
                          {u.deactivationReason && (
                            <small style={{ color: 'var(--chair-muted)', fontSize: '10px', display: 'block' }}>
                              {u.deactivationReason}
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            u.role === 'Doctor' ? '#ccfbf1' :
                            u.role === 'Hospital Admin' ? '#ede9fe' :
                            u.role === 'Family Account' ? '#fef3c7' : '#dbeafe',
                          color:
                            u.role === 'Doctor' ? '#0f766e' :
                            u.role === 'Hospital Admin' ? '#6d28d9' :
                            u.role === 'Family Account' ? '#92400e' : '#1d4ed8',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--chair-muted)' }}>
                      <div>{u.facility}</div>
                      {u.specialty && (
                        <small style={{ fontSize: '11px', color: 'var(--chair-text)' }}>{u.specialty}</small>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: u.status === 'Active' ? '#dcfce7' : '#fee2e2',
                          color: u.status === 'Active' ? '#166534' : '#991b1b',
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          color: u.status === 'Active' ? '#166534' : '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600,
                        }}
                      >
                        <ShieldCheck size={13} />
                        {u.authStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PlatformAnalyticsView;
