import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function run() {
  console.log('========================================================================');
  console.log('VERIFYING HOSPITAL OPERATIONAL COMPARISON RATES & NO-SHOW PRECISION');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const chairContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await chairContext.newPage();

  // 1. Authenticate as Chairman
  console.log('[Step 1] Authenticating as Platform Owner (Chairman)...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', 'chairman@medimind.org');
  await page.fill('input[type="password"]', 'Chair#2026$01!Dev');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.table-card, .stats-grid, nav', { timeout: 15000 });
  console.log('✓ Successfully authenticated into Chairman Workspace.');

  // 2. Navigate to Hospital Performance view
  console.log('[Step 2] Navigating to Hospital Performance view...');
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

  await page.waitForSelector('table', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Select "All Time" to audit the complete dataset
  console.log('[Step 3] Selecting "All Time" date range...');
  const select = await page.$('select');
  if (select) {
    await select.selectOption({ label: 'All Time' });
    await page.waitForTimeout(2000);
  }

  // 3. Inspect Table 2: Hospital Operational Comparison
  console.log('[Step 4] Inspecting Hospital Operational Comparison Table (Table 2)...');
  const tables = await page.$$('table');
  if (tables.length < 2) {
    throw new Error(`Expected at least 2 tables, found ${tables.length}`);
  }

  const table2 = tables[1];
  const headers = await table2.$$eval('thead th', ths => ths.map(th => th.textContent.trim()));
  console.log('Table 2 Headers:', headers);

  const expectedHeaders = [
    'Hospital Network Facility',
    'Total Bookings',
    'Completed Consultations',
    'Completion Rate',
    'Cancelled Bookings',
    'No-Show Rate',
    'AI Triage Runs'
  ];

  if (headers.length !== 7) {
    throw new Error(`Expected exactly 7 columns in Table 2, got ${headers.length}`);
  }

  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headers[i].toLowerCase() !== expectedHeaders[i].toLowerCase()) {
      throw new Error(`Header mismatch at col ${i + 1}: expected "${expectedHeaders[i]}", got "${headers[i]}"`);
    }
  }
  console.log('✓ PASS: All 7 headers match the strict specification.');

  const rows = await table2.$$eval('tbody tr', trs => {
    return trs.map(tr => {
      const tds = Array.from(tr.querySelectorAll('td'));
      return {
        facility: tds[0]?.querySelector('strong')?.textContent.trim() || tds[0]?.textContent.trim(),
        totalBookings: tds[1]?.querySelector('strong')?.textContent.trim() || tds[1]?.textContent.trim(),
        completedConsultations: tds[2]?.querySelector('strong')?.textContent.trim() || tds[2]?.textContent.trim(),
        completionRate: tds[3]?.querySelector('.badge')?.textContent.trim() || tds[3]?.textContent.trim(),
        cancelledBookings: tds[4]?.querySelector('span')?.textContent.trim() || tds[4]?.textContent.trim(),
        noShowRate: tds[5]?.querySelector('span')?.textContent.trim() || tds[5]?.textContent.trim(),
        aiTriageRuns: tds[6]?.querySelector('.badge')?.textContent.trim() || tds[6]?.textContent.trim(),
      };
    });
  });

  console.log('\n--- Rendered Operational Comparison Rows ---');
  console.table(rows);

  // Assertions
  for (const r of rows) {
    console.log(`Auditing row for: ${r.facility}`);

    // Verify 1 decimal place format: e.g. "XX.X%"
    const ratePattern = /^\d+\.\d%$/;
    if (!ratePattern.test(r.completionRate)) {
      throw new Error(`Completion Rate "${r.completionRate}" for ${r.facility} does not match 1 decimal place pattern (e.g. 79.3%)`);
    }
    if (!ratePattern.test(r.noShowRate)) {
      throw new Error(`No-Show Rate "${r.noShowRate}" for ${r.facility} does not match 1 decimal place pattern (e.g. 0.7%)`);
    }

    // Verify No-Show Rate is non-zero and within target demonstration range [0.5% - 1.0%]
    const numNoShow = parseFloat(r.noShowRate);
    if (numNoShow < 0.5 || numNoShow > 1.0) {
      throw new Error(`No-Show Rate ${r.noShowRate} for ${r.facility} is outside expected demo target 0.5% - 1.0%`);
    }

    console.log(`  ✓ Completion Rate: ${r.completionRate} (1-decimal precision verified)`);
    console.log(`  ✓ No-Show Rate:    ${r.noShowRate} (within 0.5% - 1.0% demo target)`);
  }

  console.log('\n========================================================================');
  console.log('✓ ALL OPERATIONAL COMPARISON & NO-SHOW PRECISION CHECKS PASSED!');
  console.log('========================================================================');

  await browser.close();
}

run().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
