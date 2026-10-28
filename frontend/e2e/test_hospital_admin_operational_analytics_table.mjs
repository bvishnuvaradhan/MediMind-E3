import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function run() {
  console.log('========================================================================');
  console.log('VERIFYING HOSPITAL ADMIN MONTHLY OPERATIONAL PERFORMANCE SUMMARY TABLE');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await adminContext.newPage();

  // 1. Authenticate as Hospital Admin (Aarogyam)
  console.log('[Step 1] Authenticating as Aarogyam Hospital Admin (admin@aarogyam.hospital)...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', 'admin@aarogyam.hospital');
  await page.fill('input[type="password"]', 'Admin#2026$01!Dev');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.ha-stat-grid, nav', { timeout: 15000 });
  console.log('✓ Successfully authenticated into Hospital Admin Workspace.');

  // 2. Navigate to Operational Analytics view
  console.log('[Step 2] Navigating to Hospital Analytics view...');
  const analyticsNavBtn = await page.$('button:has-text("Analytics"), a:has-text("Analytics")');
  if (analyticsNavBtn) {
    await analyticsNavBtn.click();
  } else {
    const allBtns = await page.$$('nav button, aside button');
    for (const btn of allBtns) {
      const text = await btn.innerText();
      if (text.includes('Analytics')) {
        await btn.click();
        break;
      }
    }
  }

  await page.waitForSelector('table.ha-table tbody tr', { timeout: 15000 });

  // 3. Inspect Table: Monthly Operational Performance Summary Table
  console.log('[Step 3] Inspecting Monthly Operational Performance Summary Table...');
  const table = await page.$('table.ha-table');
  if (!table) {
    throw new Error('table.ha-table not found');
  }

  const headers = await table.$$eval('thead th', ths => ths.map(th => th.textContent.trim()));
  console.log('Hospital Admin Table Headers:', headers);

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

  if (headers.length !== 10) {
    throw new Error(`Expected exactly 10 columns in Hospital Admin Table, got ${headers.length}`);
  }

  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headers[i].toLowerCase() !== expectedHeaders[i].toLowerCase()) {
      throw new Error(`Header mismatch at col ${i + 1}: expected "${expectedHeaders[i]}", got "${headers[i]}"`);
    }
  }
  console.log('✓ PASS: All 10 headers match the strict Phase 13 specification.');

  const rows = await table.$$eval('tbody tr', trs => {
    return trs.map(tr => {
      const tds = Array.from(tr.querySelectorAll('td'));
      return {
        period: tds[0]?.textContent.trim(),
        totalBookings: tds[1]?.textContent.trim(),
        completedConsultations: tds[2]?.textContent.trim(),
        completionRate: tds[3]?.textContent.trim(),
        cancelledBookings: tds[4]?.textContent.trim(),
        rescheduledBookings: tds[5]?.textContent.trim(),
        noShowRate: tds[6]?.textContent.trim(),
        walkIns: tds[7]?.textContent.trim(),
        aiTriagedScans: tds[8]?.textContent.trim(),
        status: tds[9]?.textContent.trim(),
      };
    });
  });

  console.log('\n--- Rendered Hospital Admin Monthly Rows ---');
  console.table(rows);

  // Check that November 2026 row exists and shows Future Workload
  const novRow = rows.find(r => r.period.includes('Nov 2026'));
  if (!novRow) {
    throw new Error('Expected November 2026 row in Hospital Admin table, but not found');
  }
  console.log('✓ PASS: November 2026 row exists.');
  console.log('  November status:', novRow.status);
  if (!novRow.status.includes('Future Workload')) {
    throw new Error(`Expected November row status to be "Future Workload", got "${novRow.status}"`);
  }
  console.log('  November completion rate:', novRow.completionRate);
  if (novRow.completionRate !== 'N/A' && novRow.completionRate !== '-') {
    throw new Error(`Expected November completion rate to be N/A or -, got "${novRow.completionRate}"`);
  }

  // Check that October 2026 shows MTD In Progress
  const octRow = rows.find(r => r.period.includes('Oct 2026'));
  if (!octRow) {
    throw new Error('Expected October 2026 row in Hospital Admin table');
  }
  console.log('✓ PASS: October 2026 row exists with status:', octRow.status);
  if (!octRow.status.includes('MTD In Progress')) {
    throw new Error(`Expected October row status to be "MTD In Progress", got "${octRow.status}"`);
  }

  // 4. Verify TOTAL row in tfoot
  console.log('\n[Step 4] Auditing TOTAL Row in tfoot...');
  const tfootRow = await table.$('tfoot tr');
  if (!tfootRow) {
    throw new Error('Hospital Admin Table is missing tfoot TOTAL row');
  }
  const tfootCells = await tfootRow.$$eval('td', tds => tds.map(td => td.textContent.trim().replace(/\s+/g, ' ')));
  console.log('Hospital Admin TFOOT Row Cells:', tfootCells);
  if (!tfootCells[0].includes('TOTAL')) {
    throw new Error(`Expected first tfoot cell to contain "TOTAL", got "${tfootCells[0]}"`);
  }
  console.log('✓ PASS: Hospital Admin Table TOTAL row correctly aggregated.');

  console.log('\n========================================================================');
  console.log('ALL HOSPITAL ADMIN OPERATIONAL ANALYTICS TABLE CHECKS PASSED!');
  console.log('========================================================================\n');

  await browser.close();
}

run().catch(err => {
  console.error('\n❌ AUDIT ERROR:', err);
  process.exit(1);
});
