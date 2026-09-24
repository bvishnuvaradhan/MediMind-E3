// MediMind Platform - Audit Logs (Chairman / Platform Owner)
// Section 18 of PLATFORM OWNER.txt: Platform security, microservice accountability, and administrative action audit trails

import { useState, useEffect } from 'react';
import {
  Search,
  Activity,
  Clock,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [serviceFilter, setServiceFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const data = await chairmanService.getAuditLogs({
        service: serviceFilter,
        role: roleFilter,
        search,
      });
      setLogs(data);
    }
    load();
  }, [serviceFilter, roleFilter, search]);

  return (
    <div className="audit-logs-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <Activity size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Security & Compliance
            </p>
            <h1>Platform Audit Logs</h1>
            <p>Immutable audit trails tracking administrative, organizational, and microservice events across the MediMind platform.</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--chair-border)',
              background: 'var(--chair-card)',
              color: 'var(--chair-ink)',
              fontSize: '12px',
            }}
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="All">All Microservices</option>
            <option value="api-gateway">api-gateway</option>
            <option value="auth-service">auth-service</option>
            <option value="hospital-service">hospital-service</option>
            <option value="family-service">family-service</option>
            <option value="platform-service">platform-service</option>
            <option value="knowledge-service">knowledge-service</option>
          </select>

          <select
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--chair-border)',
              background: 'var(--chair-card)',
              color: 'var(--chair-ink)',
              fontSize: '12px',
            }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Initiating Roles</option>
            <option value="CHAIRMAN">Chairman</option>
            <option value="HOSPITAL_ADMIN">Hospital Admin</option>
            <option value="DEPARTMENT_HEAD">Department Head</option>
            <option value="FAMILY">Family Account</option>
            <option value="SYSTEM">System Automations</option>
          </select>
        </div>

        <div className="chairman-search">
          <Search size={15} />
          <input
            placeholder="Search action or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor & Initiating Role</th>
                <th>Action Performed</th>
                <th>Affected Platform Entity</th>
                <th>Microservice Origin</th>
                <th>IP Origin</th>
                <th>Event Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--chair-muted)' }}>
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Clock size={13} color="var(--chair-muted)" />
                        <span>{log.timestamp}</span>
                      </div>
                      <small style={{ color: 'var(--chair-muted)', fontFamily: 'monospace' }}>{log.id}</small>
                    </td>
                    <td>
                      <strong>{log.actor}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>Role: {log.role}</div>
                    </td>
                    <td>
                      <strong>{log.action}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--chair-muted)' }}>{log.affectedEntity}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          padding: '2px 6px',
                          background: 'var(--chair-bg)',
                          borderRadius: '4px',
                          border: '1px solid var(--chair-border)',
                        }}
                      >
                        {log.service}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.ip}</td>
                    <td>
                      <span
                        className={`badge ${
                          log.status === 'Success'
                            ? 'badge-active'
                            : log.status === 'Security'
                            ? 'badge-pending'
                            : 'badge-info'
                        }`}
                      >
                        {log.status}
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
