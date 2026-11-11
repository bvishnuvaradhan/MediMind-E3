import fs from 'fs';

console.log('Applying Phase 13 frontend updates...');

// =========================================================================
// 1. Update chairmanService.js
// =========================================================================
const chairServicePath = 'frontend/src/services/chairmanService.js';
let chairService = fs.readFileSync(chairServicePath, 'utf8');

// A. Extract reschedCount & walkInCount
if (!chairService.includes('const reschedCount =')) {
  const targetMetrics = `      const noShowCount = (stats?.byHospitalNoShow && stats.byHospitalNoShow[hid]) || 0;`;
  const replacementMetrics = `      const noShowCount = (stats?.byHospitalNoShow && stats.byHospitalNoShow[hid]) || 0;
      const reschedCount = (stats?.byHospitalRescheduled && stats.byHospitalRescheduled[hid]) || 0;
      const walkInCount = (stats?.byHospitalWalkIn && stats.byHospitalWalkIn[hid]) || 0;`;

  chairService = chairService.replace(targetMetrics, replacementMetrics);

  const targetRet = `        // Hospital Operational Comparison Metrics (7 Columns Table)
        totalBookings: intakeCount,
        completedConsultations: servedCount,
        completionRate,
        cancelledBookings: cancelledCount,
        noShowRate,
        aiTriageRuns: aiRunsCount,`;

  const replacementRet = `        // Hospital Operational Comparison Metrics (9 Columns Table with Rescheduled & Walk-ins)
        totalBookings: intakeCount,
        completedConsultations: servedCount,
        completionRate,
        cancelledBookings: cancelledCount,
        rescheduledBookings: reschedCount,
        noShowRate,
        noShowCount,
        walkIns: walkInCount,
        aiTriageRuns: aiRunsCount,`;

  chairService = chairService.replace(targetRet, replacementRet);
  console.log('✓ Added rescheduledBookings & walkIns to getHospitalPerformance output');
}

// B. Add rescheduledTrends
if (!chairService.includes('let rescheduledTrends = [];')) {
  chairService = chairService.replace(
    'let aiRunsTrends = [];',
    'let aiRunsTrends = [];\n    let rescheduledTrends = [];'
  );

  // In isSingleMonth
  const singleMonthTarget = `      aiRunsTrends = distinctDays.map(dayStr => {
        const parts = dayStr.split('-');
        const mIdx = parseInt(parts[1], 10) - 1;
        const label = \`\${parts[2]} \${monthNames[mIdx] || parts[1]}\`;
        const row = { bucket: dayStr, label };
        trendSeries.forEach(s => {
          const dayMonth = dayStr.slice(0, 7);
          if (s.onboardingMonth && dayMonth < s.onboardingMonth) {
            row[s.key] = null;
          } else {
            const match = dailyPreds.find(d => d.bucket === dayStr && d.hospitalId === s.hospitalId);
            row[s.key] = match ? match.count : 0;
          }
        });
        return row;
      });`;

  const singleMonthReplacement = `      aiRunsTrends = distinctDays.map(dayStr => {
        const parts = dayStr.split('-');
        const mIdx = parseInt(parts[1], 10) - 1;
        const label = \`\${parts[2]} \${monthNames[mIdx] || parts[1]}\`;
        const row = { bucket: dayStr, label };
        trendSeries.forEach(s => {
          const dayMonth = dayStr.slice(0, 7);
          if (s.onboardingMonth && dayMonth < s.onboardingMonth) {
            row[s.key] = null;
          } else {
            const match = dailyPreds.find(d => d.bucket === dayStr && d.hospitalId === s.hospitalId);
            row[s.key] = match ? match.count : 0;
          }
        });
        return row;
      });

      rescheduledTrends = distinctDays.map(dayStr => {
        const parts = dayStr.split('-');
        const mIdx = parseInt(parts[1], 10) - 1;
        const label = \`\${parts[2]} \${monthNames[mIdx] || parts[1]}\`;
        const row = { bucket: dayStr, label };
        trendSeries.forEach(s => {
          const dayMonth = dayStr.slice(0, 7);
          if (s.onboardingMonth && dayMonth < s.onboardingMonth) {
            row[s.key] = null;
          } else {
            row[s.key] = 0;
          }
        });
        return row;
      });`;

  chairService = chairService.replace(singleMonthTarget, singleMonthReplacement);

  // In multi-month
  const multiMonthTarget = `      aiRunsTrends = distinctMonths.map(mStr => {
        const [yStr, mNum] = mStr.split('-');
        const mIdx = parseInt(mNum, 10) - 1;
        const isFuture = mStr > currentMonthKey;
        const isCurrentMonth = mStr === currentMonthKey;
        const monthName = monthNames[mIdx] || mNum;
        const label = isFuture
          ? \`\${monthName} \${yStr} (Planned)\`
          : isCurrentMonth
          ? \`\${monthName} \${yStr} (MTD)\`
          : \`\${monthName} \${yStr}\`;
        const row = { bucket: mStr, label, isFuture, isCurrentMonth };
        trendSeries.forEach(s => {
          if (isFuture) {
            row[s.key] = null;
          } else if (s.onboardingMonth && mStr < s.onboardingMonth) {
            row[s.key] = null;
          } else {
            const match = (stats?.byHospitalMonthlyPreds || []).find(m => m.bucket === mStr && m.hospitalId === s.hospitalId);
            row[s.key] = match ? match.count : 0;
          }
        });
        return row;
      });`;

  const multiMonthReplacement = `      aiRunsTrends = distinctMonths.map(mStr => {
        const [yStr, mNum] = mStr.split('-');
        const mIdx = parseInt(mNum, 10) - 1;
        const isFuture = mStr > currentMonthKey;
        const isCurrentMonth = mStr === currentMonthKey;
        const monthName = monthNames[mIdx] || mNum;
        const label = isFuture
          ? \`\${monthName} \${yStr} (Planned)\`
          : isCurrentMonth
          ? \`\${monthName} \${yStr} (MTD)\`
          : \`\${monthName} \${yStr}\`;
        const row = { bucket: mStr, label, isFuture, isCurrentMonth };
        trendSeries.forEach(s => {
          if (isFuture) {
            row[s.key] = null;
          } else if (s.onboardingMonth && mStr < s.onboardingMonth) {
            row[s.key] = null;
          } else {
            const match = (stats?.byHospitalMonthlyPreds || []).find(m => m.bucket === mStr && m.hospitalId === s.hospitalId);
            row[s.key] = match ? match.count : 0;
          }
        });
        return row;
      });

      rescheduledTrends = distinctMonths.map(mStr => {
        const [yStr, mNum] = mStr.split('-');
        const mIdx = parseInt(mNum, 10) - 1;
        const isFuture = mStr > currentMonthKey;
        const isCurrentMonth = mStr === currentMonthKey;
        const monthName = monthNames[mIdx] || mNum;
        const label = isFuture
          ? \`\${monthName} \${yStr} (Planned)\`
          : isCurrentMonth
          ? \`\${monthName} \${yStr} (MTD)\`
          : \`\${monthName} \${yStr}\`;
        const row = { bucket: mStr, label, isFuture, isCurrentMonth };
        trendSeries.forEach(s => {
          if (isFuture) {
            row[s.key] = null;
          } else if (s.onboardingMonth && mStr < s.onboardingMonth) {
            row[s.key] = null;
          } else {
            const match = (stats?.byHospitalMonthlyRescheduled || []).find(m => m.bucket === mStr && m.hospitalId === s.hospitalId);
            row[s.key] = match ? match.count : 0;
          }
        });
        return row;
      });`;

  chairService = chairService.replace(multiMonthTarget, multiMonthReplacement);

  const retResultTarget = `    result.aiRunsTrends = aiRunsTrends;`;
  const retResultReplacement = `    result.aiRunsTrends = aiRunsTrends;\n    result.rescheduledTrends = rescheduledTrends;`;
  chairService = chairService.replace(retResultTarget, retResultReplacement);

  console.log('✓ Added rescheduledTrends multi-series generation to chairmanService.js');
}

fs.writeFileSync(chairServicePath, chairService, 'utf8');

// =========================================================================
// 2. Update HospitalPerformanceView.jsx
// =========================================================================
const chairViewPath = 'frontend/src/components/chairman/views/HospitalPerformanceView.jsx';
let chairView = fs.readFileSync(chairViewPath, 'utf8');

// Add rescheduledTrends destructuring
if (!chairView.includes('rescheduledTrends = performance.rescheduledTrends')) {
  chairView = chairView.replace(
    'const aiRunsTrends = performance.aiRunsTrends || [];',
    'const aiRunsTrends = performance.aiRunsTrends || [];\n  const rescheduledTrends = performance.rescheduledTrends || [];'
  );
}

// Compute aggregate sums for TOTAL row
if (!chairView.includes('const totalCancelled =')) {
  const sumTarget = `  const totalAiRuns = performance.reduce((sum, h) => sum + (Number(h.clinicalAiRuns) || 0), 0);`;
  const sumReplacement = `  const totalAiRuns = performance.reduce((sum, h) => sum + (Number(h.clinicalAiRuns) || 0), 0);
  const totalCancelled = performance.reduce((sum, h) => sum + (Number(h.cancelledBookings) || 0), 0);
  const totalRescheduled = performance.reduce((sum, h) => sum + (Number(h.rescheduledBookings) || 0), 0);
  const totalWalkIns = performance.reduce((sum, h) => sum + (Number(h.walkIns) || 0), 0);
  const totalNoShowCount = performance.reduce((sum, h) => sum + (Number(h.noShowCount) || 0), 0);
  const totalCompletionRate = totalBookings > 0 ? ((totalServed / totalBookings) * 100).toFixed(1) + '%' : '0.0%';
  const totalNoShowRate = totalBookings > 0 ? ((totalNoShowCount / totalBookings) * 100).toFixed(1) + '%' : '0.0%';`;

  chairView = chairView.replace(sumTarget, sumReplacement);
}

// Update Table 2: 9 Columns in exact order + TOTAL row
const oldTable2Regex = /\{\/\* Table 2: Hospital Operational Comparison Table[\s\S]*?<\/tbody>\s*<\/table>/;
const newTable2 = `{/* Table 2: Hospital Operational Comparison Table (Distinct Section, Exactly 9 Columns + TOTAL Row) */}
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
                  <tr key={\`op-\${item.id}\`}>
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
          </table>`;

if (oldTable2Regex.test(chairView)) {
  chairView = chairView.replace(oldTable2Regex, newTable2);
  console.log('✓ Updated Table 2 with 9 exact columns and TOTAL row in HospitalPerformanceView.jsx');
}

// Add 4th Graph: Rescheduled Bookings by Hospital
if (!chairView.includes('Rescheduled Bookings by Hospital')) {
  const chartTarget = `{/* Graph 3: Clinical AI Runs by Hospital (Monthly/Daily Line Chart) */}
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
        </div>`;

  const chartReplacement = `{/* Graph 3: Clinical AI Runs by Hospital (Monthly/Daily Line Chart) */}
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
        </div>`;

  chairView = chairView.replace(chartTarget, chartReplacement);
  console.log('✓ Added Graph 4: Rescheduled Bookings by Hospital to HospitalPerformanceView.jsx');
}

fs.writeFileSync(chairViewPath, chairView, 'utf8');

// =========================================================================
// 3. Update HospitalAnalyticsView.jsx
// =========================================================================
const hospViewPath = 'frontend/src/components/hospital-admin/views/HospitalAnalyticsView.jsx';
let hospView = fs.readFileSync(hospViewPath, 'utf8');

// Update monthlyTrends mapping to include rescheduled, noShow, walkIns, isFuture, isCurrentMonth, status
const oldMappingTarget = `  const rawMonthlyTrends = currentAnalytics?.monthlyTrends || analytics?.monthlyTrends || [];
  const monthlyTrends = rawMonthlyTrends.map((m) => {
    const appointments = Number(m.appointments ?? m.volume ?? m.total ?? 0);
    const completed = Number(m.completed ?? 0);
    const cancelled = Number(m.cancelled ?? 0);
    const scheduled = Number(m.scheduled ?? 0);
    const aiUsage = Number(m.aiUsage ?? 0);
    return {
      ...m,
      month: m.month || 'Unknown',
      appointments,
      completed,
      cancelled,
      scheduled,
      aiUsage,
    };
  });`;

const newMappingReplacement = `  const rawMonthlyTrends = currentAnalytics?.monthlyTrends || analytics?.monthlyTrends || [];
  const monthlyTrends = rawMonthlyTrends.map((m) => {
    const appointments = Number(m.appointments ?? m.volume ?? m.total ?? 0);
    const completed = Number(m.completed ?? 0);
    const cancelled = Number(m.cancelled ?? 0);
    const rescheduled = Number(m.rescheduled ?? 0);
    const noShow = Number(m.noShow ?? 0);
    const walkIns = Number(m.walkIns ?? 0);
    const scheduled = Number(m.scheduled ?? 0);
    const aiUsage = Number(m.aiUsage ?? 0);
    const isFuture = Boolean(m.isFuture);
    const isCurrentMonth = Boolean(m.isCurrentMonth);
    const status = m.status || (isFuture ? 'Future Workload' : isCurrentMonth ? 'MTD In Progress' : 'Closed Cycle');
    return {
      ...m,
      month: m.month || 'Unknown',
      appointments,
      completed,
      cancelled,
      rescheduled,
      noShow,
      walkIns,
      scheduled,
      aiUsage,
      isFuture,
      isCurrentMonth,
      status,
    };
  });

  const totalTableBookings = monthlyTrends.reduce((sum, m) => sum + m.appointments, 0);
  const totalTableCompleted = monthlyTrends.reduce((sum, m) => sum + m.completed, 0);
  const totalTableCancelled = monthlyTrends.reduce((sum, m) => sum + m.cancelled, 0);
  const totalTableRescheduled = monthlyTrends.reduce((sum, m) => sum + m.rescheduled, 0);
  const totalTableNoShow = monthlyTrends.reduce((sum, m) => sum + m.noShow, 0);
  const totalTableWalkIns = monthlyTrends.reduce((sum, m) => sum + m.walkIns, 0);
  const totalTableAiScans = monthlyTrends.reduce((sum, m) => sum + m.aiUsage, 0);
  const tableCompletionRate = totalTableBookings > 0 ? ((totalTableCompleted / totalTableBookings) * 100).toFixed(1) + '%' : '0.0%';
  const tableNoShowRate = totalTableBookings > 0 ? ((totalTableNoShow / totalTableBookings) * 100).toFixed(1) + '%' : '0.0%';`;

hospView = hospView.replace(oldMappingTarget, newMappingReplacement);

// Update table in HospitalAnalyticsView: 10 columns + TOTAL row
const oldHospTableRegex = /<table className="ha-table">[\s\S]*?<\/table>/;
const newHospTable = `<table className="ha-table">
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
              {monthlyTrends.map((item) => {
                const appts = item.appointments;
                const completed = item.completed;
                const cancelled = item.cancelled;
                const rescheduled = item.rescheduled;
                const walkIns = item.walkIns;
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

                const badgeClass = item.isFuture
                  ? 'ha-badge warning'
                  : item.isCurrentMonth
                  ? 'ha-badge info'
                  : 'ha-badge success';

                return (
                  <tr key={item.month}>
                    <td>
                      <strong style={{ fontSize: '13px', color: 'var(--ha-text-primary)' }}>{item.month}</strong>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px' }}>{appts}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: item.isFuture ? 'var(--ha-text-muted)' : 'var(--ha-teal)' }}>
                        {item.isFuture ? '-' : completed}
                      </span>
                    </td>
                    <td>
                      <span className={item.isFuture ? 'ha-badge' : 'ha-badge success'}>{rate}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-text-secondary)' }}>{cancelled}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-primary)' }}>{rescheduled}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: item.isFuture ? 'var(--ha-text-muted)' : 'var(--ha-warning)' }}>
                        {noShowRate}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{walkIns}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-primary)' }}>
                        {item.isFuture ? '-' : \`\${item.aiUsage} Scans\`}
                      </span>
                    </td>
                    <td>
                      <span className={badgeClass} style={{ fontSize: '10px' }}>{item.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {monthlyTrends.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--ha-table-header-bg, rgba(248, 250, 252, 0.9))', borderTop: '2px solid var(--ha-border)' }}>
                  <td>
                    <strong>TOTAL</strong>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13px' }}>{totalTableBookings}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ha-teal)' }}>{totalTableCompleted}</span>
                  </td>
                  <td>
                    <span className="ha-badge success">{tableCompletionRate}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px' }}>{totalTableCancelled}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--ha-primary)' }}>{totalTableRescheduled}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--ha-warning)' }}>{tableNoShowRate}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{totalTableWalkIns}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--ha-primary)', fontWeight: 700 }}>{totalTableAiScans} Scans</span>
                  </td>
                  <td>
                    <span className="ha-badge info" style={{ fontSize: '10px' }}>Facility Total</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>`;

if (oldHospTableRegex.test(hospView)) {
  hospView = hospView.replace(oldHospTableRegex, newHospTable);
  console.log('✓ Updated Monthly Operational Performance Summary Table in HospitalAnalyticsView.jsx');
}

fs.writeFileSync(hospViewPath, hospView, 'utf8');
console.log('✓ All Phase 13 frontend updates successfully applied.');
