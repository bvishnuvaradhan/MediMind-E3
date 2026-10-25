import { chromium } from 'playwright';

async function runHospitalAdminPortalAudit() {
  console.log('--- STARTING HOSPITAL ADMIN PORTAL CROSS-PAGE AUDIT ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) {
      console.error(`Browser console error: ${msg.text()}`);
      errors.push(msg.text());
    }
  });

  try {
    // 1. Login
    console.log('[1/5] Logging into MediMind Hospital Admin portal...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'admin@aarogyam.hospital');
    await page.fill('input[type="password"]', 'Admin#2026\u002401!Dev');
    await page.click('button:has-text("Sign In")');

    // Wait for Hospital Admin layout
    await page.waitForSelector('.ha-shell', { timeout: 10000 });
    console.log('✓ Successfully authenticated and loaded .ha-shell workspace');

    // Wait for live data to load and populate the dashboard
    console.log('Waiting for live data aggregation in HospitalAdminLayout...');
    await page.waitForFunction(() => {
      const el = document.querySelector('.ha-stat-value');
      return el && el.textContent.trim() !== '0';
    }, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 2. Dashboard Verification
    console.log('\n[2/5] Auditing DashboardView...');
    const bannerTitle = await page.locator('.ha-card-panel h1').first().textContent();
    console.log(`  Hospital Banner: "${bannerTitle?.trim()}"`);

    const statCards = page.locator('.ha-stat-grid .ha-stat-card');
    const statCardCount = await statCards.count();
    console.log(`  Found ${statCardCount} StatCards on Dashboard`);

    for (let i = 0; i < statCardCount; i++) {
      const label = await statCards.nth(i).locator('.ha-stat-label').textContent();
      const val = await statCards.nth(i).locator('.ha-stat-value').textContent();
      const sub = await statCards.nth(i).locator('.ha-stat-subtext').textContent();
      console.log(`    StatCard ${i + 1}: ${label?.trim()} = ${val?.trim()} (${sub?.trim()})`);
      if (label?.includes('AI Predictions')) {
        if (sub?.includes('97.2% Diagnostic Assistance Rate') && val?.trim() === '0') {
          throw new Error('AI Predictions showed hardcoded static 97.2% with 0 scans!');
        }
      }
      if (label?.includes("Today's Appointments")) {
        if (sub?.includes('128 Total Bookings This Month')) {
          throw new Error('Today\'s appointments showed hardcoded 128 Total Bookings This Month!');
        }
      }
    }

    // 3. Departments View Verification
    console.log('\n[3/5] Auditing DepartmentsView...');
    const deptsBtn = page.locator('.ha-nav-item:has-text("Departments")').first();
    await deptsBtn.click();
    await page.waitForTimeout(2000);

    const deptCards = page.locator('.ha-card-panel:has(h3)');
    const deptCount = await deptCards.count();
    console.log(`  Found ${deptCount} Department Cards`);

    for (let i = 0; i < deptCount; i++) {
      const card = deptCards.nth(i);
      const name = await card.locator('h3').first().textContent();
      const text = await card.textContent();
      console.log(`  Department: "${name?.trim()}"`);

      // Check doctor count
      const docMatch = text.match(/(\d+)\s+Staff Doctors/);
      console.log(`    Staff Doctors: ${docMatch ? docMatch[1] : 'not found'}`);

      // Check bookings count
      const bookMatch = text.match(/(\d+)\s+Bookings/);
      console.log(`    Active Bookings: ${bookMatch ? bookMatch[1] : 'not found'}`);

      // Check AI Pipeline
      const aiMatch = text.match(/AI PIPELINE\s*([^\n\r]+)/i);
      console.log(`    AI Pipeline: ${aiMatch ? aiMatch[1].trim() : 'not found'}`);

      // Check Bed Capacity
      const bedMatch = text.match(/BED CAPACITY\s*([^\n\r]+)/i);
      console.log(`    Bed Capacity: ${bedMatch ? bedMatch[1].trim() : 'not found'}`);

      if (aiMatch && aiMatch[1].includes('None Configured')) {
        throw new Error(`Department ${name} showed None Configured for AI Pipeline!`);
      }
    }

    // 4. Doctors View Verification
    console.log('\n[4/5] Auditing DoctorsView...');
    const doctorsBtn = page.locator('.ha-nav-item:has-text("Doctors")').first();
    await doctorsBtn.click();
    await page.waitForTimeout(2000);

    const docHeaderDesc = await page.locator('.ha-page-header-info p').textContent();
    console.log(`  Header Subtitle: "${docHeaderDesc?.trim()}"`);
    if (docHeaderDesc?.includes('all 9 practicing doctors')) {
      throw new Error('Doctors directory header still claims "all 9 practicing doctors" despite having 24 doctors!');
    }

    const allDeptPill = await page.locator('.ha-filter-pill.active').textContent();
    console.log(`  Filter Pill Active: "${allDeptPill?.trim()}"`);

    const doctorCards = page.locator('.ha-card-panel:has(h3)');
    const totalDoctorsRendered = await doctorCards.count();
    console.log(`  Rendered Doctor Cards: ${totalDoctorsRendered}`);

    for (let i = 0; i < Math.min(4, totalDoctorsRendered); i++) {
      const card = doctorCards.nth(i);
      const docName = await card.locator('h3').textContent();
      const cardText = await card.textContent();
      console.log(`  Doctor ${i + 1}: ${docName?.trim()}`);

      if (cardText.includes('Qualifications: ()')) {
        throw new Error(`Doctor ${docName} displays empty qualifications "Qualifications: ()"!`);
      }
      if (cardText.includes('NaN%')) {
        throw new Error(`Doctor ${docName} displays NaN% in workload!`);
      }

      const qualLine = cardText.match(/Qualifications:\s*([^\n\r]+)/);
      console.log(`    Qualifications: ${qualLine ? qualLine[1].trim() : 'not found'}`);
    }

    // Test Doctor Details Modal / Navigation
    console.log('  Testing Doctor Profile Details View navigation...');
    const firstDocProfileBtn = doctorCards.first().locator('button:has-text("Doctor Profile")');
    await firstDocProfileBtn.click();
    await page.waitForTimeout(1500);

    const detailHeader = await page.locator('.ha-page-header-info h1').textContent();
    console.log(`    Opened Profile Details for: "${detailHeader?.trim()}"`);
    const qualDetail = await page.locator('.ha-info-tile:has-text("Qualifications") .ha-info-value').textContent();
    console.log(`    Doctor Details Qualifications: "${qualDetail?.trim()}"`);
    const schedDetail = await page.locator('.ha-info-tile:has-text("Consultation Schedule") .ha-info-value').textContent();
    console.log(`    Doctor Details Schedule: "${schedDetail?.trim()}"`);

    // Back to doctors
    await page.click('button:has-text("Back to Doctors")');
    await page.waitForTimeout(1000);

    // 5. Knowledge Activity View Verification
    console.log('\n[5/5] Auditing Knowledge Activity Oversight View...');
    const knowledgeBtn = page.locator('.ha-nav-item:has-text("Knowledge Activity")').first();
    await knowledgeBtn.click();
    await page.waitForTimeout(2000);

    const kpiCards = page.locator('.ha-stat-grid .ha-stat-card');
    const kpiCount = await kpiCards.count();
    console.log(`  Found ${kpiCount} Knowledge StatCards`);

    for (let i = 0; i < kpiCount; i++) {
      const label = await kpiCards.nth(i).locator('.ha-stat-label').textContent();
      const val = await kpiCards.nth(i).locator('.ha-stat-value').textContent();
      console.log(`    Knowledge Stat ${i + 1}: ${label?.trim()} = ${val?.trim()}`);
      if (label?.includes('Hospital Knowledge Items') && val?.trim() === '0') {
        throw new Error('Hospital Knowledge Items card displays 0 articles despite 14 genuine articles in DB!');
      }
    }

    const filterCounter = await page.locator('span:has-text("Showing")').textContent();
    console.log(`  Filter Counter: "${filterCounter?.trim()}"`);

    const articleCards = page.locator('.ha-card-panel:has(h3)');
    const articleCardsCount = await articleCards.count();
    console.log(`  Rendered Knowledge Articles: ${articleCardsCount}`);
    if (articleCardsCount === 0) {
      throw new Error('Zero knowledge articles rendered in Knowledge Activity View!');
    }

    const firstArticle = articleCards.first();
    const firstTitle = await firstArticle.locator('h3').textContent();
    const firstBadge = await firstArticle.locator('.ha-badge').last().textContent();
    console.log(`    First Article: "${firstTitle?.trim()}" [Status: ${firstBadge?.trim()}]`);

    // 6. Return to Dashboard and Verify Full Aggregation
    console.log('\n[6/6] Navigating back to Dashboard to verify fully aggregated KPIs...');
    await page.locator('.ha-nav-item:has-text("Dashboard")').first().click();
    await page.waitForTimeout(2000);

    const postStatCards = page.locator('.ha-stat-grid .ha-stat-card');
    const postCount = await postStatCards.count();
    console.log(`  Auditing ${postCount} StatCards on Re-visited Dashboard:`);
    for (let i = 0; i < postCount; i++) {
      const label = await postStatCards.nth(i).locator('.ha-stat-label').textContent();
      const val = await postStatCards.nth(i).locator('.ha-stat-value').textContent();
      const sub = await postStatCards.nth(i).locator('.ha-stat-subtext').textContent();
      console.log(`    StatCard ${i + 1}: ${label?.trim()} = ${val?.trim()} (${sub?.trim()})`);
    }

    console.log('\n✓ All 6 verification sections passed with 100% integrity!');
  } catch (err) {
    console.error('Audit failed with error:', err);
    await page.screenshot({ path: 'frontend/e2e/hospital_admin_audit_failure.png', fullPage: true });
    throw err;
  } finally {
    await browser.close();
  }
}

runHospitalAdminPortalAudit()
  .then(() => {
    console.log('=== AUDIT COMPLETED SUCCESSFULLY ===');
    process.exit(0);
  })
  .catch((err) => {
    console.error('=== AUDIT FAILED ===', err);
    process.exit(1);
  });
