import React from 'react';
import StatCard from '../components/StatCard';

export function DepartmentAnalyticsView({ analytics, departmentInfo }) {
  const weeklyTrends = analytics?.weeklyConsultationVolume || [
    { day: 'Mon', count: 12, target: 15 },
    { day: 'Tue', count: 14, target: 15 },
    { day: 'Wed', count: 16, target: 15 },
    { day: 'Thu', count: 11, target: 15 },
    { day: 'Fri', count: 18, target: 15 },
    { day: 'Sat', count: 9, target: 10 },
  ];

  const maxVolume = Math.max(...weeklyTrends.map((t) => t.count), 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              Orthopedics Operational & Clinical Analytics
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              Outpatient volume patterns, inpatient bed occupancy, and department throughput metrics
            </p>
          </div>
          <span className="dh-badge dh-badge-completed">Current Cycle: Oct 2026</span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="dh-stat-grid">
        <StatCard
          label="Monthly Consultations"
          value={departmentInfo?.totalMonthlyAppointments || 48}
          tone="indigo"
          change="+8.4% vs last month"
          changeType="positive"
          subtext="OPD & Follow-ups"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="Completed Consultations"
          value={departmentInfo?.completedConsultations || 41}
          tone="teal"
          change="85.4% completion"
          changeType="positive"
          subtext="Processed cases"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="Avg Consultation Duration"
          value={analytics?.avgConsultationTime || '16 min'}
          tone="blue"
          change="-2 min vs benchmark"
          changeType="positive"
          subtext="Per patient encounter"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Ward Bed Occupancy"
          value={departmentInfo?.bedOccupancy || '88%'}
          tone="coral"
          change="53 / 60 beds"
          changeType="neutral"
          subtext="Orthopedic surgical ward"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Two Column Layout: Weekly Volume and Case Types */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Weekly Consultation Volume Chart */}
        <div className="dh-card">
          <div className="dh-card-header">
            <div>
              <h3 className="dh-card-title">Weekly Consultation Volume</h3>
              <div className="dh-card-description">Daily patient encounters vs planned capacity</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
            {weeklyTrends.map((t) => {
              const pct = Math.round((t.count / maxVolume) * 100);
              return (
                <div key={t.day} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '40px', fontSize: '12.5px', fontWeight: 700, color: 'var(--dh-text-secondary)' }}>
                    {t.day}
                  </span>
                  <div style={{ flex: 1, backgroundColor: 'var(--dh-border)', height: '22px', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: 'var(--dh-primary-light)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '8px',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {t.count}
                    </div>
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)', width: '60px', textAlign: 'right' }}>
                    Quota: {t.target}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orthopedic Case Subspecialty Distribution */}
        <div className="dh-card">
          <div className="dh-card-header">
            <div>
              <h3 className="dh-card-title">Orthopedic Subspecialty Mix</h3>
              <div className="dh-card-description">Distribution of clinical cases this month</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { sub: 'Trauma & Acute Fractures', pct: 42, count: '20 cases', color: 'var(--dh-coral)' },
              { sub: 'Joint Arthroplasty (Knee/Hip)', pct: 34, count: '16 cases', color: 'var(--dh-blue)' },
              { sub: 'Sports Medicine & Arthroscopy', pct: 14, count: '7 cases', color: 'var(--dh-teal)' },
              { sub: 'Pediatric Musculoskeletal', pct: 10, count: '5 cases', color: 'var(--dh-primary-light)' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--dh-text-primary)' }}>{item.sub}</span>
                  <span style={{ fontWeight: 700, color: 'var(--dh-text-muted)' }}>{item.count} ({item.pct}%)</span>
                </div>
                <div className="dh-progress-container" style={{ height: '8px' }}>
                  <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentAnalyticsView;
