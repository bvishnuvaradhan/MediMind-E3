// MediMind Platform - Platform Appointments (Chairman / Platform Owner)
// Section 12 of PLATFORM OWNER.txt: Aggregate operational appointment monitoring and ledger

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function AppointmentsView() {
  const [appointments, setAppointments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const data = await chairmanService.getAppointmentsLedger({
        department: departmentFilter,
        status: statusFilter,
        search,
      });
      setAppointments(data);
    }
    load();
  }, [departmentFilter, statusFilter, search]);

  return (
    <div className="appointments-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <CalendarDays size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Operational Scheduling
            </p>
            <h1>Platform Appointments Overview</h1>
            <p>Comprehensive aggregate ledger and scheduling statistics across member hospitals and clinical departments.</p>
          </div>
        </div>
      </div>

      {/* Aggregate Department Breakdown Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <p>Total Platform Appointments</p>
          <h3 style={{ marginTop: '8px' }}>128</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Across all 3 departments</small>
        </div>
        <div className="stat-card">
          <p>🦴 Orthopedics Volume</p>
          <h3 style={{ marginTop: '8px' }}>48</h3>
          <small style={{ color: 'var(--chair-muted)' }}>37.5% of total visits</small>
        </div>
        <div className="stat-card">
          <p>🩺 Diabetology Volume</p>
          <h3 style={{ marginTop: '8px' }}>42</h3>
          <small style={{ color: 'var(--chair-muted)' }}>32.8% of total visits</small>
        </div>
        <div className="stat-card">
          <p>❤️ Cardiology Volume</p>
          <h3 style={{ marginTop: '8px' }}>38</h3>
          <small style={{ color: 'var(--chair-muted)' }}>29.7% of total visits</small>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-pills">
          <button
            className={`filter-pill ${departmentFilter === 'All' ? 'active' : ''}`}
            onClick={() => setDepartmentFilter('All')}
          >
            All Departments
          </button>
          <button
            className={`filter-pill ${departmentFilter === 'Orthopedics' ? 'active' : ''}`}
            onClick={() => setDepartmentFilter('Orthopedics')}
          >
            Orthopedics
          </button>
          <button
            className={`filter-pill ${departmentFilter === 'Diabetology' ? 'active' : ''}`}
            onClick={() => setDepartmentFilter('Diabetology')}
          >
            Diabetology
          </button>
          <button
            className={`filter-pill ${departmentFilter === 'Cardiology' ? 'active' : ''}`}
            onClick={() => setDepartmentFilter('Cardiology')}
          >
            Cardiology
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <div className="chairman-search">
            <Search size={15} />
            <input
              placeholder="Search doctor or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Appointment Operational Ledger */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Hospital Facility</th>
                <th>Department</th>
                <th>Doctor</th>
                <th>Scheduled Date & Slot</th>
                <th>Consultation Mode</th>
                <th>Visit Nature</th>
                <th>Operational Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--chair-muted)' }}>
                    No appointments found matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--chair-sapphire)' }}>{apt.id}</strong>
                    </td>
                    <td>{apt.hospital}</td>
                    <td>
                      <span className="badge badge-info">{apt.department}</span>
                    </td>
                    <td>
                      <strong>{apt.doctor}</strong>
                    </td>
                    <td>
                      <div>{apt.date}</div>
                      <small style={{ color: 'var(--chair-muted)' }}>{apt.slot}</small>
                    </td>
                    <td>{apt.mode}</td>
                    <td>{apt.type}</td>
                    <td>
                      <span className={`badge badge-${apt.status.toLowerCase()}`}>{apt.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="privacy-banner" style={{ marginTop: '24px' }}>
        <ShieldCheck size={18} />
        <div>
          <strong>Operational Schedule Ledger</strong>
          <p style={{ margin: '2px 0 0' }}>
            The Chairman monitors institutional capacity, appointment completion rates, and doctor workloads. Patient medical concerns and private clinical notes are kept strictly confidential.
          </p>
        </div>
      </div>
    </div>
  );
}
