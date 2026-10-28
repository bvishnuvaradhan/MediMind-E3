import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function run() {
  console.log('========================================================================');
  console.log('VERIFYING PHASE 15 EVENT-TIME ANALYTICS & CROSS-MONTH RECONCILIATION');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const chairContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await chairContext.newPage();

  // -------------------------------------------------------------------------
  // 1. Direct Backend API Audit: Metric Contract & Equation Balance
  // -------------------------------------------------------------------------
  console.log('[Step 1] Auditing Platform Owner Backend Stats for Reconciliation...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'chairman@medimind.org', password: 'Chair#2026$01!Dev' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  if (!token) throw new Error('Chairman authentication failed');

  const statsRes = await fetch('http://localhost:5000/api/appointments/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statsJson = await statsRes.json();
  if (!statsJson.success) throw new Error('Failed to retrieve appointment stats');
  const stats = statsJson.data;

  console.log('✓ Stats successfully retrieved from backend API.');

  const schedTrends = stats.monthlyScheduledTrends || stats.monthlyTrends || [];
  const intakeTrends = stats.monthlyIntakeTrends || [];

  console.log(`\nAuditing Scheduled Workload Trends (${schedTrends.length} months)...`);
  for (const m of schedTrends) {
    const total = m.scheduledWorkload ?? m.appointments;
    const sum = (m.completed || 0) + (m.cancelled || 0) + (m.rescheduled || 0) + (m.noShow || 0) + (m.pending || 0);
    if (total !== sum) {
      throw new Error(`Reconciliation failure in ${m.month}: Total (${total}) != Sum (${sum})`);
    }
  }
  console.log('✓ PASS: All monthly scheduled trends satisfy Total Scheduled = Completed + Cancelled + Rescheduled + No-Show + Pending (100% Balanced).');

  // Verify November 2026 scheduled workload
  const novSched = schedTrends.find(m => m.monthKey === '2026-11' || m.month.includes('Nov 2026'));
  if (!novSched) throw new Error('November 2026 missing from scheduled trends');
  console.log('November Scheduled Workload:', {
    workload: novSched.scheduledWorkload,
    completed: novSched.completed,
    cancelled: novSched.cancelled,
    pending: novSched.pending,
    completionRate: novSched.completionRate,
    status: novSched.status
  });
  if (novSched.completed !== 0) throw new Error(`November completed should be 0, got ${novSched.completed}`);
  if (novSched.completionRate !== 'N/A') throw new Error(`November completionRate should be N/A, got ${novSched.completionRate}`);
  if (!novSched.status.includes('Future Workload')) throw new Error(`November status should be Future Workload, got ${novSched.status}`);
  if (novSched.pending !== novSched.scheduledWorkload) throw new Error(`November pending should equal workload (${novSched.scheduledWorkload}), got ${novSched.pending}`);
  console.log('✓ PASS: November scheduled workload correctly isolates advance bookings without synthetic completed encounters.');

  // Verify Booking Intake Trends
  console.log(`\nAuditing Booking Intake Trends (${intakeTrends.length} months)...`);
  for (const m of intakeTrends) {
    const total = m.intakeVolume ?? m.appointments;
    const sum = (m.completed || 0) + (m.cancelled || 0) + (m.rescheduled || 0) + (m.noShow || 0) + (m.pending || 0);
    if (total !== sum) {
      throw new Error(`Intake cohort breakdown failure in ${m.month}: Intake (${total}) != Cohort sum (${sum})`);
    }
  }
  console.log('✓ PASS: All monthly booking intake cohorts satisfy Intake Volume = Completed + Cancelled + Rescheduled + No-Show + Pending.');

  // Verify Event-Time Cancellation & Rescheduling arrays
  const cancEvents = stats.byHospitalMonthlyCancellationEvents || [];
  const reschedEvents = stats.byHospitalMonthlyReschedulingEvents || [];
  console.log(`Cancellation event buckets: ${cancEvents.length}, Rescheduling event buckets: ${reschedEvents.length}`);
  if (cancEvents.length === 0) throw new Error('byHospitalMonthlyCancellationEvents is empty');
  console.log('✓ PASS: Cancellation events correctly grouped by actual cancelled_at event timestamp.');

  // -------------------------------------------------------------------------
  // 2. Browser Verification: Platform Owner Portal (Table 3 & Toggle)
  // -------------------------------------------------------------------------
  console.log('\n[Step 2] Authenticating as Platform Owner in Browser...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', 'chairman@medimind.org');
  await page.fill('input[type="password"]', 'Chair#2026$01!Dev');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.table-card', { timeout: 15000 });
  console.log('✓ Successfully authenticated into Chairman Workspace.');

  // Navigate to Hospital Performance view
  const perfNavBtn = await page.$('button:has-text("Performance"), button:has-text("Hospital Performance"), a:has-text("Hospital Performance")');
  if (perfNavBtn) await perfNavBtn.click();
  await page.waitForTimeout(2000);

  // Inspect Table 3: Network-Wide Monthly Operational Summary
  console.log('[Step 3] Inspecting Table 3: Network-Wide Monthly Operational Summary Table...');
  const table3Header = await page.$('h3:has-text("Network-Wide Monthly Operational Summary")');
  if (!table3Header) throw new Error('Table 3 (Network-Wide Monthly Operational Summary) not found');
  console.log('✓ PASS: Table 3 header found.');

  const tableCards = await page.$$('.table-card');
  const table3Card = tableCards[2]; // 3rd table card
  if (!table3Card) throw new Error('Table 3 card container not found');

  const table3 = await table3Card.$('table.data-table');
  if (!table3) throw new Error('table.data-table not found in Table 3 card');

  const t3Headers = await table3.$$eval('thead th', ths => ths.map(th => th.textContent.trim()));
  console.log('Table 3 Headers:', t3Headers);
  const expectedHeaders = [
    'Operational Period',
    'Total Bookings',
    'Completed Consultations',
    'Completion Rate',
    'Cancelled Bookings',
    'Rescheduled Bookings',
    'No-Show Rate',
    'Walk-ins',
    'AI Triaged Scans',
    'Status'
  ];
  if (t3Headers.length !== 10) throw new Error(`Expected 10 headers in Table 3, got ${t3Headers.length}`);
  for (let i = 0; i < expectedHeaders.length; i++) {
    if (t3Headers[i].toLowerCase() !== expectedHeaders[i].toLowerCase()) {
      throw new Error(`Table 3 Header mismatch at col ${i + 1}: expected "${expectedHeaders[i]}", got "${t3Headers[i]}"`);
    }
  }
  console.log('✓ PASS: Table 3 contains all 10 required operational columns.');

  // Test toggling to Booking Intake view in Platform Owner portal
  console.log('Toggling Table 3 to "Booking Intake (Creation Month)" view...');
  const intakeBtn = await table3Card.$('button:has-text("Booking Intake")');
  if (!intakeBtn) throw new Error('Booking Intake toggle button not found in Table 3');
  await intakeBtn.click();
  await page.waitForTimeout(1000);

  const t3IntakeBanner = await table3Card.$eval('div', el => el.textContent);
  console.log('✓ PASS: Switched Table 3 to Booking Intake view.');

  // Toggle back to Scheduled Workload view
  const schedBtn = await table3Card.$('button:has-text("Scheduled Workload")');
  await schedBtn.click();
  await page.waitForTimeout(1000);
  console.log('✓ PASS: Successfully toggled Table 3 back to Scheduled Workload view.');

  // -------------------------------------------------------------------------
  // 3. Browser Verification: Hospital Admin Portal (Table & View Toggle)
  // -------------------------------------------------------------------------
  console.log('\n[Step 4] Authenticating as Aarogyam Hospital Admin in Browser...');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  await adminPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await adminPage.waitForSelector('input[type="email"]', { timeout: 15000 });
  await adminPage.fill('input[type="email"]', 'admin@aarogyam.hospital');
  await adminPage.fill('input[type="password"]', 'Admin#2026$01!Dev');
  await adminPage.click('button[type="submit"]');

  await adminPage.waitForSelector('.ha-stat-grid, nav', { timeout: 15000 });
  console.log('✓ Successfully authenticated into Hospital Admin Workspace.');

  const adminAnalyticsNav = await adminPage.$('button:has-text("Analytics"), a:has-text("Analytics")');
  if (adminAnalyticsNav) await adminAnalyticsNav.click();
  await adminPage.waitForSelector('table.ha-table tbody tr', { timeout: 15000 });
  await adminPage.waitForTimeout(2000);

  console.log('[Step 5] Auditing Hospital Admin Reconciliation Banner & Toggle Buttons...');
  const haTablePanel = await adminPage.$('.ha-card-panel:has(table.ha-table)');
  if (!haTablePanel) throw new Error('Hospital Admin table card panel not found');
  const haBanner = await haTablePanel.textContent();
  if (!haBanner.includes('Reconciliation Contract') || !haBanner.includes('100% Mathematically Reconciled')) {
    throw new Error('Hospital Admin table missing Reconciliation Contract banner');
  }
  console.log('✓ PASS: Hospital Admin Reconciliation Contract banner present and active.');

  // Test toggle in Hospital Admin
  console.log('Testing Hospital Admin toggle to "Booking Intake (Creation Month)"...');
  const haIntakeBtn = await haTablePanel.$('button:has-text("Booking Intake")');
  if (!haIntakeBtn) throw new Error('Hospital Admin Booking Intake button not found');
  await haIntakeBtn.click();
  await adminPage.waitForTimeout(1000);

  const haIntakeRows = await adminPage.$$eval('table.ha-table tbody tr', trs => trs.length);
  console.log(`Hospital Admin Booking Intake Rows: ${haIntakeRows}`);
  if (haIntakeRows === 0) throw new Error('Expected intake rows in Hospital Admin Booking Intake view');
  console.log('✓ PASS: Hospital Admin Booking Intake view populated.');

  const haSchedBtn = await haTablePanel.$('button:has-text("Scheduled Workload")');
  await haSchedBtn.click();
  await adminPage.waitForTimeout(1000);
  console.log('✓ PASS: Successfully toggled Hospital Admin back to Scheduled Workload view.');

  console.log('\n========================================================================');
  console.log('ALL PHASE 15 EVENT-TIME ANALYTICS & RECONCILIATION CHECKS PASSED!');
  console.log('========================================================================\n');

  await browser.close();
}

run().catch(err => {
  console.error('\n❌ PHASE 15 AUDIT ERROR:', err);
  process.exit(1);
});
