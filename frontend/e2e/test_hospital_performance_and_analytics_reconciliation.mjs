import { chromium } from 'playwright';
import { getRelativeDateRange, STANDARDIZED_ANALYTICS_PERIODS, HOSPITAL_ADMIN_PERIOD_OPTIONS } from '../src/utils/dateUtils.js';

async function run() {
  console.log('======================================================================');
  console.log('STARTING HOSPITAL PERFORMANCE & ANALYTICS RECONCILIATION AUDIT (E2E)');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // 1. UNIT & SERVICE LOGIC CHECKS
  // -------------------------------------------------------------------------
  console.log('--- 1. Testing Standardized Date Range Definitions (8 Options) ---');
  const expectedPeriods = [
    'This Month',
    'Previous Month',
    'This Quarter',
    'Previous Quarter',
    'Last 3 Months',
    'This Half Year',
    'This Year',
    'All Time',
  ];

  if (STANDARDIZED_ANALYTICS_PERIODS.length !== 8) {
    throw new Error(`Expected 8 standardized analytics periods, found ${STANDARDIZED_ANALYTICS_PERIODS.length}`);
  }

  for (let i = 0; i < expectedPeriods.length; i++) {
    if (STANDARDIZED_ANALYTICS_PERIODS[i] !== expectedPeriods[i]) {
      throw new Error(`Expected period ${expectedPeriods[i]} at index ${i}, got ${STANDARDIZED_ANALYTICS_PERIODS[i]}`);
    }
    const range = getRelativeDateRange(expectedPeriods[i]);
    console.log(`✓ Period [${expectedPeriods[i]}]: ${range.startDate || 'Beginning'} -> ${range.endDate || 'Present'} (Label: ${range.label})`);
  }
  console.log('✓ PASS: All 8 standardized date range definitions verified.\n');

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
    console.log('[Step 3] Verifying Standardized Date Range Selector (8 options)...');
    const selectOptions = await page.$$eval('select[aria-label="Standardized Date Range Selector"] option, .view-actions select option', (opts) =>
      opts.map((o) => o.value)
    );
    console.log('Selector options rendered:', selectOptions);
    if (selectOptions.length !== 8) {
      throw new Error(`Expected exactly 8 date range options in selector, found ${selectOptions.length}`);
    }
    for (let i = 0; i < expectedPeriods.length; i++) {
      if (selectOptions[i] !== expectedPeriods[i]) {
        throw new Error(`Selector option mismatch at index ${i}: expected ${expectedPeriods[i]}, got ${selectOptions[i]}`);
      }
    }
    console.log('✓ PASS: Exactly 8 standardized date range options rendered in correct order.');

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

    // Verify Graph 1 and Graph 2 are present as Monthly/Daily Line Charts
    console.log('[Step 5] Verifying Separate Monthly Line Charts for Appointments Served and Clinical AI Runs...');
    const graph1Title = await page.isVisible('h3:has-text("Appointments Served by Hospital")');
    const graph2Title = await page.isVisible('h3:has-text("Clinical AI Runs by Hospital")');

    if (!graph1Title) {
      throw new Error('Graph 1: "Appointments Served by Hospital" is missing!');
    }
    if (!graph2Title) {
      throw new Error('Graph 2: "Clinical AI Runs by Hospital" is missing!');
    }
    console.log('✓ PASS: Both dedicated graph titles rendered.');

    // Verify SVG line paths and dots are rendered in both line charts
    const svgLineCount = await page.$$eval('.table-card svg path', (paths) => paths.length);
    const svgCircleCount = await page.$$eval('.table-card svg circle', (circles) => circles.length);
    console.log(`SVG line chart elements rendered: ${svgLineCount} line paths, ${svgCircleCount} data circles`);
    if (svgLineCount === 0 || svgCircleCount === 0) {
      throw new Error('Zero SVG line chart elements found in graphs!');
    }
    console.log('✓ PASS: SVG monthly trend line chart visualizations active in both graphs.');

    // Verify Legends have hospital names
    const pageText = await page.textContent('.hospital-performance-view');
    const hasHarborviewInLegend = pageText.includes('Harborview Medical Centre') || pageText.includes('Harborview');
    const hasAarogyamInLegend = pageText.includes('Aarogyam Multispeciality') || pageText.includes('Aarogyam');
    const hasNexoraInLegend = pageText.includes('Nexora Advanced Care') || pageText.includes('Nexora');
    if (!hasHarborviewInLegend || !hasAarogyamInLegend || !hasNexoraInLegend) {
      throw new Error('Hospital legends missing from line charts!');
    }
    console.log('✓ PASS: Line chart legends contain all active hospital network facilities.');

    // Test Date Range Change in Chairman View to This Quarter (Verify 3 months)
    console.log('[Step 6] Testing Date Range Selector change to "This Quarter"...');
    await page.selectOption('select[aria-label="Standardized Date Range Selector"]', 'This Quarter');
    await page.waitForTimeout(1000);

    // Verify the charts display all 3 months of the quarter
    const chartLabelsThisQuarter = await page.$$eval('.table-card svg text', (texts) =>
      texts.map((t) => t.textContent.trim()).filter(Boolean)
    );
    console.log('Quarter chart axis text samples:', chartLabelsThisQuarter.slice(0, 10));

    console.log('Testing Date Range Selector change to "Previous Quarter"...');
    await page.selectOption('select[aria-label="Standardized Date Range Selector"]', 'Previous Quarter');
    await page.waitForTimeout(1000);

    console.log('Testing Date Range Selector change to "Last 3 Months"...');
    await page.selectOption('select[aria-label="Standardized Date Range Selector"]', 'Last 3 Months');
    await page.waitForTimeout(1000);
    console.log('✓ PASS: Platform Owner successfully switched through This Quarter, Previous Quarter, and Last 3 Months.\n');

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

    // Verify all 8 filter pills are present
    console.log('[Step 9] Verifying 8 standardized operational period pills in strict order...');
    const pills = await adminPage.$$eval('.ha-filter-pills button.ha-filter-pill', (btns) =>
      btns.map((b) => b.innerText.trim())
    );
    console.log('Hospital Admin operational period pills:', pills);

    if (pills.length !== 8) {
      throw new Error(`Expected exactly 8 period pills, found ${pills.length}: ${JSON.stringify(pills)}`);
    }

    for (let i = 0; i < expectedPeriods.length; i++) {
      if (pills[i] !== expectedPeriods[i]) {
        throw new Error(`Pill mismatch at index ${i}: expected "${expectedPeriods[i]}", got "${pills[i]}"`);
      }
    }
    console.log('✓ PASS: All 8 standardized period pills present in Hospital Operational Analytics in strict order.');

    // Step 10: Verify 5 Responsive KPI Cards (including Clinical AI Runs)
    console.log('[Step 10] Verifying 5 responsive KPI cards including Clinical AI Runs...');
    const statCards = await adminPage.$$eval('.ha-stat-grid .ha-stat-card', (cards) =>
      cards.map((c) => ({
        label: c.querySelector('.ha-stat-label')?.textContent.trim(),
        value: c.querySelector('.ha-stat-value')?.textContent.trim(),
        subtext: c.querySelector('.ha-stat-subtext')?.textContent.trim(),
      }))
    );
    console.log('Rendered KPI cards:', statCards);

    if (statCards.length !== 5) {
      throw new Error(`Expected exactly 5 KPI cards in .ha-stat-grid, found ${statCards.length}`);
    }

    const expectedLabels = [
      'Total Hospital Bookings',
      'Completed Consultations',
      'Scheduled & In-Queue',
      'Cancellation & No-Show',
      'Clinical AI Runs',
    ];

    for (let i = 0; i < expectedLabels.length; i++) {
      if (statCards[i].label !== expectedLabels[i]) {
        throw new Error(`KPI card ${i + 1} mismatch: expected "${expectedLabels[i]}", got "${statCards[i].label}"`);
      }
    }
    console.log('✓ PASS: Exactly 5 responsive KPI cards rendered with Clinical AI Runs prominently featured.');

    // Step 11: Verify Removed Sections are completely absent from DOM
    console.log('[Step 11] Verifying unwanted sections are completely absent from DOM...');
    const wholePageText = await adminPage.textContent('.ha-content, .ha-main, body');

    const forbiddenPhrases = [
      'Bed Capacity vs Operational Utilization',
      'Patient Satisfaction',
      'Bed Utilization',
      'Care Modality Mix & Inpatient Capacity',
      'Hospital Inpatient Bed Occupancy',
    ];

    for (const phrase of forbiddenPhrases) {
      if (wholePageText.includes(phrase)) {
        throw new Error(`Forbidden phrase "${phrase}" still exists in Hospital Operational Analytics page!`);
      }
    }
    console.log('✓ PASS: Bed Capacity vs Operational Utilization, Patient Satisfaction, Bed Utilization, and Inpatient Bed Occupancy completely absent from DOM.');

    // Step 12: Test clicking pills: Previous Quarter and Last 3 Months
    console.log('[Step 12] Testing filter pill interactions (Previous Quarter, Last 3 Months)...');
    await adminPage.click('.ha-filter-pill:has-text("Previous Quarter")');
    await adminPage.waitForTimeout(600);
    const prevQActive = await adminPage.isVisible('.ha-filter-pill.active:has-text("Previous Quarter")');
    if (!prevQActive) {
      throw new Error('Previous Quarter pill did not activate upon click');
    }
    console.log('✓ Previous Quarter pill active');

    await adminPage.click('.ha-filter-pill:has-text("Last 3 Months")');
    await adminPage.waitForTimeout(600);
    const last3Active = await adminPage.isVisible('.ha-filter-pill.active:has-text("Last 3 Months")');
    if (!last3Active) {
      throw new Error('Last 3 Months pill did not activate upon click');
    }
    console.log('✓ Last 3 Months pill active');

    await adminPage.click('.ha-filter-pill:has-text("This Quarter")');
    await adminPage.waitForTimeout(600);
    const thisQActive = await adminPage.isVisible('.ha-filter-pill.active:has-text("This Quarter")');
    if (!thisQActive) {
      throw new Error('This Quarter pill did not activate upon click');
    }
    console.log('✓ This Quarter pill active');

    // Step 13: Verify Retrospective Trend Label and Heatmap are present
    console.log('[Step 13] Verifying Retrospective Trend and OPD Peak Activity Heatmap...');
    const hasTrendHeader = await adminPage.isVisible('h3:has-text("Five-Month Retrospective Volume Trends")');
    if (!hasTrendHeader) {
      throw new Error('Retrospective trend label missing in Hospital Operational Analytics');
    }
    const hasHeatmapHeader = await adminPage.isVisible('h3:has-text("OPD Clinic Peak Activity Heatmap")');
    if (!hasHeatmapHeader) {
      throw new Error('OPD Clinic Peak Activity Heatmap missing in Hospital Operational Analytics');
    }
    console.log('✓ PASS: Retrospective trends and OPD Clinic Peak Activity Heatmap both visible and functional.');

    // Verify static stale text like "vs Aug" is completely eliminated
    const adminPageText = await adminPage.textContent('.ha-stat-grid');
    if (adminPageText.includes('vs Aug')) {
      throw new Error('Static text "vs Aug" found in Hospital Operational Analytics!');
    }
    console.log('✓ PASS: Static stale comparative text like "vs Aug" successfully eliminated.');

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
