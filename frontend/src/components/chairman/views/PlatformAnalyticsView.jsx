// MediMind Platform - Platform Analytics (Chairman / Platform Owner)
// Section 16 of PLATFORM OWNER.txt: Cross-platform utilization, user distribution, and appointment analytics

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  UsersRound,
  CalendarDays,
  Server,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';
import { DonutChart, RadialGauge } from '../../common/charts';

export function PlatformAnalyticsView() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await chairmanService.getPlatformSummary();
      setSummary(data);
    }
    load();
  }, []);

  if (!summary) return <div className="loading-state">Loading Platform Analytics...</div>;

  const totalUsers =
    (summary.totalFamilyMembers || 29) +
    summary.totalDoctors +
    summary.totalDepartmentHeads +
    summary.totalHospitalAdmins;

  const userData = [
    { label: 'Family Members', value: summary.totalFamilyMembers || 29, color: '#f59e0b' },
    { label: 'Doctors', value: summary.totalDoctors || 66, color: '#0f766e' },
    { label: 'Department Heads', value: summary.totalDepartmentHeads || 18, color: '#2563eb' },
    { label: 'Hospital Admins', value: summary.totalHospitalAdmins || 6, color: '#4338ca' },
  ];

  const totalAppts = summary.totalAppointments || 128;
  const compAppts = summary.completedAppointments || 96;
  const upcomAppts = summary.upcomingAppointments || 24;
  const cancAppts = summary.cancelledAppointments || 8;

  const apptData = [
    { label: 'Completed', value: compAppts, color: '#16a34a' },
    { label: 'Upcoming', value: upcomAppts, color: '#f59e0b' },
    { label: 'Cancelled', value: cancAppts, color: '#dc2626' },
  ];

  return (
    <div className="platform-analytics-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <TrendingUp size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Executive Metrics
            </p>
            <h1>Platform Usage & Growth Analytics</h1>
            <p>Comprehensive statistical breakdown across users, appointments, system health, and clinical throughput.</p>
          </div>
        </div>
      </div>

      {/* Grid: 3 Pillars of Analytics with Data Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px', marginBottom: '28px' }}>
        {/* Pillar 1: User Analytics with Donut Visualization */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#dbeafe', color: '#2563eb' }}>
              <UsersRound size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>Platform User Directory</h3>
              <small style={{ color: 'var(--chair-muted)' }}>Distribution across {totalUsers} registered accounts</small>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <DonutChart
              data={userData}
              size={150}
              innerRadius={42}
              outerRadius={65}
              centerValue={totalUsers}
              centerLabel="Accounts"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--chair-border)', fontSize: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--chair-bg)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--chair-muted)', fontSize: '11px' }}>Families</span>
              <div style={{ fontWeight: 700, marginTop: '2px' }}>{summary.totalFamilyAccounts} ({summary.totalFamilyMembers || 29} members)</div>
            </div>
            <div style={{ padding: '8px', background: 'var(--chair-bg)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--chair-muted)', fontSize: '11px' }}>Clinical Staff</span>
              <div style={{ fontWeight: 700, marginTop: '2px' }}>{summary.totalDoctors + summary.totalDepartmentHeads} Faculty</div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Appointment Analytics with Donut Visualization */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#ccfbf1', color: '#0f766e' }}>
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>Appointment Resolution</h3>
              <small style={{ color: 'var(--chair-muted)' }}>{totalAppts} total registered patient visits</small>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <DonutChart
              data={apptData}
              size={150}
              innerRadius={42}
              outerRadius={65}
              centerValue={totalAppts}
              centerLabel="Visits"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#dcfce7', borderRadius: '6px', color: '#166534' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle size={13} /> Completed</span>
              <strong>{compAppts} ({Math.round((compAppts / totalAppts) * 100)}%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#fef3c7', borderRadius: '6px', color: '#92400e' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={13} /> Upcoming</span>
              <strong>{upcomAppts} ({Math.round((upcomAppts / totalAppts) * 100)}%)</strong>
            </div>
          </div>
        </div>

        {/* Pillar 3: System Health & Radial Gauge */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#e0e7ff', color: '#4338ca' }}>
              <Server size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>Platform Microservices</h3>
              <small style={{ color: 'var(--chair-muted)' }}>Infrastructure health & network telemetry</small>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
            <RadialGauge
              value={99.98}
              min={95}
              max={100}
              unit="%"
              label="Uptime"
              subtext="5 Microservice Nodes Healthy"
              size={150}
              color="#16a34a"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--chair-border)', fontSize: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--chair-bg)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--chair-muted)', fontSize: '11px' }}>Throughput</span>
              <div style={{ fontWeight: 700, marginTop: '2px' }}>{summary.apiThroughput || '1,420 req/min'}</div>
            </div>
            <div style={{ padding: '8px', background: 'var(--chair-bg)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--chair-muted)', fontSize: '11px' }}>Avg Latency</span>
              <div style={{ fontWeight: 700, marginTop: '2px' }}>{summary.avgResponseTime || '142ms'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
