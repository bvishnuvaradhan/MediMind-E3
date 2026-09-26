import React from 'react';
import StatCard from '../components/StatCard';
import { BarChart, DonutChart, HeatmapChart } from '../../common/charts';

export function DepartmentAnalyticsView({ analytics, departmentInfo }) {
  const weeklyTrends = analytics?.weeklyConsultationVolume || [
    { day: 'Mon', count: 12, target: 15 },
    { day: 'Tue', count: 14, target: 15 },
    { day: 'Wed', count: 16, target: 15 },
    { day: 'Thu', count: 11, target: 15 },
    { day: 'Fri', count: 18, target: 15 },
    { day: 'Sat', count: 9, target: 10 },
  ];

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

      {/* Two Column Layout: Weekly Volume BarChart and Subspecialty DonutChart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Weekly Consultation Volume Grouped Bar Chart */}
        <div className="dh-card">
          <div className="dh-card-header">
            <div>
              <h3 className="dh-card-title">Weekly Consultation Encounters vs Target</h3>
              <div className="dh-card-description">Daily orthopedic clinic volume compared against planned quota</div>
            </div>
          </div>

          <BarChart
            data={weeklyTrends.map((t) => ({
              label: t.day,
              actual: t.count,
              target: t.target,
            }))}
            xKey="label"
            height={200}
            yAxisLabel="Encounters"
            series={[
              { key: 'actual', name: 'Actual Encounters', color: '#2563eb' },
              { key: 'target', name: 'Capacity Target', color: '#93c5fd' },
            ]}
          />
        </div>

        {/* Orthopedic Case Subspecialty Distribution Donut Chart */}
        <div className="dh-card">
          <div className="dh-card-header">
            <div>
              <h3 className="dh-card-title">Orthopedic Subspecialty Case Distribution</h3>
              <div className="dh-card-description">Breakdown of clinical procedures and diagnoses this cycle</div>
            </div>
          </div>

          <DonutChart
            data={[
              { label: 'Trauma & Acute Fractures', value: 20, color: '#f43f5e' },
              { label: 'Joint Arthroplasty (Knee/Hip)', value: 16, color: '#2563eb' },
              { label: 'Sports Medicine & Arthroscopy', value: 7, color: '#0f766e' },
              { label: 'Pediatric Musculoskeletal', value: 5, color: '#7c3aed' },
            ]}
            size={160}
            innerRadius={45}
            outerRadius={70}
            centerValue="48"
            centerLabel="Total Cases"
          />
        </div>
      </div>

      {/* Department Shift Activity Heatmap */}
      <div className="dh-card">
        <div className="dh-card-header">
          <div>
            <h3 className="dh-card-title">Orthopedic Clinic Hourly Shift Activity Heatmap</h3>
            <div className="dh-card-description">Consultation intake density across clinical hours and weekdays</div>
          </div>
        </div>

        <HeatmapChart
          xLabels={['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM']}
          yLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
          matrix={[
            [4, 5, 2, 4, 1], // Mon
            [5, 6, 3, 4, 2], // Tue
            [4, 5, 2, 5, 2], // Wed
            [3, 4, 2, 4, 1], // Thu
            [5, 7, 3, 4, 2], // Fri
            [3, 4, 2, 0, 0], // Sat
          ]}
          color="#2563eb"
          height={180}
        />
      </div>
    </div>
  );
}

export default DepartmentAnalyticsView;
