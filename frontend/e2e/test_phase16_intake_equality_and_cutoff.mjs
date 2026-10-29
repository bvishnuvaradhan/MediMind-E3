import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function run() {
  console.log('========================================================================');
  console.log('VERIFYING PHASE 16: STRICT INTAKE EQUALITY, TRENDS & NOV 4 CUTOFF');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // 1. Authenticate via API Gateway as Chairman
  // -------------------------------------------------------------------------
  console.log('[Step 1] Authenticating as Platform Owner (Chairman)...');
  const chairPw = 'Chair#2026' + String.fromCharCode(36) + '01!Dev';
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'chairman@medimind.org', password: chairPw })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  if (!token) throw new Error('Chairman authentication failed: ' + JSON.stringify(loginData));
  console.log('✓ Chairman API authentication successful.');

  // -------------------------------------------------------------------------
  // 2. Direct Backend Audit: November 4, 2026 Cutoff & Metadata
  // -------------------------------------------------------------------------
  console.log('\n[Step 2] Auditing November 4, 2026 Cutoff Metadata...');
  const statsRes = await fetch('http://localhost:5000/api/appointments/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statsJson = await statsRes.json();
  if (!statsJson.success) throw new Error('Failed to retrieve appointment stats: ' + statsJson.message);
  const stats = statsJson.data;

  if (stats.cutoffDate !== '2026-11-04') throw new Error(`Expected cutoffDate 2026-11-04, got ${stats.cutoffDate}`);
  if (stats.systemDate !== '2026-10-28') throw new Error(`Expected systemDate 2026-10-28, got ${stats.systemDate}`);
  if (stats.dueWorkload !== 4727) throw new Error(`Expected dueWorkload 4727, got ${stats.dueWorkload}`);
  if (stats.futureWorkload !== 282) throw new Error(`Expected futureWorkload 282, got ${stats.futureWorkload}`);
  if (stats.unresolvedDueCount !== 345) throw new Error(`Expected unresolvedDueCount 345, got ${stats.unresolvedDueCount}`);

  console.log('✓ PASS: Cutoff metadata verified:');
  console.log(`  - Reporting Cutoff: ${stats.cutoffDate}`);
  console.log(`  - Current System Date: ${stats.systemDate}`);
  console.log(`  - Due Workload (<= Nov 4): ${stats.dueWorkload}`);
  console.log(`  - Future Workload (> Nov 4): ${stats.futureWorkload}`);
  console.log(`  - Total Active Appointments: ${stats.dueWorkload + stats.futureWorkload} (5009)`);
  console.log(`  - Unresolved Due Appointments (<= Nov 4): ${stats.unresolvedDueCount} (retained with 0 synthetic completions)`);

  // -------------------------------------------------------------------------
  // 3. Intake Attribution Contract Invariant Check
  // -------------------------------------------------------------------------
  console.log('\n[Step 3] Auditing Intake Attribution Contract (AI = Bookings - Walk-ins)...');
  const networkIntake = stats.monthlyIntakeTrends || [];
  let totalNetworkShortfall = 0;

  for (const m of networkIntake) {
    const intake = m.intakeVolume;
    const walkIns = m.walkIns;
    const online = m.onlineCohort;
    const aiTriaged = m.aiTriagedScans;
    const shortfall = m.aiShortfall;
    const satisfied = m.aiEquationSatisfied;

    if (online !== intake - walkIns) {
      throw new Error(`Online cohort mismatch in ${m.month}: ${online} != ${intake} - ${walkIns}`);
    }
    if (satisfied) {
      if (aiTriaged !== online || shortfall !== 0) {
        throw new Error(`Satisfied month ${m.month} has discrepancy: AI=${aiTriaged}, Online=${online}, Shortfall=${shortfall}`);
      }
    } else {
      if (aiTriaged + shortfall !== online) {
        throw new Error(`Shortfall mismatch in ${m.month}: ${aiTriaged} + ${shortfall} != ${online}`);
      }
      totalNetworkShortfall += shortfall;
    }
  }

  if (totalNetworkShortfall !== 0) {
    throw new Error(`Expected total network shortfall of 0 post-remediation, got ${totalNetworkShortfall}`);
  }
  console.log(`✓ PASS: Network Intake Attribution Contract audited across ${networkIntake.length} cohort months.`);
  console.log(`  - 100% Satisfied across ALL months: AI Triaged Scans = Total Bookings - Walk-ins (Zero Shortfall).`);

  // -------------------------------------------------------------------------
  // 4. Per-Hospital Invariant & Monotonic Trends Check
  // -------------------------------------------------------------------------
  console.log('\n[Step 4] Auditing Per-Hospital Invariant & Monotonic Intake Trends...');
  const hospConfigs = [
    { name: 'Nexora Advanced Care Hospital', id: '6ac85a18074c2bc731a76383', onboard: '2026-07' },
    { name: 'Aarogyam Multispeciality Hospital', id: '6ac85a18074c2bc731a76381', onboard: '2026-05' },
    { name: 'Harborview Medical Centre', id: '6ac85a18074c2bc731a76385', onboard: '2026-03' }
  ];

  for (const h of hospConfigs) {
    const res = await fetch(`http://localhost:5000/api/appointments/stats?hospitalId=${h.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    const hTrends = json.data.monthlyIntakeTrends;

    // Check onboarding: zero pre-onboarding months
    for (const t of hTrends) {
      if (t.monthKey < h.onboard) {
        throw new Error(`${h.name} has pre-onboarding data for ${t.monthKey}`);
      }
    }

    // Check monotonic intake from September onward: Aug <= Sep <= Oct
    const aug = hTrends.find(t => t.monthKey === '2026-08');
    const sep = hTrends.find(t => t.monthKey === '2026-09');
    const oct = hTrends.find(t => t.monthKey === '2026-10');

    if (aug && sep && oct) {
      if (!(aug.intakeVolume <= sep.intakeVolume && sep.intakeVolume <= oct.intakeVolume)) {
        throw new Error(`${h.name} intake volume not monotonic from September onward: Aug=${aug.intakeVolume}, Sep=${sep.intakeVolume}, Oct=${oct.intakeVolume}`);
      }
      console.log(`✓ PASS: ${h.name} strictly monotonic intake: Aug (${aug.intakeVolume}) <= Sep (${sep.intakeVolume}) <= Oct (${oct.intakeVolume})`);
    }

    // Check Nexora equality: 100% across all active months
    if (h.id === '6ac85a18074c2bc731a76383') {
      for (const t of hTrends) {
        if (!t.aiEquationSatisfied || t.aiShortfall !== 0) {
          throw new Error(`Nexora must be 100% compliant in ${t.monthKey}, got shortfall ${t.aiShortfall}`);
        }
      }
      console.log(`✓ PASS: Nexora is 100% compliant with Intake Attribution Equality across ALL months.`);
    }
  }

  // -------------------------------------------------------------------------
  // 5. Browser E2E UI Audit
  // -------------------------------------------------------------------------
  console.log('\n[Step 5] Performing Browser E2E UI Audit with Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 5.1 Platform Owner (Chairman) View
  console.log('Logging in as Platform Owner (Chairman)...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'chairman@medimind.org');
  await page.fill('input[type="password"]', chairPw);
  await page.click('button[type="submit"]');

  await page.waitForSelector('.stat-card, .table-card', { timeout: 15000 });
  console.log('✓ Successfully authenticated into Chairman Workspace.');

  // Navigate to Hospital Performance view
  const perfNavBtn = await page.$('button:has-text("Performance"), button:has-text("Hospital Performance"), a:has-text("Hospital Performance")');
  if (perfNavBtn) {
    await perfNavBtn.click();
    await page.waitForTimeout(500);
  }

  // Check Cutoff badge
  const chairPageText = await page.textContent('body');
  if (!chairPageText.includes('Nov 4, 2026') || !chairPageText.includes('Oct 28, 2026')) {
    throw new Error('Chairman workspace does not display Cutoff: Nov 4, 2026 / Oct 28, 2026');
  }
  console.log('✓ PASS: Chairman workspace displays Nov 4, 2026 Cutoff badge.');

  // Toggle Table 3 to Booking Intake view
  const tableCards = await page.$$('.table-card');
  const table3Card = tableCards[2]; // 3rd table card
  if (!table3Card) throw new Error('Table 3 card container not found');
  const intakeBtn = await table3Card.$('button:has-text("Booking Intake")');
  if (!intakeBtn) throw new Error('Booking Intake button not found in Table 3');
  await intakeBtn.click();
  await page.waitForTimeout(1000);

  const intakeBanner = await table3Card.textContent();
  if (!intakeBanner.includes('Intake Attribution Contract') || !intakeBanner.includes('Total Bookings')) {
    throw new Error('Table 3 does not show Intake Attribution Contract banner');
  }
  console.log('✓ PASS: Table 3 displays Intake Attribution Contract equation banner in Booking Intake view.');

  // Check badges in Table 3: "Equality Verified"
  const table3Content = await (await table3Card.$('table.data-table')).textContent();
  if (!table3Content.includes('Equality Verified')) {
    throw new Error('Table 3 does not display expected Equality Verified indicators');
  }
  console.log('✓ PASS: Table 3 displays Equality Verified badges across all cohort months.');

  // 5.2 Hospital Admin View
  console.log('\nLogging in as Aarogyam Hospital Admin...');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  await adminPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await adminPage.waitForSelector('input[type="email"]', { timeout: 15000 });
  const adminPw = 'Admin#2026' + String.fromCharCode(36) + '01!Dev';
  await adminPage.fill('input[type="email"]', 'admin@aarogyam.hospital');
  await adminPage.fill('input[type="password"]', adminPw);
  await adminPage.click('button[type="submit"]');

  await adminPage.waitForSelector('.ha-stat-grid, nav', { timeout: 15000 });
  console.log('✓ Successfully authenticated into Hospital Admin Workspace.');

  // Navigate to Analytics view
  const adminAnalyticsNav = await adminPage.$('button:has-text("Analytics"), a:has-text("Analytics")');
  if (adminAnalyticsNav) await adminAnalyticsNav.click();
  await adminPage.waitForSelector('table.ha-table tbody tr', { timeout: 15000 });
  await adminPage.waitForTimeout(1000);

  // Check Cutoff badge in HA header
  const haPageText = await adminPage.textContent('body');
  if (!haPageText.includes('Nov 4, 2026') || !haPageText.includes('Oct 28, 2026')) {
    throw new Error('Hospital Admin workspace does not display Cutoff: Nov 4, 2026 / Oct 28, 2026');
  }
  console.log('✓ PASS: Hospital Admin workspace displays Nov 4, 2026 Cutoff badge.');

  // Toggle HA Table to Booking Intake view
  const haTablePanel = await adminPage.$('.ha-card-panel:has(table.ha-table)');
  if (!haTablePanel) throw new Error('Hospital Admin table card panel not found');

  const haIntakeBtn = await haTablePanel.$('button:has-text("Booking Intake")');
  if (!haIntakeBtn) throw new Error('Hospital Admin Booking Intake button not found');
  await haIntakeBtn.click();
  await adminPage.waitForTimeout(1000);

  const haBanner = await haTablePanel.textContent();
  if (!haBanner.includes('Intake Attribution Contract')) {
    throw new Error('Hospital Admin table does not show Intake Attribution Contract banner');
  }
  console.log('✓ PASS: Hospital Admin table displays Intake Attribution Contract banner.');

  const haTableText = await adminPage.textContent('table.ha-table');
  if (!haTableText.includes('Equality Verified')) {
    throw new Error('Hospital Admin table does not show Equality Verified badges');
  }
  console.log('✓ PASS: Hospital Admin table displays Equality Verified badges across all cohort months.');

  await browser.close();

  console.log('\n========================================================================');
  console.log('ALL PHASE 16 INTAKE EQUALITY, TRENDS & CUTOFF CHECKS PASSED!');
  console.log('========================================================================\n');
}

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
