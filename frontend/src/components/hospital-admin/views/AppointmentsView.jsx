import { useState } from 'react';
import {
  Calendar,
  Search,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export function AppointmentsView({ appointments, departments }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');

  const filteredAppointments = appointments.filter((apt) => {
    const matchesDept = deptFilter === 'ALL' || apt.departmentId === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    const matchesDate = dateFilter === 'ALL' || apt.date === dateFilter;
    const matchesSearch =
      !search ||
      apt.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      apt.department.toLowerCase().includes(search.toLowerCase()) ||
      apt.patientRef.toLowerCase().includes(search.toLowerCase()) ||
      apt.type.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesStatus && matchesDate && matchesSearch;
  });

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <Calendar size={24} />
          </div>
          <div>
            <h1>Hospital Appointments & Operational Flow</h1>
            <p>Hospital-wide operational appointment scheduling, consultation rooms, and intake volume monitoring</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <ShieldAlert size={16} style={{ color: 'var(--ha-primary)' }} />
          <span>Clinical charts & consultation notes restricted to treating Doctors</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ha-filter-bar">
        <div className="ha-search-box" style={{ width: '260px' }}>
          <Search size={15} style={{ color: 'var(--ha-text-muted)' }} />
          <input
            placeholder="Search doctor, department, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ha-filter-pills">
          <button
            className={`ha-filter-pill ${deptFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setDeptFilter('ALL')}
          >
            All Depts ({appointments.length})
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              className={`ha-filter-pill ${deptFilter === d.id ? 'active' : ''}`}
              onClick={() => setDeptFilter(d.id)}
            >
              {d.name.split(' ')[0]} ({appointments.filter((a) => a.departmentId === d.id).length})
            </button>
          ))}
        </div>

        <select
          className="ha-select"
          style={{ width: 'auto', minWidth: '140px', padding: '6px 12px', fontSize: '12px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In-Progress">In-Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          className="ha-select"
          style={{ width: 'auto', minWidth: '140px', padding: '6px 12px', fontSize: '12px' }}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="ALL">All Dates</option>
          <option value="2026-09-24">Today (24 Sep)</option>
          <option value="2026-09-25">Tomorrow (25 Sep)</option>
        </select>
      </div>

      {/* Appointments Table */}
      <div className="ha-table-container">
        <table className="ha-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Department</th>
              <th>Assigned Doctor</th>
              <th>Patient Reference</th>
              <th>Intake Purpose</th>
              <th>Mode / Location</th>
              <th>AI Triaged</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map((apt) => (
              <tr key={apt.id}>
                <td>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>{apt.time}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>{apt.date}</span>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{apt.department}</span>
                </td>
                <td>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ha-primary)' }}>{apt.doctorName}</span>
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: 'var(--ha-text-secondary)' }}>{apt.patientRef}</span>
                </td>
                <td>
                  <span style={{ fontSize: '12px' }}>{apt.type}</span>
                </td>
                <td>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 500, display: 'block' }}>{apt.mode}</span>
                    <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>{apt.room}</span>
                  </div>
                </td>
                <td>
                  {apt.aiTriaged ? (
                    <span className="ha-badge info" style={{ fontSize: '10px' }}>
                      <Sparkles size={11} /> Triaged
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>Standard</span>
                  )}
                </td>
                <td>
                  <span className={`ha-badge ${apt.status.toLowerCase().replace(' ', '-')}`}>
                    {apt.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

