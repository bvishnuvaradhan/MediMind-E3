import React, { useState } from 'react';

export function DoctorPerformanceView({
  performanceData = [],
  doctors = [],
}) {
  const [sortBy, setSortBy] = useState('rating');

  const combinedData = doctors.map((doc) => {
    const perf = performanceData.find((p) => p.doctorId === doc.id) || {};
    const rawOnTime = perf.onTimeRate ?? doc.onTimeRate ?? 95;
    const numOnTime = typeof rawOnTime === 'string' ? parseFloat(rawOnTime.replace(/%/g, '')) : Number(rawOnTime);

    return {
      ...doc,
      consultations: perf.consultationsCompleted || doc.consultationsCompleted || 0,
      ratingScore: perf.patientSatisfaction || doc.rating || 5.0,
      onTimeRate: isNaN(numOnTime) ? 95 : numOnTime,
      avgTime: perf.avgConsultationTime || '15 min',
    };
  });

  const sortedData = [...combinedData].sort((a, b) => {
    if (sortBy === 'rating') return (b.ratingScore || 0) - (a.ratingScore || 0);
    if (sortBy === 'consultations') return (b.consultations || 0) - (a.consultations || 0);
    if (sortBy === 'onTime') return (b.onTimeRate || 0) - (a.onTimeRate || 0);
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              Faculty Clinical Performance & Peer Benchmarking
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              Department-level quality KPIs, patient satisfaction scores, and consultation timeliness
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--dh-text-muted)', fontWeight: 600 }}>Sort by:</span>
            <select
              className="dh-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rating">Patient Satisfaction (★)</option>
              <option value="consultations">Consultations Volume</option>
              <option value="onTime">On-Time Rate (%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 Ranking Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {sortedData.map((doc, idx) => (
          <div key={doc.id} className="dh-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: idx === 0 ? '4px solid var(--dh-warning)' : '1px solid var(--dh-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="dh-badge dh-badge-completed" style={{ fontSize: '11px', fontWeight: 700 }}>
                Rank #{idx + 1}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--dh-warning)', fontSize: '14px' }}>
                <span>★</span> {doc.ratingScore}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="dh-avatar-circle" style={{ width: '36px', height: '36px', fontSize: '12px' }}>
                {doc.avatarInitials}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--dh-text-primary)' }}>
                  {doc.name}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>
                  {doc.specialization}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '8px', backgroundColor: 'var(--dh-bg)', borderRadius: '6px', fontSize: '12px' }}>
              <div>
                <div style={{ color: 'var(--dh-text-muted)' }}>Consultations</div>
                <div style={{ fontWeight: 700, color: 'var(--dh-text-primary)', marginTop: '2px' }}>{doc.consultations} cases</div>
              </div>
              <div>
                <div style={{ color: 'var(--dh-text-muted)' }}>On-Time Rate</div>
                <div style={{ fontWeight: 700, color: 'var(--dh-success)', marginTop: '2px' }}>{doc.onTimeRate}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Benchmarking Table */}
      <div className="dh-card">
        <div className="dh-table-container">
          <table className="dh-table">
            <thead>
              <tr>
                <th>Faculty Doctor</th>
                <th>Specialization</th>
                <th>Consultations Handled</th>
                <th>Patient Satisfaction</th>
                <th>On-Time Start Rate</th>
                <th>Avg Encounter Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((doc, idx) => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--dh-text-muted)', width: '18px' }}>#{idx + 1}</span>
                      <div className="dh-avatar-circle" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                        {doc.avatarInitials}
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--dh-text-primary)' }}>{doc.name}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--dh-text-secondary)', fontWeight: 500 }}>{doc.specialization}</td>
                  <td style={{ fontWeight: 700 }}>{doc.consultations} completed</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--dh-warning)' }}>
                      <span>★</span> {doc.ratingScore} / 5.0
                    </div>
                  </td>
                  <td>
                    <span className="dh-badge dh-badge-active">{doc.onTimeRate}%</span>
                  </td>
                  <td style={{ color: 'var(--dh-text-secondary)' }}>{doc.avgTime}</td>
                  <td>
                    <span className={`dh-badge dh-badge-${doc.status.toLowerCase().replace(' ', '-')}`}>
                      {doc.status}
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

export default DoctorPerformanceView;
