import { chromium } from 'playwright';

async function run() {
  console.log('========================================================================');
  console.log('STARTING HISTORICAL TREND INTEGRITY & MONOTONIC GROWTH VERIFICATION');
  console.log('========================================================================\n');

  // 1. API VERIFICATION
  console.log('--- 1. Testing Backend Stats API & Authoritative Data Integrity ---');
  
  // Login as Chairman to get token
  const authRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'chairman@medimind.org',
      password: 'Chair#2026$01!Dev'
    })
  });
  const authJson = await authRes.json();
  if (!authJson.success || !authJson.data?.token) {
    throw new Error('Failed to authenticate as Chairman via API Gateway');
  }
  const token = authJson.data.token;
  console.log('✓ Chairman API authentication successful');

  // Fetch stats for All Time
  const statsRes = await fetch('http://localhost:5000/api/appointments/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const statsJson = await statsRes.json();
  if (!statsJson.success || !statsJson.data) {
    console.error('Stats response status:', statsRes.status, 'Body:', statsJson);
    throw new Error('Failed to retrieve appointment stats from API');
  }
  const stats = statsJson.data;

  // Get Hospitals to map IDs
  const hospRes = await fetch('http://localhost:5000/api/hospitals', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const hospJson = await hospRes.json();
  console.log('HOSP JSON DATA:', hospJson);
  const hospitals = Array.isArray(hospJson.data) ? hospJson.data : (hospJson.data?.hospitals || []);
  const hospMap = {};
  hospitals.forEach(h => hospMap[(h._id || h.id || '').toString()] = h.name);

  const harborviewId = (hospitals.find(h => (h.name || '').toLowerCase().includes('harborview'))?.hospitalId || hospitals.find(h => (h.name || '').toLowerCase().includes('harborview'))?.id || '').toString();
  const aarogyamId = (hospitals.find(h => (h.name || '').toLowerCase().includes('aarogyam'))?.hospitalId || hospitals.find(h => (h.name || '').toLowerCase().includes('aarogyam'))?.id || '').toString();
  const nexoraId = (hospitals.find(h => (h.name || '').toLowerCase().includes('nexora'))?.hospitalId || hospitals.find(h => (h.name || '').toLowerCase().includes('nexora'))?.id || '').toString();

  console.log(`✓ Resolved hospital facilities: Harborview (${harborviewId}), Aarogyam (${aarogyamId}), Nexora (${nexoraId})`);

  // Verify byHospitalMonthlyIntake counts
  const monthlyIntake = stats.byHospitalMonthlyIntake || [];
  console.log('Sample monthly intake entries:', monthlyIntake.slice(0, 3));
  console.log(`\nAuditing monthly intake records (total entries: ${monthlyIntake.length})...`);

  const intakeByHosp = {
    Harborview: {},
    Aarogyam: {},
    Nexora: {}
  };

  for (const m of monthlyIntake) {
    if (m.hospitalId === harborviewId) intakeByHosp.Harborview[m.bucket] = m.count;
    if (m.hospitalId === aarogyamId) intakeByHosp.Aarogyam[m.bucket] = m.count;
    if (m.hospitalId === nexoraId) intakeByHosp.Nexora[m.bucket] = m.count;
  }

  console.log('Harborview Monthly Intake:', intakeByHosp.Harborview);
  console.log('Aarogyam Monthly Intake:  ', intakeByHosp.Aarogyam);
  console.log('Nexora Monthly Intake:    ', intakeByHosp.Nexora);

  // Check 1: Onboarding timeline enforcement
  if (intakeByHosp.Harborview['2026-02']) {
    throw new Error(`Harborview has pre-onboarding activity in 2026-02: ${intakeByHosp.Harborview['2026-02']}`);
  }
  if (!intakeByHosp.Harborview['2026-03'] || intakeByHosp.Harborview['2026-03'] <= 0) {
    throw new Error('Harborview must start in 2026-03 with positive intake');
  }
  console.log('✓ PASS: Harborview begins in March 2026 with no pre-onboarding activity.');

  if (intakeByHosp.Aarogyam['2026-03'] || intakeByHosp.Aarogyam['2026-04']) {
    throw new Error(`Aarogyam has pre-onboarding activity in Mar/Apr 2026: Mar=${intakeByHosp.Aarogyam['2026-03']}, Apr=${intakeByHosp.Aarogyam['2026-04']}`);
  }
  if (!intakeByHosp.Aarogyam['2026-05'] || intakeByHosp.Aarogyam['2026-05'] <= 0) {
    throw new Error('Aarogyam must start in 2026-05 with positive intake');
  }
  console.log('✓ PASS: Aarogyam begins in May 2026 with zero pre-May demo activity.');

  if (intakeByHosp.Nexora['2026-03'] || intakeByHosp.Nexora['2026-04'] || intakeByHosp.Nexora['2026-05'] || intakeByHosp.Nexora['2026-06']) {
    throw new Error('Nexora has pre-onboarding activity prior to July 2026');
  }
  if (!intakeByHosp.Nexora['2026-07'] || intakeByHosp.Nexora['2026-07'] <= 0) {
    throw new Error('Nexora must start in 2026-07 with positive intake');
  }
  console.log('✓ PASS: Nexora begins in July 2026 with zero pre-July demo activity.');

  // Check 2: Monotonic growth verification
  function verifyStrictlyIncreasing(name, dataObj, months) {
    for (let i = 1; i < months.length; i++) {
      const prevM = months[i - 1];
      const curM = months[i];
      const prevCount = dataObj[prevM] || 0;
      const curCount = dataObj[curM] || 0;
      if (curCount <= prevCount) {
        throw new Error(`Monotonic violation for ${name}: ${curM} (${curCount}) is not greater than ${prevM} (${prevCount})`);
      }
      console.log(`  ${name} growth: ${prevM} (${prevCount}) -> ${curM} (${curCount}) [PASS +${curCount - prevCount}]`);
    }
  }

  console.log('\n--- Verifying Strictly Increasing Trajectory Per Hospital ---');
  verifyStrictlyIncreasing('Harborview', intakeByHosp.Harborview, ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
  verifyStrictlyIncreasing('Aarogyam', intakeByHosp.Aarogyam, ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
  verifyStrictlyIncreasing('Nexora', intakeByHosp.Nexora, ['2026-07', '2026-08', '2026-09', '2026-10']);
  console.log('✓ PASS: Every eligible month after onboarding has more intake bookings than the preceding eligible month.');

  // Check 3: Combined network growth
  console.log('\n--- Verifying Combined Network Growth ---');
  const allMonths = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
  const networkTotals = {};
  for (const m of allMonths) {
    networkTotals[m] = (intakeByHosp.Harborview[m] || 0) + (intakeByHosp.Aarogyam[m] || 0) + (intakeByHosp.Nexora[m] || 0);
  }
  verifyStrictlyIncreasing('Network Total', networkTotals, allMonths);
  console.log('✓ PASS: Combined network intake grows month over month.');

  // Check 4: Cancellation Caps
  console.log('\n--- Verifying Cancellation Caps ---');
  const hCanc = stats.byHospitalCancelled || {};
  const hHarborviewCanc = hCanc[harborviewId] || 0;
  const hAarogyamCanc = hCanc[aarogyamId] || 0;
  const hNexoraCanc = hCanc[nexoraId] || 0;
  const totalCanc = hHarborviewCanc + hAarogyamCanc + hNexoraCanc;

  console.log(`Harborview Cancellations: ${hHarborviewCanc} (Cap: 100)`);
  console.log(`Aarogyam Cancellations:   ${hAarogyamCanc} (Cap: 100)`);
  console.log(`Nexora Cancellations:     ${hNexoraCanc} (Cap: 100)`);
  console.log(`Network Cancellations:    ${totalCanc} (Cap: 300)`);

  if (hHarborviewCanc > 100 || hAarogyamCanc > 100 || hNexoraCanc > 100 || totalCanc > 300) {
    throw new Error('Cancellation cap exceeded!');
  }
  console.log('✓ PASS: Hospital and network cancellation caps strictly honored.');

  // -------------------------------------------------------------------------
  // 2. PLAYWRIGHT BROWSER E2E TESTS (CHART RENDERING, TOOLTIPS, NULL BREAKS)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Browser Verification of SVG Rendering & Tooltips ---');
  const browser = await chromium.launch({ headless: true });

  try {
    const chairContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await chairContext.newPage();

    console.log('[Step 1] Logging into Chairman Workspace...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', 'chairman@medimind.org');
    await page.fill('input[type="password"]', 'Chair#2026$01!Dev');
    await page.click('button[type="submit"]');

    await page.waitForSelector('.table-card, .stats-grid, nav', { timeout: 15000 });

    // Navigate to Hospital Performance view
    console.log('[Step 2] Navigating to Hospital Performance Comparison...');
    const perfNavBtn = await page.$('button:has-text("Performance"), button:has-text("Hospital Performance"), a:has-text("Hospital Performance")');
    if (perfNavBtn) {
      await perfNavBtn.click();
    } else {
      const allBtns = await page.$$('.chair-nav-item, nav button, aside button');
      for (const btn of allBtns) {
        const text = await btn.innerText();
        if (text.includes('Performance') || text.includes('Hospital')) {
          await btn.click();
          break;
        }
      }
    }
    await page.waitForSelector('table.data-table', { timeout: 10000 });
    await page.waitForSelector('table.data-table tbody tr:not(:has-text("Loading"))', { timeout: 15000 });

    // Ensure "All Time" is selected to see full March-October range
    console.log('[Step 3] Selecting "All Time" period...');
    await page.selectOption('select[aria-label="Standardized Date Range Selector"]', 'All Time');
    await page.waitForTimeout(1000);

    // Verify SVG line chart rendering for Intake Bookings
    console.log('[Step 4] Auditing SVG line chart path and circle counts...');
    await page.waitForSelector('.table-card svg', { timeout: 10000 });
    const allH3 = await page.$$eval('.table-card h3', (els) => els.map(e => e.innerText));
    console.log('Rendered table-card h3 titles:', allH3);
    const totalCircles = await page.$$eval('svg circle', (circles) => circles.length);
    console.log('Total SVG circles on entire page:', totalCircles);
    const intakeCard = await page.$('.table-card:has(h3:has-text("Intake Bookings by Hospital"))');
    const intakeCircles = intakeCard ? await intakeCard.$$eval('svg circle', (circles) => circles.length) : 0;
    console.log(`Intake Bookings Graph circles rendered: ${intakeCircles}`);
    if (intakeCircles !== 18) {
      throw new Error(`Expected exactly 18 circles in Intake Bookings chart (8 Harborview + 6 Aarogyam + 4 Nexora), got ${intakeCircles}`);
    }
    console.log('✓ PASS: Exactly 18 circles rendered (pre-onboarding points cleanly absent, no zero-dots for Aarogyam in Mar/Apr or Nexora in Mar-Jun).');

    // Step 5: Test Hover Tooltip on Pre-Onboarding Months
    console.log('[Step 5] Auditing hover tooltip on March (pre-onboarding for Aarogyam and Nexora)...');
    // Hover over the first column (March)
    const firstRect = await page.$('.table-card:has(h3:has-text("Intake Bookings by Hospital")) svg rect');
    if (firstRect) {
      await firstRect.hover();
      await page.waitForTimeout(300);
      const tooltipText = await page.textContent('.table-card:has(h3:has-text("Intake Bookings by Hospital"))');
      console.log('Tooltip visible in DOM. Checking text for Unavailable indicators...');
      if (!tooltipText.includes('Unavailable')) {
        throw new Error('Tooltip should indicate Unavailable for pre-onboarding hospitals in March');
      }
      console.log('✓ PASS: Pre-onboarding hospital activity is marked "Unavailable" in tooltip, not fabricated zero.');
    }

    await chairContext.close();

    // -----------------------------------------------------------------------
    // PART C: HOSPITAL ADMIN - AAROGYAM MULTISPECIALITY (ONBOARDED MAY 2026)
    // -----------------------------------------------------------------------
    console.log('\n--- 3. Testing Hospital Admin (Aarogyam) Retrospective Trends ---');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    console.log('[Step 6] Logging in as Aarogyam Hospital Admin...');
    await adminPage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('input[type="email"]', { timeout: 15000 });
    await adminPage.fill('input[type="email"]', 'admin@aarogyam.hospital');
    await adminPage.fill('input[type="password"]', 'Admin#2026$01!Dev');
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForSelector('.ha-stat-grid, nav', { timeout: 15000 });

    // Navigate to Analytics
    console.log('[Step 7] Navigating to Hospital Operational Analytics...');
    const analyticsNavBtn = await adminPage.$('button:has-text("Analytics"), a:has-text("Analytics")');
    if (analyticsNavBtn) {
      await analyticsNavBtn.click();
    } else {
      const allBtns = await adminPage.$$('.ha-nav-item, nav button, aside button');
      for (const btn of allBtns) {
        const text = await btn.innerText();
        if (text.includes('Analytics')) {
          await btn.click();
          break;
        }
      }
    }

    await adminPage.waitForSelector('.ha-kpi-grid, .ha-card-panel', { timeout: 10000 });
    await adminPage.waitForSelector('.ha-card-panel svg path', { timeout: 10000 });

    // Verify Title reflects Aarogyam onboarding (May 2026 – Oct 2026)
    console.log('[Step 8] Verifying Aarogyam Retrospective Trend Title...');
    await adminPage.waitForFunction(() => {
      const allH3 = Array.from(document.querySelectorAll('h3'));
      const trendH3 = allH3.find((h) => h.innerText && h.innerText.includes('Historical Monthly Operational Volume Trends'));
      return trendH3 && trendH3.innerText.includes('May 2026');
    }, { timeout: 15000 });

    const trendHeader = await adminPage.evaluate(() => {
      const allH3 = Array.from(document.querySelectorAll('h3'));
      const trendH3 = allH3.find((h) => h.innerText && h.innerText.includes('Historical Monthly Operational Volume Trends'));
      return trendH3 ? trendH3.innerText : '';
    });
    console.log(`Aarogyam Trend Header: "${trendHeader}"`);
    if (!trendHeader.includes('May 2026')) {
      throw new Error(`Aarogyam trend header must start from May 2026, found "${trendHeader}"`);
    }
    console.log('✓ PASS: Aarogyam Historical Monthly Operational Volume Trends accurately anchors at May 2026 onboarding.');

    await adminContext.close();

    console.log('\n========================================================================');
    console.log('ALL HISTORICAL TREND INTEGRITY & MONOTONIC GROWTH AUDIT CHECKS PASSED!');
    console.log('========================================================================\n');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
