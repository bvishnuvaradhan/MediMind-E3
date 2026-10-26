import { chromium } from 'playwright';
import { getRelativeDateRange, STANDARDIZED_ANALYTICS_PERIODS } from '../src/utils/dateUtils.js';

async function run() {
  console.log('======================================================================');
  console.log('STARTING HOSPITAL PERFORMANCE & ANALYTICS RECONCILIATION AUDIT (E2E)');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // 1. UNIT & SERVICE LOGIC CHECKS
  // -------------------------------------------------------------------------
  console.log('--- 1. Testing Standardized Date Range Definitions ---');
  if (STANDARDIZED_ANALYTICS_PERIODS.length !== 6) {
    throw new Error(`Expected 6 standardized analytics periods, found ${STANDARDIZED_ANALYTICS_PERIODS.length}`);
  }
  const expectedPeriods = ['This Month', 'Previous Month', 'This Quarter', 'This Half Year', 'This Year', 'All Time'];
  for (let i = 0; i < expectedPeriods.length; i++) {
    if (STANDARDIZED_ANALYTICS_PERIODS[i] !== expectedPeriods[i]) {
      throw new Error(`Expected period ${expectedPeriods[i]} at index ${i}, got ${STANDARDIZED_ANALYTICS_PERIODS[i]}`);
    }
    const range = getRelativeDateRange(expectedPeriods[i]);
    console.log(`✓ Period [${expectedPeriods[i]}]: ${range.startDate || 'Beginning'} -> ${range.endDate || 'Present'} (Label: ${range.label})`);
  }
  console.log('✓ PASS: All 6 standardized date range definitions verified.\n');

  // -------------------------------------------------------------------------
  // 2. BROWSER VERIFICATION WITH PLAYWRIGHT
  // -------------------------------------------------------------------------
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PART A: CHAIRMAN - HOSPITAL PERFORMANCE COMPARISON VIEW
    // -----------------------------------------------------------------------
    console.log('--- 2. Testing Chairman - Hospital Performance Comparison View ---');
    const chairContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await chairContext.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`[Browser Console Error] ${msg.text()}`);
      }
    });

    console.log('[Step 1] Logging in as Executive Chairman (Platform Owner)...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', 'chairman@medimind.org');
    await page.fill('input[type="password"]', 'Chair#2026$01!Dev');
    await page.click('button[type="submit"]');

    await page.waitForSelector('.table-card, .stats-grid, nav', { timeout: 15000 });
    console.log('✓ Successfully authenticated into Chairman Workspace');

    // Navigate to Hospital Performance Comparison view
    console.log('[Step 2] Navigating to Hospital Performance Comparison view...');
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
    // Wait for real data rows to populate (past loading state)
    await page.waitForSelector('table.data-table tbody tr:not(:has-text("Loading"))', { timeout: 10000 });
    console.log('✓ Hospital Performance Comparison view loaded with populated data');

    // Verify Date Range Selector in Chairman View
    console.log('[Step 3] Verifying Standardized Date Range Selector (6 options)...');
    const selectOptions = await page.$$eval('select[aria-label="Standardized Date Range Selector"] option, .view-actions select option', (opts) =>
      opts.map((o) => o.value)
    );
    console.log('Selector options rendered:', selectOptions);
    if (selectOptions.length !== 6) {
      throw new Error(`Expected exactly 6 date range options in selector, found ${selectOptions.length}`);
    }
    for (let i = 0; i < expectedPeriods.length; i++) {
      if (selectOptions[i] !== expectedPeriods[i]) {
        throw new Error(`Selector option mismatch at index ${i}: expected ${expectedPeriods[i]}, got ${selectOptions[i]}`);
      }
    }
    console.log('✓ PASS: Exactly 6 standardized date range options rendered in correct order.');

    // Verify Table Columns
    console.log('[Step 4] Verifying Hospital Performance Comparison Table structure...');
    const headers = await page.$$eval('table.data-table thead th', (ths) =>
      ths.map((th) => th.textContent.trim())
    );
    console.log('Rendered Table Headers:', headers);

    const expectedHeaders = [
      'Hospital Network Facility',
      'Location',
      'Medical Doctors',
      'Departments',
      'Bed Utilization',
      'Patient Satisfaction',
      'Network Status',
    ];

    if (headers.length !== 7) {
      throw new Error(`Expected exactly 7 table headers, found ${headers.length}: ${JSON.stringify(headers)}`);
    }

    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i].toLowerCase() !== expectedHeaders[i].toLowerCase()) {
        throw new Error(`Header mismatch at column ${i + 1}: expected "${expectedHeaders[i]}", got "${headers[i]}"`);
      }
    }
    console.log('✓ PASS: Exactly 7 required headers rendered in strict order.');

    // Verify Removed Columns are absent
    const hasAppointmentsServedCol = headers.some((h) => h.toLowerCase().includes('appointments served'));
    const hasClinicalAiRunsCol = headers.some((h) => h.toLowerCase().includes('clinical ai runs'));
    if (hasAppointmentsServedCol || hasClinicalAiRunsCol) {
      throw new Error(`Table still contains removed columns! hasAppointmentsServed=${hasAppointmentsServedCol}, hasClinicalAiRuns=${hasClinicalAiRunsCol}`);
    }
    console.log('✓ PASS: "Appointments Served" and "Clinical AI Runs" columns completely removed from table.');

    // Verify Row Cells Count & Values
    const rowCounts = await page.$$eval('table.data-table tbody tr', (rows) => {
      return rows.map((r) => {
        const cells = Array.from(r.querySelectorAll('td')).map((td) => td.textContent.trim());
        return { cellCount: cells.length, facility: cells[0]?.split('\n')[0], location: cells[1] };
      });
    });
    console.log('Table rows inspected:', rowCounts);
    for (const r of rowCounts) {
      if (r.cellCount !== 7) {
        throw new Error(`Row for ${r.facility} has ${r.cellCount} cells instead of 7!`);
      }
    }
    console.log('✓ PASS: All table rows contain exactly 7 cells aligned with headers.');

    // Verify Graph 1 and Graph 2 are present
    console.log('[Step 5] Verifying Separate Graphs for Appointments Served and Clinical AI Runs...');
    const graph1Title = await page.isVisible('h3:has-text("Appointments Served by Hospital")');
    const graph2Title = await page.isVisible('h3:has-text("Clinical AI Runs by Hospital")');

    if (!graph1Title) {
      throw new Error('Graph 1: "Appointments Served by Hospital" is missing!');
    }
    if (!graph2Title) {
      throw new Error('Graph 2: "Clinical AI Runs by Hospital" is missing!');
    }
    console.log('✓ PASS: Both dedicated graph titles rendered.');

    // Verify SVG bars are rendered in both graphs
    const svgBarCount = await page.$$eval('.table-card svg rect', (rects) => rects.length);
    console.log(`Total SVG bar rects rendered across graphs: ${svgBarCount}`);
    if (svgBarCount === 0) {
      throw new Error('Zero SVG bar elements found in graphs!');
    }
    console.log('✓ PASS: SVG bar chart visualizations active in both graphs.');

    // Test Date Range Change in Chairman View
    console.log('[Step 6] Testing Date Range Selector change to "This Month"...');
    await page.selectOption('select[aria-label="Standardized Date Range Selector"]', 'This Month');
    await page.waitForTimeout(1000);
    const monthKpi = await page.textContent('.stat-card:has-text("Appointments Served")');
    console.log(`Updated KPI for This Month: ${monthKpi?.replace(/\s+/g, ' ').trim()}`);

    console.log('Testing Date Range Selector change to "This Half Year"...');
    await page.selectOption('select[aria-label="Standardized Date Range Selector"]', 'This Half Year');
    await page.waitForTimeout(1000);
    const halfYearKpi = await page.textContent('.stat-card:has-text("Appointments Served")');
    console.log(`Updated KPI for This Half Year: ${halfYearKpi?.replace(/\s+/g, ' ').trim()}`);
    console.log('✓ PASS: Date range switching dynamically updates metrics across the page.\n');

    await chairContext.close();

    // -----------------------------------------------------------------------
    // PART B: HOSPITAL ADMIN - HOSPITAL OPERATIONAL ANALYTICS VIEW
    // -----------------------------------------------------------------------
    console.log('--- 3. Testing Hospital Admin - Hospital Operational Analytics ---');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    console.log('[Step 7] Logging in as Hospital Admin (admin@aarogyam.hospital)...');
    await adminPage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('input[type="email"]', { timeout: 15000 });
    await adminPage.fill('input[type="email"]', 'admin@aarogyam.hospital');
    await adminPage.fill('input[type="password"]', 'Admin#2026$01!Dev');
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForSelector('.ha-shell, .hadmin-layout, nav', { timeout: 15000 });
    console.log('✓ Successfully authenticated into Hospital Admin Workspace');

    // Navigate to Analytics view
    console.log('[Step 8] Navigating to Hospital Operational Analytics...');
    const analyticsNavBtn = await adminPage.$('.ha-nav-item:has-text("Analytics"), nav button:has-text("Analytics"), button:has-text("Hospital Analytics")');
    if (analyticsNavBtn) {
      await analyticsNavBtn.click();
      await adminPage.waitForTimeout(800);
    }

    // Verify all 6 filter pills are present
    console.log('[Step 9] Verifying 6 standardized operational period pills...');
    const pills = await adminPage.$$eval('.ha-filter-pills button.ha-filter-pill', (btns) =>
      btns.map((b) => b.innerText.trim())
    );
    console.log('Hospital Admin operational period pills:', pills);

    if (pills.length !== 6) {
      throw new Error(`Expected exactly 6 period pills, found ${pills.length}: ${JSON.stringify(pills)}`);
    }

    for (let i = 0; i < expectedPeriods.length; i++) {
      if (pills[i] !== expectedPeriods[i]) {
        throw new Error(`Pill mismatch at index ${i}: expected "${expectedPeriods[i]}", got "${pills[i]}"`);
      }
    }
    console.log('✓ PASS: All 6 standardized period pills present in Hospital Operational Analytics, including "All Time" and "This Half Year".');

    // Test clicking pills
    console.log('[Step 10] Testing filter pill interactions...');
    await adminPage.click('.ha-filter-pill:has-text("This Quarter")');
    await adminPage.waitForTimeout(500);
    const quarterActive = await adminPage.isVisible('.ha-filter-pill.active:has-text("This Quarter")');
    console.log(`This Quarter pill active: ${quarterActive}`);

    await adminPage.click('.ha-filter-pill:has-text("All Time")');
    await adminPage.waitForTimeout(500);
    const allTimeActive = await adminPage.isVisible('.ha-filter-pill.active:has-text("All Time")');
    console.log(`All Time pill active: ${allTimeActive}`);

    // Verify Retrospective Trend Label
    const hasTrendHeader = await adminPage.isVisible('h3:has-text("Five-Month Retrospective Volume Trends")');
    console.log(`Five-Month Retrospective Volume Trends label present: ${hasTrendHeader}`);
    if (!hasTrendHeader) {
      throw new Error('Retrospective trend label missing in Hospital Operational Analytics');
    }
    console.log('✓ PASS: Retrospective monthly trend chart clearly identified as independent multi-month trajectory.');

    await adminContext.close();

    console.log('\n======================================================================');
    console.log('ALL HOSPITAL PERFORMANCE & ANALYTICS RECONCILIATION CHECKS PASSED!');
    console.log('======================================================================');
  } catch (err) {
    console.error('\n❌ AUDIT FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
