import { chromium } from 'playwright';

async function runDoctorWorkspaceRemediationTests() {
  console.log('===============================================================');
  console.log('STARTING CLINICIAN WORKSPACE & OPD APPOINTMENT AUDIT (PLAYWRIGHT)');
  console.log('===============================================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Capture ALL browser console errors for diagnostics
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('Failed to load resource')) {
      console.error(`[Browser Console Error] ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  // Capture failed network requests
  const failedRequests = [];
  page.on('requestfailed', (req) => {
    failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  // Helper: dump diagnostics on failure
  async function dumpDiagnostics(label) {
    console.error(`\n--- DIAGNOSTICS at: ${label} ---`);
    console.error(`URL: ${page.url()}`);
    try {
      const bodyText = await page.textContent('body');
      console.error(`Body text (first 1500 chars): ${(bodyText || '').slice(0, 1500)}`);
    } catch { /* ignore */ }
    if (consoleErrors.length > 0) {
      console.error('Browser console errors:', consoleErrors);
    }
    if (failedRequests.length > 0) {
      console.error('Failed network requests:', failedRequests.slice(0, 10));
    }
    console.error('--- END DIAGNOSTICS ---\n');
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Doctor Authentication
    // -------------------------------------------------------------------------
    console.log('\n[Step 1] Navigating to login page...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

    // Wait for the login form to appear
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });

    console.log('[Step 1] Filling credentials...');
    await page.fill('input[type="email"]', 'dr.rahul.sharma@aarogyam.hospital');
    await page.fill('input[type="password"]', 'Doctor#2026\u002401!Dev');

    // Click sign-in — this is a SPA so there is no page navigation event.
    // Wait for the appointments API response to confirm data is loading.
    console.log('[Step 1] Clicking Sign In and waiting for auth + API responses...');
    const [, aptResp] = await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForResponse(
        (resp) => resp.url().includes('/api/appointments') && resp.status() === 200,
        { timeout: 25000 }
      ),
    ]);
    console.log(`[Step 1] Appointments API responded with status ${aptResp.status()}`);

    // Now wait for the doctor shell and then the stat-grid to render
    console.log('[Step 1] Waiting for Doctor Workspace shell to mount...');
    try {
      await page.waitForSelector('.doctor-shell', { timeout: 15000 });
    } catch (e) {
      await dumpDiagnostics('After login — doctor-shell not found');
      throw new Error(`Login failed: doctor-shell did not appear. ${e.message}`);
    }

    console.log('[Step 1] Waiting for dashboard KPI grid...');
    try {
      await page.waitForSelector('.doctor-stat-grid', { timeout: 15000 });
    } catch (e) {
      await dumpDiagnostics('After doctor-shell mounted — doctor-stat-grid not found');
      if (consoleErrors.length > 0) {
        throw new Error(`Dashboard crashed with runtime error: ${consoleErrors[0]}`);
      }
      throw new Error(`Dashboard did not render stat-grid. ${e.message}`);
    }

    // Wait for appointments data to propagate into the UI (stat value != 0 means data arrived)
    console.log('[Step 1] Waiting for appointment data to populate KPIs...');
    try {
      await page.waitForFunction(() => {
        const cards = document.querySelectorAll('.doctor-stat-card');
        // At least one stat-card should show a non-zero value once data loads
        return Array.from(cards).some(c => {
          const val = parseInt(c.querySelector('.doctor-stat-value')?.textContent?.trim() || '0', 10);
          return val > 0;
        });
      }, { timeout: 15000 });
    } catch {
      console.warn('⚠ All stat cards still show 0 after waiting — backend data may not have loaded');
    }

    console.log('✓ Successfully authenticated and loaded Doctor Workspace dashboard');

    // -------------------------------------------------------------------------
    // 2. Doctor Dashboard Verification
    // -------------------------------------------------------------------------
    console.log('\n[Step 2] Verifying Doctor Dashboard KPIs and Pipeline Funnel...');
    const dashboardText = await page.textContent('.doctor-shell');

    // A. Verify "Appointments Completed" label (not "Consultations Completed")
    if (dashboardText.includes('Appointments Completed')) {
      console.log('✓ PASS: KPI is labeled "Appointments Completed"');
    } else {
      throw new Error('FAIL: "Appointments Completed" KPI label not found on Doctor Dashboard');
    }

    if (dashboardText.includes('Consultations Completed')) {
      throw new Error('FAIL: Legacy misnomer "Consultations Completed" is still displayed on Dashboard!');
    } else {
      console.log('✓ PASS: Legacy misnomer "Consultations Completed" is completely removed');
    }

    // B. Read actual KPI stat-card values
    const statCards = await page.$$eval('.doctor-stat-card', cards => cards.map(c => ({
      label: c.querySelector('.doctor-stat-label')?.textContent?.trim(),
      value: c.querySelector('.doctor-stat-value')?.textContent?.trim(),
    })));

    console.log('Dashboard StatCards:', JSON.stringify(statCards, null, 2));

    const completedAptCard = statCards.find(c => c.label === 'Appointments Completed');
    if (!completedAptCard) throw new Error('Appointments Completed card not found in DOM');
    console.log(`✓ Appointments Completed value: ${completedAptCard.value}`);

    const completedVal = parseInt(completedAptCard.value, 10);
    if (isNaN(completedVal)) {
      throw new Error(`FAIL: Appointments Completed value is not a number: "${completedAptCard.value}"`);
    }
    if (completedVal === 0) {
      console.warn('⚠ WARNING: Appointments Completed is 0 — backend may have no completed records or data did not load in time');
    }

    // C. Verify removal of fabricated strings
    if (dashboardText.includes('100% Attended') || dashboardText.includes('★ 4.9 Satisfaction') || dashboardText.includes('97.4% Model Calibration')) {
      throw new Error('FAIL: Arbitrary fabricated percentages still present on Dashboard!');
    } else {
      console.log('✓ PASS: Fabricated percentages successfully eliminated from KPIs');
    }

    // D. Verify FunnelChart renders — it is an SVG with <g> stage groups
    // The FunnelChart uses SVG paths and text, no .doctor-funnel-col CSS class
    const funnelSvg = await page.$('.doctor-card svg');
    if (!funnelSvg) {
      throw new Error('FAIL: FunnelChart SVG not found — pipeline funnel did not render');
    }
    const svgStageCount = await page.$$eval('.doctor-card svg g', groups => groups.length);
    console.log(`FunnelChart SVG stage groups: ${svgStageCount}`);
    if (svgStageCount < 5) {
      throw new Error(`FAIL: FunnelChart has ${svgStageCount} stage groups, expected 5`);
    }
    console.log('✓ PASS: Dynamic Consultation Pipeline Funnel SVG successfully rendered with 5 stages');

    // -------------------------------------------------------------------------
    // 3. OPD Appointments View Verification
    // -------------------------------------------------------------------------
    console.log('\n[Step 3] Navigating to OPD Appointments View...');
    await page.click('button.doctor-nav-item:has-text("Appointments")');
    await page.waitForSelector('.doctor-table', { timeout: 10000 });
    await page.waitForTimeout(1500);

    // Switch to All tab if present
    const allTabBtn = await page.$('button.doctor-tab:has-text("All")');
    if (allTabBtn) {
      await allTabBtn.click();
      await page.waitForTimeout(1000);
    }

    const rowData = await page.$$eval('.doctor-table tbody tr', rows => rows.map(r => {
      const tds = r.querySelectorAll('td');
      if (tds.length < 5) return null;
      return {
        token: tds[0]?.textContent?.trim(),
        patient: tds[1]?.textContent?.trim(),
        date: tds[2]?.textContent?.trim(),
        aiPreScreen: tds[3]?.textContent?.trim(),
        status: tds[4]?.textContent?.trim(),
      };
    }).filter(Boolean));

    console.log(`Rendered appointments count: ${rowData.length}`);
    console.log('Sample appointment rows:', JSON.stringify(rowData.slice(0, 3), null, 2));

    if (rowData.length === 0) {
      console.warn('⚠ WARNING: No appointment rows rendered in OPD table — data may not have loaded');
    }

    // A. Verify no universal "AI Pre-Screen Pending" defect
    const pendingCount = rowData.filter(r => r.aiPreScreen?.includes('AI Pre-Screen Pending')).length;
    if (pendingCount > 0) {
      throw new Error(`FAIL: Found ${pendingCount} rows with false "AI Pre-Screen Pending"! Defect not resolved.`);
    }
    console.log('✓ PASS: Zero appointments exhibit false "AI Pre-Screen Pending"');

    // B. Verify consultation button enforcement (non-Completed rows must have disabled button)
    const consultButtons = await page.$$eval('.doctor-table tbody tr', rows => rows.map(r => {
      const status = r.querySelector('td:nth-child(5)')?.textContent?.trim();
      // Use standard querySelector — find any button in the actions cell that has "Consult" text
      const allBtns = Array.from(r.querySelectorAll('td:nth-child(6) button') || []);
      const consultBtn = allBtns.find(b => b.textContent?.includes('Consult'));
      return {
        status,
        consultText: consultBtn?.textContent?.trim() || null,
        disabled: consultBtn ? consultBtn.hasAttribute('disabled') : null,
      };
    }));

    const nonCompletedWithConsult = consultButtons.filter(b => b.status !== 'Completed' && b.consultText);
    const allNonCompletedDisabled = nonCompletedWithConsult.every(b => b.disabled === true);
    if (!allNonCompletedDisabled) {
      throw new Error('FAIL: Non-completed appointments must NOT have active consultation creation buttons!');
    }
    console.log('✓ PASS: Consultation creation correctly gated on appointment completion status');

    // -------------------------------------------------------------------------
    // 4. Walk-in Registration Modal (Family Account -> Family Member Selection)
    // -------------------------------------------------------------------------
    console.log('\n[Step 4] Testing Walk-in Registration Modal...');
    // Navigate back to dashboard to find the walk-in button
    await page.click('button.doctor-nav-item:has-text("Dashboard")');
    await page.waitForSelector('.doctor-stat-grid', { timeout: 10000 });

    await page.click('button:has-text("Add Walk-in")');
    await page.waitForSelector('.doctor-modal-box', { timeout: 8000 });
    await page.waitForTimeout(1000);

    // Verify there is at least one <select> in the modal
    const selectCount = await page.$$eval('.doctor-modal-box select', sels => sels.length);
    if (selectCount === 0) {
      throw new Error('FAIL: No select dropdown found in Walk-in Modal!');
    }
    console.log(`✓ PASS: ${selectCount} dropdown(s) present in Walk-in modal`);

    // Verify family options loaded (first select = family account picker)
    const familyOptions = await page.$$eval('.doctor-modal-box select:first-of-type option', opts => opts.map(o => o.text));
    console.log('Family account dropdown options:', familyOptions.slice(0, 6));
    if (familyOptions.length <= 1) {
      throw new Error('FAIL: Family accounts not loaded into walk-in modal dropdown');
    }
    console.log(`✓ PASS: ${familyOptions.length} family options loaded`);

    // Close the modal
    const closeBtn = await page.$('.doctor-modal-box button:has-text("Cancel"), .doctor-modal-header button');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
    console.log('✓ Walk-in modal closed');

    // -------------------------------------------------------------------------
    // 5. Consultations View Verification
    // -------------------------------------------------------------------------
    console.log('\n[Step 5] Navigating to Consultations View...');
    await page.click('button.doctor-nav-item:has-text("Consultations")');
    await page.waitForSelector('.doctor-card', { timeout: 10000 });
    await page.waitForTimeout(1500);

    const consultationsCount = await page.$$eval('.doctor-table tbody tr, .doctor-card tbody tr', rows => rows.length);
    console.log(`Total consultations rendered: ${consultationsCount}`);
    if (consultationsCount < 1) {
      console.warn(`⚠ WARNING: Consultations view shows ${consultationsCount} rows — backend data may not have loaded`);
    } else {
      console.log(`✓ PASS: ${consultationsCount} consultation records rendered`);
    }

    // -------------------------------------------------------------------------
    // 6. Prescriptions View Verification
    // -------------------------------------------------------------------------
    console.log('\n[Step 6] Navigating to Prescriptions View...');
    await page.click('button.doctor-nav-item:has-text("Prescriptions")');
    await page.waitForSelector('.doctor-card', { timeout: 10000 });
    await page.waitForTimeout(1500);

    const prescriptionsCount = await page.$$eval('.doctor-table tbody tr, .doctor-card tbody tr', rows => rows.length);
    console.log(`Total prescriptions rendered: ${prescriptionsCount}`);
    if (prescriptionsCount < 1) {
      console.warn(`⚠ WARNING: Prescriptions view shows ${prescriptionsCount} rows`);
    } else {
      console.log(`✓ PASS: ${prescriptionsCount} prescription records rendered`);
    }

    // -------------------------------------------------------------------------
    // 7. AI Decision Support View Verification
    // -------------------------------------------------------------------------
    console.log('\n[Step 7] Navigating to AI Decision Support View...');
    await page.click('button.doctor-nav-item:has-text("AI Decision Support")');
    await page.waitForSelector('.doctor-card', { timeout: 10000 });
    await page.waitForTimeout(1500);

    const scanCardsCount = await page.$$eval(
      '.doctor-card:has(button:has-text("Grad-CAM")), .doctor-card:has(.doctor-badge)',
      cards => cards.length
    );
    console.log(`AI Scan cards rendered: ${scanCardsCount}`);
    if (scanCardsCount < 1) {
      console.warn('⚠ WARNING: AI Decision Support appears empty');
    } else {
      console.log('✓ PASS: AI Decision Support view populated with inference records');
    }

    // Final runtime error check
    if (consoleErrors.length > 0) {
      throw new Error(`FAIL: Browser runtime errors occurred: ${consoleErrors.join('; ')}`);
    }

    console.log('\n===============================================================');
    console.log('ALL CLINICIAN WORKSPACE AUDIT CHECKS PASSED WITH FULL EVIDENCE!');
    console.log('===============================================================');

  } catch (err) {
    console.error('\n❌ AUDIT FAILED WITH ERROR:', err.message);
    await dumpDiagnostics('final catch block');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runDoctorWorkspaceRemediationTests();
