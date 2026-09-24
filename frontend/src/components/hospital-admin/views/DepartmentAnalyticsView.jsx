import {
  BarChart3,
  Stethoscope,
  Activity,
  Sparkles,
} from 'lucide-react';

export function DepartmentAnalyticsView({ analytics }) {
  const comparison = analytics.departmentComparison || [];

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1>Department Comparative Analytics</h1>
            <p>Benchmarking operational throughput, doctor caseload distribution, and AI screening volume across hospital departments</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <Activity size={16} style={{ color: 'var(--ha-primary)' }} />
          <span>3 Active Clinical Departments Compared</span>
        </div>
      </div>

      {/* Comparative Department Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {comparison.map((dept) => (
          <div key={dept.department} className="ha-card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Stethoscope size={20} style={{ color: 'var(--ha-primary)' }} />
                <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '16px', fontWeight: 700 }}>
                  {dept.department}
                </h3>
              </div>
              <span className="ha-badge success">
                {dept.completionRate} Rate
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', display: 'block' }}>Appointments</span>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{dept.appointments} Total</div>
                <span style={{ fontSize: '10px', color: 'var(--ha-teal)' }}>{dept.completed} Resolved</span>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', display: 'block' }}>AI Screenings</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ha-primary)' }}>
                  <Sparkles size={14} style={{ display: 'inline', marginRight: '3px' }} />
                  {dept.aiPredictions} Inferences
                </div>
                <span style={{ fontSize: '10px', color: 'var(--ha-text-muted)' }}>Avg {dept.avgConsultationMins} mins/visit</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--ha-text-muted)' }}>Clinical Capacity Workload</span>
                <strong>{dept.workloadPct}%</strong>
              </div>
              <div className="ha-progress-bar-bg">
                <div
                  className="ha-progress-bar-fill"
                  style={{ width: `${dept.workloadPct}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparative Department Table */}
      <div className="ha-card-panel">
        <div className="ha-card-panel-header">
          <div>
            <h3>Departmental Cross-Comparison Matrix</h3>
            <p>Side-by-side assessment of clinical staff, patient volume, resolution rate, and AI integration</p>
          </div>
        </div>

        <div className="ha-table-container">
          <table className="ha-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Doctors</th>
                <th>Monthly Appts</th>
                <th>Completed Consultations</th>
                <th>Resolution Rate</th>
                <th>AI Predictions</th>
                <th>Avg Consultation Duration</th>
                <th>Staff Workload</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((dept) => (
                <tr key={dept.department}>
                  <td>
                    <strong style={{ fontSize: '13px' }}>{dept.department}</strong>
                  </td>
                  <td>{dept.doctors} Staff Doctors</td>
                  <td>
                    <strong style={{ color: 'var(--ha-primary)' }}>{dept.appointments}</strong>
                  </td>
                  <td>{dept.completed}</td>
                  <td>
                    <span className="ha-badge success">{dept.completionRate}</span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--ha-indigo)' }}>
                      <Sparkles size={13} /> {dept.aiPredictions}
                    </span>
                  </td>
                  <td>{dept.avgConsultationMins} mins</td>
                  <td>
                    <div style={{ width: '100px' }}>
                      <div className="ha-progress-bar-bg">
                        <div className="ha-progress-bar-fill" style={{ width: `${dept.workloadPct}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

