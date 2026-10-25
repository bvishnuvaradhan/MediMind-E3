import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

const ROLES_TO_TEST = [
  { role: 'CHAIRMAN', name: 'Platform Owner', email: 'chairman@medimind.org', password: 'Chair#2026\u002401!Dev' },
  { role: 'HOSPITAL_ADMIN', name: 'Hospital Admin', email: 'admin@aarogyam.hospital', password: 'Admin#2026\u002401!Dev' },
  { role: 'DOCTOR', name: 'Doctor', email: 'dr.rahul.sharma@aarogyam.hospital', password: 'Doctor#2026\u002401!Dev' },
  { role: 'DEPARTMENT_HEAD', name: 'Department Head', email: 'meenakshi.sundaram@aarogyam.hospital', password: 'Head#2026\u002402!Dev' },
  { role: 'FAMILY', name: 'Family / Patient Account', email: 'rohan.kapoor@example.com', password: 'Family#2026\u002401!Dev' },
];

console.log('=== STARTING COMPREHENSIVE PRODUCTION SMOKE TEST SUITE ===');

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

let totalChecks = 0;
let passedChecks = 0;

function reportCheck(desc, condition) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${desc}`);
  } else {
    console.error(`  [FAIL] ${desc}`);
  }
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const authenticatedConsoleErrors = [];
  const network5xx = [];
  const unauthorized401s = [];
  let isTestingNegativeAuth = false;

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      if (!isTestingNegativeAuth && !msg.text().includes('401 (Unauthorized)')) {
        authenticatedConsoleErrors.push(msg.text());
      }
    }
  });

  page.on('response', (response) => {
    if (response.status() >= 500) {
      network5xx.push({ url: response.url(), status: response.status() });
    }
    if (response.status() === 401 && !isTestingNegativeAuth && !response.url().includes('/api/auth/login')) {
      unauthorized401s.push({ url: response.url(), status: response.status() });
    }
  });

  // 1. Negative Authentication Tests
  console.log('\n--- 1. Negative Authentication Checks ---');
  isTestingNegativeAuth = true;
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });

  // Wrong password
  await page.fill('input[type="email"]', 'chairman@medimind.org');
  await page.fill('input[type="password"]', 'WrongPassword!123');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(1500);

  const errorAlert = await page.isVisible('text=Invalid email or password') || await page.isVisible('text=Invalid credentials') || await page.isVisible('text=failed');
  reportCheck('Rejection of invalid password returns visible error', errorAlert);

  const tokenAfterFail = await page.evaluate(() => localStorage.getItem('medimind_jwt_token'));
  reportCheck('No JWT token stored on failed authentication', !tokenAfterFail);
  isTestingNegativeAuth = false;

  // 2. Sequential Authentication & Navigation for All 5 Roles
  console.log('\n--- 2. Sequential All-Role Workflow Verification ---');
  for (const r of ROLES_TO_TEST) {
    console.log(`\nTesting Role: ${r.name} (${r.role})`);
    
    // Clear storage to start fresh
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 8000 });

    await page.fill('input[type="email"]', r.email);
    await page.fill('input[type="password"]', r.password);
    await page.click('button:has-text("Sign In")');

    await page.waitForTimeout(3000);

    const isAuth = await page.evaluate(() => !!localStorage.getItem('medimind_jwt_token'));
    reportCheck(`${r.role} login succeeded and stored valid token`, isAuth);

    const bodyText = await page.textContent('body');
    reportCheck(`${r.role} workspace rendered without crash`, bodyText.length > 200 && !bodyText.includes('Something went wrong'));

    // Test role-specific sub-routes / navigation
    if (r.role === 'CHAIRMAN') {
      const hasKPIs = bodyText.includes('Platform Overview') || bodyText.includes('Registered Hospitals') || bodyText.includes('Operational Analytics');
      reportCheck('Platform Owner Overview KPIs visible', hasKPIs);
    } else if (r.role === 'HOSPITAL_ADMIN') {
      const hasAdmin = bodyText.includes('Hospital Admin') || bodyText.includes('Aarogyam Multispeciality') || bodyText.includes('Operational Analytics');
      reportCheck('Hospital Admin dashboard visible', hasAdmin);
    } else if (r.role === 'DOCTOR') {
      const hasDoc = bodyText.includes('Dr.') || bodyText.includes('Doctor') || bodyText.includes('Appointments') || bodyText.includes('Schedule');
      reportCheck('Doctor clinical portal visible', hasDoc);
    } else if (r.role === 'DEPARTMENT_HEAD') {
      const hasHead = bodyText.includes('Department') || bodyText.includes('Workload') || bodyText.includes('Doctors') || bodyText.includes('Head');
      reportCheck('Department Head portal visible', hasHead);
    } else if (r.role === 'FAMILY') {
      const hasFam = bodyText.includes('Family') || bodyText.includes('Appointments') || bodyText.includes('Health Records') || bodyText.includes('Kapoor');
      reportCheck('Family health portal visible', hasFam);
    }

    // Test Logout
    const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Logout")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
      const isLoggedOut = await page.evaluate(() => !localStorage.getItem('medimind_jwt_token'));
      reportCheck(`${r.role} logout successfully cleared session token`, isLoggedOut);
    }
  }

  // 3. Overall Network & Console Integrity
  console.log('\n--- 3. Network & Console Inspection ---');
  reportCheck('Zero HTTP 5xx Server Errors across entire smoke session', network5xx.length === 0);
  if (network5xx.length > 0) {
    network5xx.forEach((e) => console.error('   5xx URL:', e.url, e.status));
  }

  reportCheck('Zero Unexpected 401 Unauthorized API responses in authenticated flows', unauthorized401s.length === 0);
  if (unauthorized401s.length > 0) {
    unauthorized401s.forEach((e) => console.error('   401 URL:', e.url));
  }

  reportCheck('Zero Uncaught JavaScript Runtime Console Errors', authenticatedConsoleErrors.length === 0);
  if (authenticatedConsoleErrors.length > 0) {
    authenticatedConsoleErrors.forEach((e) => console.warn('   Console error:', e));
  }

  console.log('\n======================================================');
  console.log(`SMOKE TEST SUMMARY: ${passedChecks} / ${totalChecks} Checks Passed`);
  if (passedChecks === totalChecks) {
    console.log('>>> PRODUCTION SMOKE SUITE: 100% PASS [READY] <<<');
  } else {
    console.error('>>> PRODUCTION SMOKE SUITE: WARNINGS OR FAILURES <<<');
  }

  await context.close();
} catch (err) {
  console.error('Smoke test exception:', err);
} finally {
  await browser.close();
}
