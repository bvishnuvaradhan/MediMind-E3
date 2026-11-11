import fs from 'fs';
import path from 'path';

// 1. Patch HospitalAnalyticsView.jsx
const haPath = path.resolve('frontend/src/components/hospital-admin/views/HospitalAnalyticsView.jsx');
let haContent = fs.readFileSync(haPath, 'utf-8').replace(/\r\n/g, '\n');

// Update header badge
const haHeaderTarget = `        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--ha-teal)' }} />
          <span>Hospital Operational Overview · Zero PHI Access</span>
        </div>`;

const haHeaderReplacement = `        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--ha-teal)' }} />
          <span>Cutoff: Nov 4, 2026 · Current: Oct 28, 2026 · Zero PHI Access</span>
        </div>`;

// Update Table banner
const haBannerTarget = `            {tableAnalyticsMode === 'scheduled' ? (
              <span>
                <strong>Reconciliation Contract:</strong> Total Scheduled ({totalTableBookings}) = Completed ({totalTableCompleted}) + Cancelled ({totalTableCancelled}) + Rescheduled ({totalTableRescheduled}) + No-Show ({totalTableNoShow}) + Pending ({totalTablePending})
              </span>
            ) : (
              <span>
                <strong>Intake Attribution Contract:</strong> Bookings grouped strictly by creation timestamp (<code>created_at</code>). November advance bookings appear under October intake cohort.
              </span>
            )}
          </div>
          <span className={\`ha-badge \${tableAnalyticsMode === 'scheduled' ? 'success' : 'info'}\`} style={{ fontSize: '11px' }}>
            {tableAnalyticsMode === 'scheduled' ? '100% Mathematically Reconciled' : 'Creation Timestamp Event-Time'}
          </span>`;

const haBannerReplacement = `            {tableAnalyticsMode === 'scheduled' ? (
              <span>
                <strong>Reconciliation Contract:</strong> Total Scheduled ({totalTableBookings}) = Completed ({totalTableCompleted}) + Cancelled ({totalTableCancelled}) + Rescheduled ({totalTableRescheduled}) + No-Show ({totalTableNoShow}) + Pending ({totalTablePending})
              </span>
            ) : (
              <span>
                <strong>Intake Attribution Contract:</strong> AI Triaged Scans ({totalTableAiScans}) = Total Online Bookings ({totalTableBookings - totalTableWalkIns}) = Total Bookings ({totalTableBookings}) - Walk-ins ({totalTableWalkIns})
              </span>
            )}
          </div>
          <span className={\`ha-badge \${tableAnalyticsMode === 'scheduled' ? 'success' : 'info'}\`} style={{ fontSize: '11px' }}>
            {tableAnalyticsMode === 'scheduled' ? '100% Mathematically Reconciled' : 'Intake Contract Enforced'}
          </span>`;

// Update AI Scans cell
const haAiCellTarget = `                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-primary)' }}>
                        {item.isFuture ? '-' : \`\${item.aiUsage} Scans\`}
                      </span>
                    </td>`;

const haAiCellReplacement = `                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-primary)', fontWeight: 600 }}>
                        {item.isFuture ? '-' : \`\${item.aiUsage} Scans\`}
                      </span>
                      {tableAnalyticsMode === 'intake' && item.aiShortfall > 0 && !item.isFuture && (
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--ha-warning, #d97706)', fontWeight: 600 }}>
                          ({item.aiShortfall} unscreened legacy)
                        </span>
                      )}
                      {tableAnalyticsMode === 'intake' && item.aiEquationSatisfied && !item.isFuture && (
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--ha-teal)', fontWeight: 600 }}>
                          ✓ Equality Verified
                        </span>
                      )}
                    </td>`;

if (!haContent.includes(haHeaderTarget)) {
  console.error('HA header target not found!');
  process.exit(1);
}
if (!haContent.includes(haBannerTarget)) {
  console.error('HA banner target not found!');
  process.exit(1);
}
if (!haContent.includes(haAiCellTarget)) {
  console.error('HA AI cell target not found!');
  process.exit(1);
}

haContent = haContent.replace(haHeaderTarget, haHeaderReplacement);
haContent = haContent.replace(haBannerTarget, haBannerReplacement);
haContent = haContent.replace(haAiCellTarget, haAiCellReplacement);
fs.writeFileSync(haPath, haContent, 'utf-8');
console.log('HospitalAnalyticsView.jsx patched successfully!');

// 2. Patch HospitalPerformanceView.jsx
const hpPath = path.resolve('frontend/src/components/chairman/views/HospitalPerformanceView.jsx');
let hpContent = fs.readFileSync(hpPath, 'utf-8').replace(/\r\n/g, '\n');

// Update header actions to include Cutoff badge
const hpHeaderTarget = `        {/* Standardized Date Range Selector */}
        <div className="view-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--chair-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--chair-border)' }}>
            <Calendar size={15} style={{ color: 'var(--chair-sapphire)' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--chair-muted)' }}>Range:</span>`;

const hpHeaderReplacement = `        {/* Standardized Date Range Selector & Cutoff Badge */}
        <div className="view-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--chair-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--chair-border)', fontSize: '11px', color: 'var(--chair-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669', display: 'inline-block' }}></span>
            <span>Cutoff: Nov 4, 2026 · Current: Oct 28, 2026</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--chair-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--chair-border)' }}>
            <Calendar size={15} style={{ color: 'var(--chair-sapphire)' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--chair-muted)' }}>Range:</span>`;

// Update Table 3 banner
const hpBannerTarget = `            {tableAnalyticsMode === 'scheduled' ? (
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
          </span>`;

const hpBannerReplacement = `            {tableAnalyticsMode === 'scheduled' ? (
              <span>
                <strong>Reconciliation Contract:</strong> Total Scheduled ({totalMonthlyBookings}) = Completed ({totalMonthlyCompleted}) + Cancelled ({totalMonthlyCancelled}) + Rescheduled ({totalMonthlyRescheduled}) + No-Show ({totalMonthlyNoShow}) + Pending ({totalMonthlyPending})
              </span>
            ) : (
              <span>
                <strong>Intake Attribution Contract:</strong> AI Triaged Scans ({totalMonthlyAiScans}) = Total Online Bookings ({totalMonthlyBookings - totalMonthlyWalkIns}) = Total Bookings ({totalMonthlyBookings}) - Walk-ins ({totalMonthlyWalkIns})
              </span>
            )}
          </div>
          <span className="badge badge-active" style={{ fontSize: '11px' }}>
            {tableAnalyticsMode === 'scheduled' ? '100% Mathematically Reconciled' : 'Intake Contract Enforced'}
          </span>`;

// Update Table 3 AI cell
const hpAiCellTarget = `                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontWeight: '600' }}>
                          {item.isFuture ? '-' : \`\${item.aiUsage} Scans\`}
                        </span>
                      </td>`;

const hpAiCellReplacement = `                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontWeight: '600' }}>
                          {item.isFuture ? '-' : \`\${item.aiUsage} Scans\`}
                        </span>
                        {tableAnalyticsMode === 'intake' && item.aiShortfall > 0 && !item.isFuture && (
                          <div style={{ fontSize: '10px', color: '#d97706', fontWeight: '600', marginTop: '2px' }}>
                            ({item.aiShortfall} unscreened legacy)
                          </div>
                        )}
                        {tableAnalyticsMode === 'intake' && item.aiEquationSatisfied && !item.isFuture && (
                          <div style={{ fontSize: '10px', color: '#059669', fontWeight: '600', marginTop: '2px' }}>
                            ✓ Equality Verified
                          </div>
                        )}
                      </td>`;

if (!hpContent.includes(hpHeaderTarget)) {
  console.error('HP header target not found!');
  process.exit(1);
}
if (!hpContent.includes(hpBannerTarget)) {
  console.error('HP banner target not found!');
  process.exit(1);
}
if (!hpContent.includes(hpAiCellTarget)) {
  console.error('HP AI cell target not found!');
  process.exit(1);
}

hpContent = hpContent.replace(hpHeaderTarget, hpHeaderReplacement);
hpContent = hpContent.replace(hpBannerTarget, hpBannerReplacement);
hpContent = hpContent.replace(hpAiCellTarget, hpAiCellReplacement);
fs.writeFileSync(hpPath, hpContent, 'utf-8');
console.log('HospitalPerformanceView.jsx patched successfully!');
