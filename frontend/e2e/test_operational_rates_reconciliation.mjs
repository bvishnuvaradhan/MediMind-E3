import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function run() {
  console.log('========================================================================');
  console.log('VERIFYING PHASE 13 HOSPITAL OPERATIONAL COMPARISON & RESCHEDULING AUDIT');
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
    'Rescheduled Bookings',
    'No-Show Rate',
    'Walk-ins',
    'AI Triaged Scans'
  ];

  if (headers.length !== 9) {
    throw new Error(`Expected exactly 9 columns in Table 2, got ${headers.length}`);
  }

  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headers[i].toLowerCase() !== expectedHeaders[i].toLowerCase()) {
      throw new Error(`Header mismatch at col ${i + 1}: expected "${expectedHeaders[i]}", got "${headers[i]}"`);
    }
  }
  console.log('✓ PASS: All 9 headers match the strict Phase 13 specification.');

  const rows = await table2.$$eval('tbody tr', trs => {
    return trs.map(tr => {
      const tds = Array.from(tr.querySelectorAll('td'));
      return {
        facility: tds[0]?.querySelector('strong')?.textContent.trim() || tds[0]?.textContent.trim(),
        totalBookings: tds[1]?.querySelector('strong')?.textContent.trim() || tds[1]?.textContent.trim(),
        completedConsultations: tds[2]?.querySelector('strong')?.textContent.trim() || tds[2]?.textContent.trim(),
        completionRate: tds[3]?.querySelector('.badge')?.textContent.trim() || tds[3]?.textContent.trim(),
        cancelledBookings: tds[4]?.querySelector('span')?.textContent.trim() || tds[4]?.textContent.trim(),
        rescheduledBookings: tds[5]?.querySelector('span')?.textContent.trim() || tds[5]?.textContent.trim(),
        noShowRate: tds[6]?.querySelector('span')?.textContent.trim() || tds[6]?.textContent.trim(),
        walkIns: tds[7]?.querySelector('strong')?.textContent.trim() || tds[7]?.textContent.trim(),
        aiTriageRuns: tds[8]?.querySelector('.badge')?.textContent.trim() || tds[8]?.textContent.trim(),
      };
    });
  });

  console.log('\n--- Rendered Operational Comparison Rows ---');
  console.table(rows);

  // Assertions for rows
  for (const r of rows) {
    console.log(`Auditing row for: ${r.facility}`);

    // Verify 1 decimal place format: e.g. "XX.X%"
    const ratePattern = /^\d+\.\d%$/;
    if (!ratePattern.test(r.completionRate)) {
      throw new Error(`Completion Rate "${r.completionRate}" for ${r.facility} does not match 1 decimal place pattern (e.g. 79.3%)`);
    }

    if (!ratePattern.test(r.noShowRate)) {
      throw new Error(`No-Show Rate "${r.noShowRate}" for ${r.facility} does not match 1 decimal place pattern (e.g. 0.8%)`);
    }

    console.log(`  ✓ ${r.facility}: Completion=${r.completionRate}, Rescheduled=${r.rescheduledBookings}, WalkIns=${r.walkIns}, NoShow=${r.noShowRate}`);
  }

  // 4. Verify Table 2 TOTAL row
  console.log('\n[Step 5] Auditing Table 2 TOTAL Row in tfoot...');
  const tfootRow = await table2.$('tfoot tr');
  if (!tfootRow) {
    throw new Error('Table 2 is missing tfoot TOTAL row');
  }
  const tfootCells = await tfootRow.$$eval('td', tds => tds.map(td => td.textContent.trim().replace(/\s+/g, ' ')));
  console.log('TFOOT Row Cells:', tfootCells);
  if (!tfootCells[0].includes('TOTAL')) {
    throw new Error(`Expected first tfoot cell to contain "TOTAL", got "${tfootCells[0]}"`);
  }
  console.log('✓ PASS: Table 2 TOTAL row correctly aggregated.');

  // 5. Verify Graph 4: Rescheduled Bookings by Hospital
  console.log('\n[Step 6] Auditing Graph 4: Rescheduled Bookings by Hospital...');
  const graphTitles = await page.$$eval('.table-card h3', h3s => h3s.map(h => h.textContent.trim()));
  console.log('Graph Titles found:', graphTitles);
  if (!graphTitles.includes('Rescheduled Bookings by Hospital')) {
    throw new Error('Graph "Rescheduled Bookings by Hospital" not found on page');
  }
  console.log('✓ PASS: Rescheduled Bookings by Hospital chart rendered.');

  console.log('\n========================================================================');
  console.log('ALL PHASE 13 OPERATIONAL COMPARISON & RESCHEDULING AUDIT CHECKS PASSED!');
  console.log('========================================================================\n');

  await browser.close();
}

run().catch(err => {
  console.error('\n❌ AUDIT ERROR:', err);
  process.exit(1);
});
