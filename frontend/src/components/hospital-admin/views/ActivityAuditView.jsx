import { useState } from 'react';
import {
  FileCode,
  Search,
  CheckCircle2,
  Clock,
  User,
  Building2,
  ShieldCheck,
} from 'lucide-react';

export function ActivityAuditView({ auditLogs, departments }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesDept = deptFilter === 'ALL' || log.department === deptFilter;
    const matchesSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.department.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <FileCode size={24} />
          </div>
          <div>
            <h1>Hospital Administrative Activity & Audit Trail</h1>
            <p>Immutable audit trail tracking administrative actions, staffing modifications, and configuration changes within MediMind Central Hospital</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--ha-teal)' }} />
          <span>HIPAA Audit Compliant & Tamper-Evident</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ha-filter-bar">
        <div className="ha-search-box" style={{ width: '300px' }}>
          <Search size={15} style={{ color: 'var(--ha-text-muted)' }} />
          <input
            placeholder="Search audit logs by actor, action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ha-filter-pills">
          <button
            className={`ha-filter-pill ${deptFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setDeptFilter('ALL')}
          >
            All Departments ({auditLogs.length})
          </button>
          <button
            className={`ha-filter-pill ${deptFilter === 'Hospital Administration' ? 'active' : ''}`}
            onClick={() => setDeptFilter('Hospital Administration')}
          >
            Hospital Administration
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              className={`ha-filter-pill ${deptFilter === d.name ? 'active' : ''}`}
              onClick={() => setDeptFilter(d.name)}
            >
              {d.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="ha-table-container">
        <table className="ha-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Administrative Actor</th>
              <th>Action Executed</th>
              <th>Department / Unit</th>
              <th>Client IP</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ha-text-muted)' }}>
                    <Clock size={13} />
                    <span>{log.timestamp}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} style={{ color: 'var(--ha-primary)' }} />
                    <strong style={{ fontSize: '12px' }}>{log.actor}</strong>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: 'var(--ha-text-primary)' }}>{log.action}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ha-text-secondary)' }}>
                    <Building2 size={13} />
                    <span>{log.department}</span>
                  </div>
                </td>
                <td>
                  <code style={{ fontSize: '11px', backgroundColor: 'var(--ha-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                    {log.ipAddress}
                  </code>
                </td>
                <td>
                  <span className="ha-badge success">
                    <CheckCircle2 size={11} /> {log.status}
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

