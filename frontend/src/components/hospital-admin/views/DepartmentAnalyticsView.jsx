import { useState } from 'react';
import {
  BarChart3,
  Stethoscope,
  Sparkles,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react';

export function DepartmentAnalyticsView({ analytics = {} }) {
  const [search, setSearch] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('ALL');

  const comparison = analytics.departmentComparison || [
    {
      id: 'dept_ortho',
      department: 'Orthopedics',
      code: 'ORTHO',
      headName: 'Dr. Priya Sharma',
      doctors: 3,
      appointments: 48,
      completed: 41,
      cancelled: 2,
      cancellationRate: '4.2%',
      noShowRate: '2.1%',
      aiPredictions: 31,
      completionRate: '85.4%',
      bedCapacity: 60,
      bedOccupancy: '88%',
      avgConsultationMins: 22,
      workloadPct: 65,
      satisfactionRating: '4.9 / 5.0',
    },
    {
      id: 'dept_diab',
      department: 'Diabetology & Endocrinology',
      code: 'DIAB',
      headName: 'Dr. Arun Kumar',
      doctors: 3,
      appointments: 42,
      completed: 35,
      cancelled: 3,
      cancellationRate: '7.1%',
      noShowRate: '2.4%',
      aiPredictions: 29,
      completionRate: '83.3%',
      bedCapacity: 45,
      bedOccupancy: '78%',
      avgConsultationMins: 18,
      workloadPct: 58,
      satisfactionRating: '4.8 / 5.0',
    },
    {
      id: 'dept_cardio',
      department: 'Cardiology & Vascular Sciences',
      code: 'CARDIO',
      headName: 'Dr. Meera Nambiar',
      doctors: 3,
      appointments: 38,
      completed: 28,
      cancelled: 3,
      cancellationRate: '7.9%',
      noShowRate: '2.6%',
      aiPredictions: 31,
      completionRate: '73.7%',
      bedCapacity: 55,
      bedOccupancy: '86%',
      avgConsultationMins: 28,
      workloadPct: 63,
      satisfactionRating: '4.8 / 5.0',
    },
  ];

  const filteredComparison = comparison.filter((dept) => {
    const matchesSearch =
      !search ||
      dept.department.toLowerCase().includes(search.toLowerCase()) ||
      (dept.code && dept.code.toLowerCase().includes(search.toLowerCase())) ||
      (dept.headName && dept.headName.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1>Department Comparative Analytics</h1>
            <p>Neutral operational comparison of department workload, consultation completion, capacity utilization, and AI triaging</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--ha-teal)' }} />
          <span>Aggregate Department Comparison · Zero PHI Access</span>
        </div>
      </div>

      {/* Filter and Metric Focus Bar */}
      <div className="ha-filter-bar" style={{ marginBottom: '20px' }}>
        <div className="ha-search-box" style={{ width: '280px' }}>
          <Search size={15} style={{ color: 'var(--ha-text-muted)' }} />
          <input
            placeholder="Search department, code, head..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ha-filter-pills">
          <button
            className={`ha-filter-pill ${selectedMetric === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('ALL')}
          >
            All Metrics
          </button>
          <button
            className={`ha-filter-pill ${selectedMetric === 'COMPLETION' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('COMPLETION')}
          >
            Completion Rates
          </button>
          <button
            className={`ha-filter-pill ${selectedMetric === 'UTILIZATION' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('UTILIZATION')}
          >
            Bed & Clinic Utilization
          </button>
          <button
            className={`ha-filter-pill ${selectedMetric === 'AI' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('AI')}
          >
            AI Screening
          </button>
        </div>
      </div>

      {/* Comparative Department Cards (Neutral Operational View - No Rankings/Gold) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {filteredComparison.map((dept) => (
          <div key={dept.department} className="ha-card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--ha-soft-bg)',
                    color: 'var(--ha-primary)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '15px', fontWeight: 700 }}>
                    {dept.department}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>
                    {dept.code ? `CODE: ${dept.code} · ` : ''}Head: {dept.headName || 'Assigned Head'}
                  </span>
                </div>
              </div>

              <span className="ha-badge success">
                {dept.completionRate} Completion
              </span>
            </div>

            {/* Metrics 2x2 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', display: 'block' }}>Consultations</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
                  {dept.completed} / {dept.appointments}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--ha-teal)', fontWeight: 600 }}>
                  {dept.doctors} Staff Doctors
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', display: 'block' }}>Bed / Ward Occupancy</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ha-indigo)' }}>
                  {dept.bedOccupancy || `${dept.workloadPct}%`}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--ha-text-muted)' }}>
                  {dept.bedCapacity ? `${dept.bedCapacity} Total Beds` : 'Ward Capacity'}
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', display: 'block' }}>AI Screenings</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ha-primary)' }}>
                  <Sparkles size={14} style={{ display: 'inline', marginRight: '3px' }} />
                  {dept.aiPredictions} Cases
                </div>
                <span style={{ fontSize: '10px', color: 'var(--ha-text-muted)' }}>
                  Avg {dept.avgConsultationMins} mins/visit
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', display: 'block' }}>Patient Rating</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ha-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={15} fill="currentColor" />
                  <span>{dept.satisfactionRating || '4.8 / 5.0'}</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--ha-text-muted)' }}>
                  No-Show Rate: {dept.noShowRate || '2.3%'}
                </span>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--ha-text-muted)' }}>Capacity Utilization Rate</span>
                <strong>{dept.bedOccupancy || `${dept.workloadPct}%`}</strong>
              </div>
              <div className="ha-progress-bar-bg">
                <div
                  className="ha-progress-bar-fill"
                  style={{ width: dept.bedOccupancy ? `${parseInt(dept.bedOccupancy, 10)}%` : `${dept.workloadPct}%` }}
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
            <h3>Departmental Operational Cross-Comparison Matrix</h3>
            <p>Neutral side-by-side operational comparison of staffing, appointment volume, completion benchmarks, and utilization</p>
          </div>
        </div>

        <div className="ha-table-container">
          <table className="ha-table">
            <thead>
              <tr>
                <th>Department & Code</th>
                <th>Department Head</th>
                <th>Staff Doctors</th>
                <th>Total Bookings</th>
                <th>Completed Consultations</th>
                <th>Completion Rate</th>
                <th>Cancellation Rate</th>
                <th>Bed / Clinic Utilization</th>
                <th>Patient Satisfaction</th>
                <th>AI Triaged Volume</th>
              </tr>
            </thead>
            <tbody>
              {filteredComparison.map((dept) => (
                <tr key={dept.department}>
                  <td>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--ha-text-primary)' }}>
                        {dept.department}
                      </strong>
                      {dept.code && (
                        <span style={{ fontSize: '11px', color: 'var(--ha-primary)', fontWeight: 700 }}>
                          CODE: {dept.code}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{dept.headName || 'Dr. Assigned'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--ha-text-secondary)' }}>{dept.doctors} Doctors</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13px' }}>{dept.appointments}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ha-teal)' }}>{dept.completed}</span>
                  </td>
                  <td>
                    <span className="ha-badge success" style={{ fontSize: '11px' }}>
                      {dept.completionRate}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--ha-text-muted)' }}>
                      {dept.cancellationRate || '5.2%'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ha-indigo)' }}>
                      {dept.bedOccupancy || `${dept.workloadPct}%`}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ha-warning)' }}>
                      {dept.satisfactionRating || '4.8 / 5.0'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--ha-primary)' }}>
                      {dept.aiPredictions} Cases
                    </span>
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
