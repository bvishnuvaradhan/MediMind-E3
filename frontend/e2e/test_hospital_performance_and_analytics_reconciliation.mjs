import { chromium } from 'playwright';
import { getRelativeDateRange, STANDARDIZED_ANALYTICS_PERIODS } from '../src/utils/dateUtils.js';

async function run() {
  console.log('======================================================================');
  console.log('STARTING COMPREHENSIVE HOSPITAL PERFORMANCE & AI ANALYTICS AUDIT (E2E)');
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
    console.log('--- 2. Testing Platform Owner - Hospital Performance Comparison View ---');
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

    // Step 4: Verify Table 1 (Hospital Network Facilities - Exactly 5 Columns)
    console.log('[Step 4] Verifying Table 1 (Hospital Network Facilities, Exactly 5 Columns)...');
    const tables = await page.$$('table.data-table');
    if (tables.length < 2) {
      throw new Error(`Expected at least 2 comparison tables, found ${tables.length}`);
    }

    const table1Headers = await tables[0].$$eval('thead th', (ths) =>
      ths.map((th) => th.textContent.trim())
    );
    console.log('Table 1 Rendered Headers:', table1Headers);

    const expectedTable1Headers = [
      'Hospital Network Facility',
      'Location',
      'Medical Doctors',
      'Departments',
      'Network Status',
    ];

    if (table1Headers.length !== 5) {
      throw new Error(`Expected exactly 5 headers in Table 1, found ${table1Headers.length}: ${JSON.stringify(table1Headers)}`);
    }

    for (let i = 0; i < expectedTable1Headers.length; i++) {
      if (table1Headers[i].toLowerCase() !== expectedTable1Headers[i].toLowerCase()) {
        throw new Error(`Table 1 Header mismatch at column ${i + 1}: expected "${expectedTable1Headers[i]}", got "${table1Headers[i]}"`);
      }
    }

    const t1HasBedUtilization = table1Headers.some((h) => h.toLowerCase().includes('bed utilization'));
    const t1HasPatientSatisfaction = table1Headers.some((h) => h.toLowerCase().includes('patient satisfaction'));
    if (t1HasBedUtilization || t1HasPatientSatisfaction) {
      throw new Error(`Table 1 still contains Bed Utilization or Patient Satisfaction!`);
    }
    console.log('✓ PASS: Table 1 contains exactly 5 columns. Bed Utilization and Patient Satisfaction are cleanly excised.');

    // Step 5: Verify Table 2 (Hospital Operational Comparison - Exactly 7 Columns)
    console.log('[Step 5] Verifying Table 2 (Hospital Operational Comparison, Exactly 7 Columns)...');
    const table2Headers = await tables[1].$$eval('thead th', (ths) =>
      ths.map((th) => th.textContent.trim())
    );
    console.log('Table 2 Rendered Headers:', table2Headers);

    const expectedTable2Headers = [
      'Hospital Network Facility',
      'Total Bookings',
      'Completed Consultations',
      'Completion Rate',
      'Cancelled Bookings',
      'No-Show Rate',
      'AI Triage Runs',
    ];

    if (table2Headers.length !== 7) {
      throw new Error(`Expected exactly 7 headers in Table 2, found ${table2Headers.length}: ${JSON.stringify(table2Headers)}`);
    }

    for (let i = 0; i < expectedTable2Headers.length; i++) {
      if (table2Headers[i].toLowerCase() !== expectedTable2Headers[i].toLowerCase()) {
        throw new Error(`Table 2 Header mismatch at column ${i + 1}: expected "${expectedTable2Headers[i]}", got "${table2Headers[i]}"`);
      }
    }
    console.log('✓ PASS: Table 2 (Hospital Operational Comparison) contains exactly 7 columns in strict required order.');

    // Step 6: Verify Three Dedicated Separate Line Charts
    console.log('[Step 6] Verifying Three Dedicated Monthly Line Charts...');
    const graph1Title = await page.isVisible('h3:has-text("Intake Bookings by Hospital")');
    const graph2Title = await page.isVisible('h3:has-text("Appointments Served by Hospital")');
    const graph3Title = await page.isVisible('h3:has-text("Clinical AI Runs by Hospital")');

    if (!graph1Title) {
      throw new Error('Graph 1: "Intake Bookings by Hospital" is missing!');
    }
    if (!graph2Title) {
      throw new Error('Graph 2: "Appointments Served by Hospital" is missing!');
    }
    if (!graph3Title) {
      throw new Error('Graph 3: "Clinical AI Runs by Hospital" is missing!');
    }
    console.log('✓ PASS: All 3 dedicated graph titles rendered (Intake Bookings, Appointments Served, Clinical AI Runs).');

    // Verify SVG elements and legends
    const svgLineCount = await page.$$eval('.table-card svg path', (paths) => paths.length);
    const svgCircleCount = await page.$$eval('.table-card svg circle', (circles) => circles.length);
    console.log(`SVG line chart elements rendered: ${svgLineCount} line paths, ${svgCircleCount} data circles`);
    if (svgLineCount === 0 || svgCircleCount === 0) {
      throw new Error('Zero SVG line chart elements found in graphs!');
    }

    const pageText = await page.textContent('.hospital-performance-view');
    const hasHarborviewInLegend = pageText.includes('Harborview Medical Centre') || pageText.includes('Harborview');
    const hasAarogyamInLegend = pageText.includes('Aarogyam Multispeciality') || pageText.includes('Aarogyam');
    const hasNexoraInLegend = pageText.includes('Nexora Advanced Care') || pageText.includes('Nexora');
    if (!hasHarborviewInLegend || !hasAarogyamInLegend || !hasNexoraInLegend) {
      throw new Error('Hospital legends missing from line charts!');
    }
    console.log('✓ PASS: SVG monthly trend line chart visualizations active in all 3 graphs with full legends.');

    // Step 7: Test Period Switching in Chairman View
    console.log('[Step 7] Testing Date Range Selector change to "This Quarter"...');
    await page.selectOption('select[aria-label="Standardized Date Range Selector"]', 'This Quarter');
    await page.waitForTimeout(1000);

    console.log('Testing Date Range Selector change to "Previous Quarter"...');
    await page.selectOption('select[aria-label="Standardized Date Range Selector"]', 'Previous Quarter');
    await page.waitForTimeout(1000);

    console.log('Testing Date Range Selector change to "Last 3 Months"...');
    await page.selectOption('select[aria-label="Standardized Date Range Selector"]', 'Last 3 Months');
    await page.waitForTimeout(1000);
    console.log('✓ PASS: Platform Owner successfully switched through This Quarter, Previous Quarter, and Last 3 Months.');

    // -----------------------------------------------------------------------
    // PART B: CHAIRMAN - AI ANALYTICS VIEW AUDIT
    // -----------------------------------------------------------------------
    console.log('\n--- 3. Testing Platform Owner - AI Diagnostic Analytics View ---');
    console.log('[Step 8] Navigating to AI Diagnostic Analytics view...');
    const aiNavBtn = await page.$('button:has-text("AI Analytics"), button:has-text("Diagnostic AI"), a:has-text("AI Analytics")');
    if (aiNavBtn) {
      await aiNavBtn.click();
    } else {
      const allBtns = await page.$$('.chair-nav-item, nav button, aside button');
      for (const btn of allBtns) {
        const text = await btn.innerText();
        if (text.includes('AI') && (text.includes('Analytics') || text.includes('Diagnostic'))) {
          await btn.click();
          break;
        }
      }
    }
    await page.waitForSelector('.stats-grid', { timeout: 10000 });
    console.log('✓ AI Diagnostic Analytics view loaded');

    // Step 9: Verify "100% Appointment Linked" is completely absent
    console.log('[Step 9] Verifying "100% Appointment Linked" is completely absent from AI Analytics...');
    const aiViewText = await page.textContent('body');
    if (aiViewText.includes('100% Appointment Linked')) {
      throw new Error('Misleading "100% Appointment Linked" badge still present in AI Diagnostic Analytics!');
    }
    console.log('✓ PASS: Misleading "100% Appointment Linked" badge successfully eliminated.');

    // Verify 4 AI modules are rendered
    const hasFracture = aiViewText.includes('Fracture Detection (CNN)') || aiViewText.includes('Fracture Detection');
    const hasDiabetes = aiViewText.includes('Diabetes Risk (ML)') || aiViewText.includes('Diabetes Risk');
    const hasHeart = aiViewText.includes('Heart Disease Risk (ML)') || aiViewText.includes('Heart Disease');
    const hasGeneral = aiViewText.includes('General Health (NLP)') || aiViewText.includes('General Health');
    if (!hasFracture || !hasDiabetes || !hasHeart || !hasGeneral) {
      throw new Error(`One or more of the 4 clinical AI modules is missing: fracture=${hasFracture}, diabetes=${hasDiabetes}, heart=${hasHeart}, general=${hasGeneral}`);
    }
    console.log('✓ PASS: All 4 clinical AI modules (Fracture CNN, Diabetes ML, Heart ML, General Health NLP) accurately attributed and displayed.');

    await chairContext.close();

    // -----------------------------------------------------------------------
    // PART C: HOSPITAL ADMIN - HOSPITAL OPERATIONAL ANALYTICS VIEW
    // -----------------------------------------------------------------------
    console.log('\n--- 4. Testing Hospital Admin - Hospital Operational Analytics ---');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    console.log('[Step 10] Logging in as Hospital Admin (admin@aarogyam.hospital)...');
    await adminPage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('input[type="email"]', { timeout: 15000 });
    await adminPage.fill('input[type="email"]', 'admin@aarogyam.hospital');
    await adminPage.fill('input[type="password"]', 'Admin#2026$01!Dev');
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForSelector('.ha-shell, .hadmin-layout, nav', { timeout: 15000 });
    console.log('✓ Successfully authenticated into Hospital Admin Workspace');

    // Navigate to Analytics view
    console.log('[Step 11] Navigating to Hospital Operational Analytics...');
    const analyticsNavBtn = await adminPage.$('.ha-nav-item:has-text("Analytics"), nav button:has-text("Analytics"), button:has-text("Hospital Analytics")');
    if (analyticsNavBtn) {
      await analyticsNavBtn.click();
      await adminPage.waitForTimeout(800);
    }

    // Verify all 8 filter pills are present
    console.log('[Step 12] Verifying 8 standardized operational period pills in strict order...');
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

    // Step 13: Verify 5 Responsive KPI Cards (including Clinical AI Runs)
    console.log('[Step 13] Verifying 5 responsive KPI cards including Clinical AI Runs...');
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

    // Step 14: Verify Removed Sections are completely absent from DOM
    console.log('[Step 14] Verifying unwanted sections are completely absent from DOM...');
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

    await adminContext.close();

    console.log('\n======================================================================');
    console.log('ALL COMPREHENSIVE HOSPITAL PERFORMANCE & AI ANALYTICS AUDIT CHECKS PASSED!');
    console.log('======================================================================');
  } catch (err) {
    console.error('\n❌ AUDIT FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
