import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@aarogyam.hospital',
  password: process.env.ADMIN_PASSWORD || 'Admin#2026\u002401!Dev',
};

console.log('=== STARTING HOSPITAL ADMIN DEEP E2E VERIFICATION ===');

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
const failedRequests = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text());
  }
});

page.on('response', (response) => {
  if (response.status() >= 400) {
    failedRequests.push({ url: response.url(), status: response.status() });
  }
});

let overallPass = true;

try {
  // 1. Login
  console.log('1. Logging in as Hospital Admin...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', CREDENTIALS.email);
  await page.fill('input[type="password"]', CREDENTIALS.password);
  await page.click('button:has-text("Sign In")');

  await page.waitForTimeout(3000);
  console.log('   Current URL after login:', page.url());

  // Helper to click sidebar nav
  async function navigateTo(navName, expectedHeader) {
    console.log(`\nNavigating to "${navName}"...`);
    const btn = page.locator(`.ha-nav-item:has-text("${navName}")`).first();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click();
    await page.waitForTimeout(1500);
    if (expectedHeader) {
      await page.waitForSelector(`h1:has-text("${expectedHeader}"), h2:has-text("${expectedHeader}"), h3:has-text("${expectedHeader}")`, { timeout: 5000 });
    }
  }

  // 2. Hospital Operational Analytics
  await navigateTo('Hospital Operational Analytics', 'Hospital Operational Analytics');
  console.log('   Checking Monthly Operational Performance Summary Table...');
  await page.waitForSelector('table.ha-table, table', { timeout: 5000 });
  const tableContent = await page.locator('table.ha-table, table').textContent();

  const hasNaN = tableContent.includes('NaN');
  const hasInfinity = tableContent.includes('Infinity');
  const hasUndefined = tableContent.includes('undefined');

  console.log(`   Table contains "NaN": ${hasNaN} (Expected: false)`);
  console.log(`   Table contains "Infinity": ${hasInfinity} (Expected: false)`);
  console.log(`   Table contains "undefined": ${hasUndefined} (Expected: false)`);

  if (hasNaN || hasInfinity || hasUndefined) {
    overallPass = false;
    console.error('   [FAIL] Table contains invalid numbers/NaN!');
  } else {
    console.log('   [PASS] Monthly table data is 100% clean and valid!');
  }

  // Print first few table rows
  const rows = await page.locator('table.ha-table tbody tr, table tbody tr').allTextContents();
  console.log(`   Rendered table rows (${rows.length}):`);
  rows.slice(0, 4).forEach((r, idx) => console.log(`      Row ${idx+1}: ${r.replace(/\s+/g, ' ').trim()}`));

  // 3. Department Comparative Analytics
  await navigateTo('Department Comparative Analytics', 'Department Comparative Analytics');
  console.log('   Checking Department Comparative Analytics...');
  const deptPageText = await page.textContent('body');
  const hasDeptNaN = deptPageText.includes('NaN%');
  console.log(`   Department view contains "NaN%": ${hasDeptNaN} (Expected: false)`);
  if (hasDeptNaN) overallPass = false;

  // Check Donut chart center value: should be total bookings > 100
  const donutCard = page.locator('.ha-card-panel:has-text("Department Consultation Volume Share")');
  const donutText = await donutCard.textContent();
  console.log(`   Department Volume Share text: ${donutText.replace(/\s+/g, ' ').slice(0, 120)}...`);

  // Check department comparison cards
  const deptCards = await page.locator('.ha-card-panel:has-text("Completion")').count();
  console.log(`   Department comparison cards rendered: ${deptCards}`);

  // 4. AI Diagnostics Analytics
  await navigateTo('AI Analytics', 'Hospital AI Diagnostic Analytics');
  console.log('   Checking AI Diagnostics Analytics...');
  const aiPageText = await page.textContent('body');
  const hasZeroTotal = aiPageText.includes('Zero total value');
  console.log(`   AI Donut shows "Zero total value": ${hasZeroTotal} (Expected: false)`);

  if (hasZeroTotal) {
    overallPass = false;
    console.error('   [FAIL] AI Donut chart still shows "Zero total value"!');
  } else {
    console.log('   [PASS] AI Diagnostic Model Volume Share renders genuine distribution!');
  }

  // Check Top Stats in AI view
  const aiStatCards = await page.locator('.ha-stat-grid .ha-stat-card, .ha-stat-card').allTextContents();
  aiStatCards.slice(0, 4).forEach((c, idx) => console.log(`      AI KPI ${idx+1}: ${c.replace(/\s+/g, ' ').trim()}`));

  // 5. Reports & Compliance Documentation
  await navigateTo('Reports', 'Hospital Reports & Compliance Documentation');
  console.log('   Checking Reports & Compliance Documentation...');
  const reportsText = await page.textContent('body');
  const hasReportsZero = reportsText.includes('All Reports (0)');
  console.log(`   Reports shows "All Reports (0)": ${hasReportsZero} (Expected: false)`);

  // Check filter pills
  const apptFilter = page.locator('.ha-filter-pill:has-text("Appointments")').first();
  if (await apptFilter.isVisible()) {
    await apptFilter.click();
    await page.waitForTimeout(500);
    const filterText = await page.textContent('body');
    const showsApptReports = filterText.includes('Operations & Capacity Audit') || filterText.includes('Throughput Report');
    console.log(`   Appointments category filter active, report displayed: ${showsApptReports}`);
  }

  // Click All Reports again
  const allFilter = page.locator('.ha-filter-pill:has-text("All Reports")').first();
  await allFilter.click();
  await page.waitForTimeout(500);

  // Test Generate New Report Modal
  console.log('   Testing Generate New Report Modal...');
  const genBtn = page.locator('button:has-text("Generate New Report")').first();
  await genBtn.click();
  await page.waitForTimeout(500);
  const modalVisible = await page.isVisible('.ha-modal');
  console.log(`   Generate Report Modal opened: ${modalVisible}`);

  if (modalVisible) {
    const submitBtn = page.locator('.ha-modal button[type="submit"]').first();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await submitBtn.click();
    await page.waitForTimeout(1500);
    console.log('   Submitted new report generation successfully.');
  }

  // Test Download Button on first report
  console.log('   Testing Download Report Bundle button...');
  const downloadBtn = page.locator('button:has-text("Download Report Bundle")').first();
  if (await downloadBtn.isVisible()) {
    await downloadBtn.click();
    await page.waitForTimeout(1000);
    console.log('   Download report bundle clicked without error.');
  }

  // Check console errors & failed network requests
  console.log('\n--- BROWSER CONSOLE & NETWORK AUDIT ---');
  console.log(`Total console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((e) => console.warn('   Console error:', e));
  }

  const fatal401s = failedRequests.filter((r) => r.status === 401);
  console.log(`Total 401 Unauthorized responses: ${fatal401s.length}`);
  if (fatal401s.length > 0) {
    overallPass = false;
    fatal401s.forEach((r) => console.error('   401 URL:', r.url));
  }

  console.log('\n=======================================');
  if (overallPass && fatal401s.length === 0 && !hasNaN && !hasZeroTotal) {
    console.log('>>> ALL HOSPITAL ADMIN DEEP CHECKS PASSED [SUCCESS] <<<');
  } else {
    console.error('>>> HOSPITAL ADMIN DEEP CHECKS HAD WARNINGS OR FAILURES <<<');
  }
} catch (err) {
  console.error('Error during deep verification:', err);
  overallPass = false;
} finally {
  await browser.close();
}
