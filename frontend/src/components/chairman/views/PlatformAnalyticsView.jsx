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
  XCircle,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

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

      {/* Grid: 4 Pillars of Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px', marginBottom: '28px' }}>
        {/* Pillar 1: User Analytics */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#dbeafe', color: '#2563eb' }}>
              <UsersRound size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>Platform User Directory</h3>
              <small style={{ color: 'var(--chair-muted)' }}>Registered accounts across all 5 roles</small>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--chair-bg)', borderRadius: '8px', fontSize: '13px' }}>
              <span>Family Accounts:</span>
              <strong>{summary.totalFamilyAccounts} (13 Covered Members)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--chair-bg)', borderRadius: '8px', fontSize: '13px' }}>
              <span>Clinical Doctors:</span>
              <strong>{summary.totalDoctors} Specialists</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--chair-bg)', borderRadius: '8px', fontSize: '13px' }}>
              <span>Department Heads:</span>
              <strong>{summary.totalDepartmentHeads} Appointed</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--chair-bg)', borderRadius: '8px', fontSize: '13px' }}>
              <span>Hospital Administrators:</span>
              <strong>{summary.totalHospitalAdmins} Active</strong>
            </div>
          </div>
        </div>

        {/* Pillar 2: Appointment Analytics */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#ccfbf1', color: '#0f766e' }}>
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>Appointment Resolution</h3>
              <small style={{ color: 'var(--chair-muted)' }}>128 total registered patient visits</small>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#dcfce7', borderRadius: '8px', fontSize: '13px', color: '#166534' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={15} />
                <span>Completed Consultations:</span>
              </div>
              <strong>{summary.completedAppointments} (75%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fef3c7', borderRadius: '8px', fontSize: '13px', color: '#92400e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} />
                <span>Upcoming Scheduled:</span>
              </div>
              <strong>{summary.upcomingAppointments} (19%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fee2e2', borderRadius: '8px', fontSize: '13px', color: '#991b1b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <XCircle size={15} />
                <span>Cancelled / Rescheduled:</span>
              </div>
              <strong>{summary.cancelledAppointments} (6%)</strong>
            </div>
          </div>
        </div>

        {/* Pillar 3: System Health & Microservices */}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--chair-bg)', borderRadius: '8px', fontSize: '13px' }}>
              <span>Platform System Uptime:</span>
              <strong style={{ color: '#16a34a' }}>{summary.systemUptime}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--chair-bg)', borderRadius: '8px', fontSize: '13px' }}>
              <span>API Gateway Throughput:</span>
              <strong>{summary.apiThroughput}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--chair-bg)', borderRadius: '8px', fontSize: '13px' }}>
              <span>Average Response Latency:</span>
              <strong>{summary.avgResponseTime}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--chair-bg)', borderRadius: '8px', fontSize: '13px' }}>
              <span>Microservice Cluster Nodes:</span>
              <strong>5 Services (All Healthy)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
