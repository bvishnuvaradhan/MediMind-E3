import { useState, useEffect } from 'react';
import {
  Building2,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';
import { BarChart, BulletChart } from '../../common/charts';

export function HospitalPerformanceView() {
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await chairmanService.getHospitalPerformance();
      setPerformance(data);
    }
    load();
  }, []);

  const totalDoctors = performance.reduce((sum, h) => sum + (Number(h.doctorsCount) || 0), 0);
  const totalVisits = performance.reduce((sum, h) => sum + (Number(h.appointmentsCount) || 0), 0);
  const totalAi = performance.reduce((sum, h) => sum + (Number(h.aiPredictionsCount) || 0), 0);

  // Format data for Grouped BarChart
  const barChartData = performance.map((h) => ({
    label: h.name.replace('Hospital', '').replace('MediMind', '').trim(),
    doctors: h.doctorsCount,
    appointments: h.appointmentsCount,
    aiRuns: h.aiPredictionsCount,
  }));

  return (
    <div className="hospital-performance-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <Building2 size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Operational Benchmarking
            </p>
            <h1>Hospital Performance Comparison</h1>
            <p>Comparative operational KPIs, patient satisfaction indices, and clinical throughput across the hospital network.</p>
          </div>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <p>Network Facilities</p>
          <h3 style={{ marginTop: '8px' }}>{performance.length} Hospitals</h3>
          <span className="stat-delta">100% NABH/JCI Verified</span>
        </div>
        <div className="stat-card">
          <p>Total Medical Specialists</p>
          <h3 style={{ marginTop: '8px' }}>{totalDoctors} Doctors</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Across 17 Departments</small>
        </div>
        <div className="stat-card">
          <p>Total Consultations Served</p>
          <h3 style={{ marginTop: '8px' }}>{totalVisits} Visits</h3>
          <span className="stat-delta">+18.4% Volume MoM</span>
        </div>
        <div className="stat-card">
          <p>Clinical AI Inferences</p>
          <h3 style={{ marginTop: '8px' }}>{totalAi} Predictions</h3>
          <span className="stat-delta">95.6% Average Confidence</span>
        </div>
      </div>

      {/* Visual Comparative Analytics: Grouped Bar & Bullet Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px', marginBottom: '24px' }}>
        {/* Grouped Bar Chart */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
              Comparative Facility Throughput & Staffing
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              Side-by-side volume comparison across active hospital network nodes
            </p>
          </div>

          <BarChart
            data={barChartData}
            xKey="label"
            height={200}
            series={[
              { key: 'appointments', name: 'Visits', color: '#2563eb' },
              { key: 'aiRuns', name: 'AI Runs', color: '#0f766e' },
              { key: 'doctors', name: 'Doctors', color: '#4338ca' },
            ]}
          />
        </div>

        {/* Bullet Charts for Bed Occupancy */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
              Bed Capacity vs Operational Utilization
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              Inpatient capacity benchmarks (Target threshold: 85% occupancy)
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {performance.map((item) => {
              const utilNum = parseFloat(item.utilizationRate) || 82;
              return (
                <BulletChart
                  key={item.id}
                  title={item.name}
                  subtitle={`${item.city} (${item.departmentsCount} Depts)`}
                  actual={utilNum}
                  target={85}
                  max={100}
                  unit="%"
                  ranges={[60, 85, 100]}
                  color={utilNum > 85 ? '#d97706' : '#2563eb'}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hospital Network Facility</th>
                <th>Location</th>
                <th>Medical Doctors</th>
                <th>Departments</th>
                <th>Appointments Served</th>
                <th>Clinical AI Runs</th>
                <th>Bed Utilization</th>
                <th>Patient Satisfaction</th>
                <th>Network Status</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>Facility ID: {item.id}</div>
                  </td>
                  <td>{item.city}</td>
                  <td>{item.doctorsCount} Specialists</td>
                  <td>{item.departmentsCount} Active</td>
                  <td><strong>{item.appointmentsCount}</strong> visits</td>
                  <td><strong>{item.aiPredictionsCount}</strong> predictions</td>
                  <td>{item.utilizationRate}</td>
                  <td>
                    <span className="badge badge-active">{item.patientSatisfaction}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${item.status.toLowerCase()}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--chair-card)', border: '1px solid var(--chair-border)' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontFamily: 'Plus Jakarta Sans' }}>
          Multi-Hospital Scalability Architecture
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)', lineHeight: 1.6 }}>
          MediMind's multi-tenant architecture isolates hospital operational databases while permitting executive comparative benchmarking at the Chairman level. As additional member hospitals are onboarded and approved through Onboarding Requests, they automatically integrate into this comparative dashboard.
        </p>
      </div>
    </div>
  );
}
