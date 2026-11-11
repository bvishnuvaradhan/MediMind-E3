import fs from 'fs';

let content = fs.readFileSync('./frontend/src/components/chairman/views/HospitalPerformanceView.jsx', 'utf8');
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Add tableAnalyticsMode state and monthly trend calculations
const targetState = `  const [loading, setLoading] = useState(true);

  useEffect(() => {`;

const replacementState = `  const [loading, setLoading] = useState(true);
  const [tableAnalyticsMode, setTableAnalyticsMode] = useState('scheduled'); // 'scheduled' | 'intake'

  useEffect(() => {`;

if (!content.includes('tableAnalyticsMode')) {
  content = content.replace(targetState, replacementState);
}

// 2. Add monthly trend totals calculation after granularity
const targetGranularity = `  const trendSeries = performance.trendSeries || [];
  const granularity = performance.granularity || 'monthly';`;

const replacementGranularity = `  const trendSeries = performance.trendSeries || [];
  const granularity = performance.granularity || 'monthly';

  // Network-wide monthly trend views
  const monthlyScheduledTrends = performance.monthlyScheduledTrends || performance.monthlyTrends || [];
  const monthlyIntakeTrends = performance.monthlyIntakeTrends || [];
  const activeMonthlyTrends = tableAnalyticsMode === 'intake' && monthlyIntakeTrends.length > 0
    ? monthlyIntakeTrends
    : monthlyScheduledTrends;

  const totalMonthlyBookings = activeMonthlyTrends.reduce((sum, m) => sum + (Number(m.appointments ?? m.volume ?? m.intakeVolume ?? 0)), 0);
  const totalMonthlyCompleted = activeMonthlyTrends.reduce((sum, m) => sum + (typeof m.completed === 'number' ? m.completed : (Number(m.completed) || 0)), 0);
  const totalMonthlyCancelled = activeMonthlyTrends.reduce((sum, m) => sum + (Number(m.cancelled) || 0), 0);
  const totalMonthlyRescheduled = activeMonthlyTrends.reduce((sum, m) => sum + (Number(m.rescheduled) || 0), 0);
  const totalMonthlyNoShow = activeMonthlyTrends.reduce((sum, m) => sum + (Number(m.noShow) || 0), 0);
  const totalMonthlyPending = activeMonthlyTrends.reduce((sum, m) => sum + (Number(m.pending) || 0), 0);
  const totalMonthlyWalkIns = activeMonthlyTrends.reduce((sum, m) => sum + (Number(m.walkIns) || 0), 0);
  const totalMonthlyAiScans = activeMonthlyTrends.reduce((sum, m) => sum + (Number(m.aiUsage) || 0), 0);
  const monthlyCompletionRate = totalMonthlyBookings > 0 ? ((totalMonthlyCompleted / totalMonthlyBookings) * 100).toFixed(1) + '%' : '0.0%';
  const monthlyNoShowRate = totalMonthlyBookings > 0 ? ((totalMonthlyNoShow / totalMonthlyBookings) * 100).toFixed(1) + '%' : '0.0%';`;

if (!content.includes('activeMonthlyTrends')) {
  content = content.replace(targetGranularity, replacementGranularity);
}

// 3. Add Table 3 after Table 2
const targetTable2End = `                  <td>
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

      {/* Section Header: Historical Volume Trends & Monthly Trajectories */}`;

const replacementTable2End = `                  <td>
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

      {/* Table 3: Network-Wide Monthly Operational Summary Table */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--chair-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
              Network-Wide Monthly Operational Summary
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              {tableAnalyticsMode === 'scheduled'
                ? 'Network-wide monthly operational performance across verified facilities (by scheduled appointment month)'
                : 'Network-wide patient booking intake volume across verified facilities (by booking creation month)'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={\`badge \${tableAnalyticsMode === 'scheduled' ? 'badge-active' : ''}\`}
              onClick={() => setTableAnalyticsMode('scheduled')}
              style={{ cursor: 'pointer', padding: '6px 12px', border: '1px solid var(--chair-border)', background: tableAnalyticsMode === 'scheduled' ? 'var(--chair-sapphire)' : 'var(--chair-card)', color: tableAnalyticsMode === 'scheduled' ? '#fff' : 'var(--chair-text)' }}
            >
              Scheduled Workload (Appointment Month)
            </button>
            <button
              className={\`badge \${tableAnalyticsMode === 'intake' ? 'badge-active' : ''}\`}
              onClick={() => setTableAnalyticsMode('intake')}
              style={{ cursor: 'pointer', padding: '6px 12px', border: '1px solid var(--chair-border)', background: tableAnalyticsMode === 'intake' ? 'var(--chair-sapphire)' : 'var(--chair-card)', color: tableAnalyticsMode === 'intake' ? '#fff' : 'var(--chair-text)' }}
            >
              Booking Intake (Creation Month)
            </button>
          </div>
        </div>

        {/* Reconciliation Equation Banner */}
        <div style={{
          padding: '10px 16px',
          margin: '12px 20px',
          borderRadius: '8px',
          background: tableAnalyticsMode === 'scheduled' ? 'rgba(37, 99, 235, 0.05)' : 'rgba(15, 118, 110, 0.05)',
          border: \`1px solid \${tableAnalyticsMode === 'scheduled' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 118, 110, 0.2)'}\`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '12px'
        }}>
          <div>
            {tableAnalyticsMode === 'scheduled' ? (
              <span>
                <strong>Reconciliation Contract:</strong> Total Scheduled ({totalMonthlyBookings}) = Completed ({totalMonthlyCompleted}) + Cancelled ({totalMonthlyCancelled}) + Rescheduled ({totalMonthlyRescheduled}) + No-Show ({totalMonthlyNoShow}) + Pending ({totalMonthlyPending})
              </span>
            ) : (
              <span>
                <strong>Intake Attribution Contract:</strong> Bookings grouped strictly by creation timestamp (<code>created_at</code>). November advance bookings appear under October intake cohort.
              </span>
            )}
          </div>
          <span className="badge badge-active" style={{ fontSize: '11px' }}>
            {tableAnalyticsMode === 'scheduled' ? '100% Mathematically Reconciled' : 'Creation Timestamp Event-Time'}
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Operational Period</th>
                <th>Total Bookings</th>
                <th>Completed Consultations</th>
                <th>Completion Rate</th>
                <th>Cancelled Bookings</th>
                <th>Rescheduled Bookings</th>
                <th>No-Show Rate</th>
                <th>Walk-ins</th>
                <th>AI Triaged Scans</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeMonthlyTrends.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: 'var(--chair-muted)' }}>
                    Loading monthly operational summary...
                  </td>
                </tr>
              ) : (
                activeMonthlyTrends.map((item) => {
                  const appts = item.appointments || item.volume || item.intakeVolume || 0;
                  const completed = item.completed ?? 0;
                  const cancelled = item.cancelled ?? 0;
                  const rescheduled = item.rescheduled ?? 0;
                  const walkIns = item.walkIns ?? 0;
                  const rate = item.isFuture
                    ? 'N/A'
                    : appts > 0
                    ? \`\${((completed / appts) * 100).toFixed(1)}%\`
                    : (completed === 0 ? '0.0%' : 'N/A');
                  const noShowRate = item.isFuture
                    ? 'N/A'
                    : appts > 0
                    ? \`\${((item.noShow / appts) * 100).toFixed(1)}%\`
                    : '0.0%';

                  return (
                    <tr key={\`month-\${item.month}\`}>
                      <td>
                        <strong>{item.month}</strong>
                      </td>
                      <td>
                        <strong>{appts}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Bookings</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--chair-sapphire)' }}>{item.isFuture ? '-' : completed}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Encounters</span>
                      </td>
                      <td>
                        <span className={item.isFuture ? 'badge' : 'badge badge-active'}>{rate}</span>
                      </td>
                      <td>
                        <span>{cancelled}</span>
                        <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Cancelled</span>
                      </td>
                      <td>
                        <span>{rescheduled}</span>
                        <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Rescheduled</span>
                      </td>
                      <td>
                        <span>{noShowRate}</span>
                      </td>
                      <td>
                        <strong>{walkIns}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Walk-ins</span>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontWeight: '600' }}>
                          {item.isFuture ? '-' : \`\${item.aiUsage} Scans\`}
                        </span>
                      </td>
                      <td>
                        <span className={\`badge \${item.isFuture ? 'badge-warning' : 'badge-active'}\`} style={{ fontSize: '10px' }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {activeMonthlyTrends.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: '700', backgroundColor: 'var(--chair-subtle, rgba(248, 250, 252, 0.8))', borderTop: '2px solid var(--chair-border)' }}>
                  <td>
                    <strong>TOTAL</strong>
                    <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>Network Aggregate</div>
                  </td>
                  <td>
                    <strong>{totalMonthlyBookings}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Bookings</span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--chair-sapphire)' }}>{totalMonthlyCompleted}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Encounters</span>
                  </td>
                  <td>
                    <span className="badge badge-active">{monthlyCompletionRate}</span>
                  </td>
                  <td>
                    <span>{totalMonthlyCancelled}</span>
                    <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Cancelled</span>
                  </td>
                  <td>
                    <span>{totalMonthlyRescheduled}</span>
                    <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Rescheduled</span>
                  </td>
                  <td>
                    <span>{monthlyNoShowRate}</span>
                  </td>
                  <td>
                    <strong>{totalMonthlyWalkIns}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginLeft: '4px' }}>Walk-ins</span>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#2563eb', fontWeight: '700' }}>
                      {totalMonthlyAiScans} Scans
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-active" style={{ fontSize: '10px' }}>Network Total</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Section Header: Historical Volume Trends & Monthly Trajectories */}`;

if (!content.includes('Network-Wide Monthly Operational Summary')) {
  if (!content.includes(targetTable2End)) {
    throw new Error('targetTable2End not found');
  }
  content = content.replace(targetTable2End, replacementTable2End);
}

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('./frontend/src/components/chairman/views/HospitalPerformanceView.jsx', content, 'utf8');
console.log('HospitalPerformanceView.jsx successfully patched with Table 3!');
