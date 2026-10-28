import { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Activity,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';
import { LineChart } from '../../common/charts';
import { STANDARDIZED_ANALYTICS_PERIODS } from '../../../utils/dateUtils';

export function HospitalPerformanceView() {
  const [performance, setPerformance] = useState([]);
  const [dateRange, setDateRange] = useState('All Time');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await chairmanService.getHospitalPerformance(dateRange);
        if (isMounted) {
          setPerformance(data || []);
        }
      } catch (err) {
        console.error('Failed to load hospital performance:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [dateRange]);

  const totalDoctors = performance.reduce((sum, h) => sum + (Number(h.doctorsCount) || 0), 0);
  const totalDepartments = performance.reduce((sum, h) => sum + (Number(h.departmentsCount) || 0), 0);
  const totalBookings = performance.reduce((sum, h) => sum + (Number(h.totalBookings) || 0), 0);
  const totalServed = performance.reduce((sum, h) => sum + (Number(h.appointmentsServed) || 0), 0);
  const totalAiRuns = performance.reduce((sum, h) => sum + (Number(h.clinicalAiRuns) || 0), 0);
  const totalCancelled = performance.reduce((sum, h) => sum + (Number(h.cancelledBookings) || 0), 0);
  const totalRescheduled = performance.reduce((sum, h) => sum + (Number(h.rescheduledBookings) || 0), 0);
  const totalWalkIns = performance.reduce((sum, h) => sum + (Number(h.walkIns) || 0), 0);
  const totalNoShowCount = performance.reduce((sum, h) => sum + (Number(h.noShowCount) || 0), 0);
  const totalCompletionRate = totalBookings > 0 ? ((totalServed / totalBookings) * 100).toFixed(1) + '%' : '0.0%';
  const totalNoShowRate = totalBookings > 0 ? ((totalNoShowCount / totalBookings) * 100).toFixed(1) + '%' : '0.0%';

  const intakeTrends = performance.intakeTrends || [];
  const servedTrends = performance.servedTrends || [];
  const aiRunsTrends = performance.aiRunsTrends || [];
  const rescheduledTrends = performance.rescheduledTrends || [];
  const trendSeries = performance.trendSeries || [];
  const granularity = performance.granularity || 'monthly';

  return (
    <div className="hospital-performance-view">
      {/* Page Header */}
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
            <p>Comparative operational KPIs, booking intake, and clinical throughput across the hospital network.</p>
          </div>
        </div>

        {/* Standardized Date Range Selector */}
        <div className="view-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--chair-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--chair-border)' }}>
            <Calendar size={15} style={{ color: 'var(--chair-sapphire)' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--chair-muted)' }}>Range:</span>
            <select
              aria-label="Standardized Date Range Selector"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontSize: '13px', fontWeight: '600', color: 'var(--chair-text)', cursor: 'pointer', outline: 'none' }}
            >
              {STANDARDIZED_ANALYTICS_PERIODS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Network Overview Summary Cards (5 Key Operational Metrics) */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <p>Network Facilities</p>
          <h3 style={{ marginTop: '8px' }}>{performance.length} Hospitals</h3>
          <span className="stat-delta">100% Verified Multi-Tenant Nodes</span>
        </div>
        <div className="stat-card">
          <p>Medical Specialists</p>
          <h3 style={{ marginTop: '8px' }}>{totalDoctors} Doctors</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Across {totalDepartments} Clinical Departments</small>
        </div>
        <div className="stat-card">
          <p>Intake Bookings</p>
          <h3 style={{ marginTop: '8px' }}>{totalBookings} Bookings</h3>
          <span className="stat-delta">{dateRange} Authoritative Intake</span>
        </div>
        <div className="stat-card">
          <p>Appointments Served</p>
          <h3 style={{ marginTop: '8px' }}>{totalServed} Consultations</h3>
          <span className="stat-delta">{dateRange} Completed Encounters</span>
        </div>
        <div className="stat-card">
          <p>Clinical AI Runs</p>
          <h3 style={{ marginTop: '8px' }}>{totalAiRuns} Inferences</h3>
          <span className="stat-delta">{dateRange} Decision Support Telemetry</span>
        </div>
      </div>

      {/* Table 1: Hospital Network Facility Benchmark Table (Exactly 5 Columns) */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--chair-border)' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
            Hospital Network Facilities
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
            Facility verification, geographical distribution, clinical capacity, and node status
          </p>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hospital Network Facility</th>
                <th>Location</th>
                <th>Medical Doctors</th>
                <th>Departments</th>
                <th>Network Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--chair-muted)' }}>
                    Loading hospital facilities...
                  </td>
                </tr>
              ) : performance.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--chair-muted)' }}>
                    No hospital facilities found matching criteria.
                  </td>
                </tr>
              ) : (
                performance.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>Facility ID: {item.id}</div>
                    </td>
                    <td>{item.city}</td>
                    <td>{item.doctorsCount} Specialists</td>
                    <td>{item.departmentsCount} Active</td>
                    <td>
                      <span className={`badge badge-${(item.status || 'Active').toLowerCase()}`}>
                        {item.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Hospital Operational Comparison Table (Distinct Section, Exactly 9 Columns + TOTAL Row) */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--chair-border)' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
            Hospital Operational Comparison
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
            Booking intake, completed clinical encounters, rescheduling volume, and walk-ins by hospital ({dateRange})
          </p>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hospital Network Facility</th>
                <th>Total Bookings</th>
                <th>Completed Consultations</th>
                <th>Completion Rate</th>
                <th>Cancelled Bookings</th>
                <th>Rescheduled Bookings</th>
                <th>No-Show Rate</th>
                <th>Walk-ins</th>
                <th>AI Triaged Scans</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--chair-muted)' }}>
                    Loading operational comparisons...
                  </td>
                </tr>
              ) : performance.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--chair-muted)' }}>
                    No operational data available for selected period.
                  </td>
                </tr>
              ) : (
                performance.map((item) => (
                  <tr key={`op-${item.id}`}>
                    <td>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>Node: {item.id.slice(-6)}</div>
                    </td>
                    <td>
                      <strong>{item.totalBookings}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Bookings</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--chair-sapphire)' }}>{item.completedConsultations}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Encounters</span>
                    </td>
                    <td>
                      <span className="badge badge-active">{item.completionRate}</span>
                    </td>
                    <td>
                      <span>{item.cancelledBookings}</span>
                      <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Cancelled</span>
                    </td>
                    <td>
                      <span>{item.rescheduledBookings}</span>
                      <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Rescheduled</span>
                    </td>
                    <td>
                      <span style={{ color: item.noShowRate !== '0.0%' && item.noShowRate !== '0%' ? 'var(--chair-text)' : 'var(--chair-muted)' }}>
                        {item.noShowRate}
                      </span>
                    </td>
                    <td>
                      <strong>{item.walkIns}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Walk-ins</span>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontWeight: '600' }}>
                        {item.aiTriageRuns} Scans
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {performance.length > 0 && !loading && (
              <tfoot>
                <tr style={{ fontWeight: '700', backgroundColor: 'var(--chair-subtle, rgba(248, 250, 252, 0.8))', borderTop: '2px solid var(--chair-border)' }}>
                  <td>
                    <strong>TOTAL</strong>
                    <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>3 Active Facilities</div>
                  </td>
                  <td>
                    <strong>{totalBookings}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Bookings</span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--chair-sapphire)' }}>{totalServed}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Encounters</span>
                  </td>
                  <td>
                    <span className="badge badge-active">{totalCompletionRate}</span>
                  </td>
                  <td>
                    <span>{totalCancelled}</span>
                    <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Cancelled</span>
                  </td>
                  <td>
                    <span>{totalRescheduled}</span>
                    <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Rescheduled</span>
                  </td>
                  <td>
                    <span>{totalNoShowRate}</span>
                  </td>
                  <td>
                    <strong>{totalWalkIns}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Walk-ins</span>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#2563eb', fontWeight: '700' }}>
                      {totalAiRuns} Scans
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Section Header: Historical Volume Trends & Monthly Trajectories */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px', fontFamily: 'Plus Jakarta Sans', color: 'var(--chair-text)' }}>
            {dateRange === 'All Time'
              ? 'Historical Monthly Volume Trends (March 2026 – Present)'
              : `Operational Volume Trends (${dateRange})`}
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
            Comparative throughput trajectories across verified multi-tenant hospital facilities
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="badge"
            style={{
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              color: '#b45309',
              fontWeight: '600',
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(234, 179, 8, 0.3)'
            }}
          >
            Reporting Cutoff: October 27, 2026 (Month-to-Date)
          </span>
        </div>
      </div>

      {/* Three Dedicated Separate Line Charts for Intake Bookings, Appointments Served, and Clinical AI Runs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px', marginBottom: '24px' }}>
        {/* Graph 1: Intake Bookings by Hospital (Monthly/Daily Line Chart) */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
              Intake Bookings by Hospital
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              New bookings grouped by booking creation date for the selected reporting period
            </p>
          </div>

          <LineChart
            data={intakeTrends}
            series={trendSeries}
            xKey="label"
            height={220}
            yAxisLabel="Intake Bookings"
            showGrid={true}
            showLegend={true}
          />
        </div>

        {/* Graph 2: Appointments Served by Hospital (Monthly/Daily Line Chart) */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
              Appointments Served by Hospital
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              Completed clinical encounters by encounter date for the selected reporting period
            </p>
          </div>

          <LineChart
            data={servedTrends}
            series={trendSeries}
            xKey="label"
            height={220}
            yAxisLabel="Served Visits"
            showGrid={true}
            showLegend={true}
          />
        </div>

        {/* Graph 3: Clinical AI Runs by Hospital (Monthly/Daily Line Chart) */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
              Clinical AI Runs by Hospital
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              Persisted clinical AI inference executions by inference date for the selected reporting period
            </p>
          </div>

          <LineChart
            data={aiRunsTrends}
            series={trendSeries}
            xKey="label"
            height={220}
            yAxisLabel="AI Inferences"
            showGrid={true}
            showLegend={true}
          />
        </div>

        {/* Graph 4: Rescheduled Bookings by Hospital (Monthly/Daily Line Chart) */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
              Rescheduled Bookings by Hospital
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              Monthly rescheduled booking volume by operational appointment month across verified network facilities
            </p>
          </div>

          <LineChart
            data={rescheduledTrends}
            series={trendSeries}
            xKey="label"
            height={220}
            yAxisLabel="Rescheduled"
            showGrid={true}
            showLegend={true}
          />
        </div>
      </div>

      {/* Multi-Hospital Scalability Architecture Information Box */}
      <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--chair-card)', border: '1px solid var(--chair-border)' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontFamily: 'Plus Jakarta Sans' }}>
          Multi-Hospital Scalability Architecture
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)', lineHeight: 1.6 }}>
          MediMind's multi-tenant architecture isolates hospital operational databases while permitting executive comparative benchmarking at the Platform Owner level. As additional member hospitals are onboarded and approved through Onboarding Requests, they automatically integrate into this comparative dashboard.
        </p>
      </div>
    </div>
  );
}
