import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTestAccounts } from './testAccounts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const inventory = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scripts/canonical_inventory.json'), 'utf-8'));
const accountsWithCreds = getTestAccounts();

console.log(`=== STARTING 59-ACCOUNT PLAYWRIGHT E2E RECONCILIATION AUDIT ===`);
console.log(`Target: ${BASE_URL}`);
console.log(`Accounts in Inventory: ${inventory.length}`);

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const results = [];
let passedCount = 0;
let failedCount = 0;

for (let i = 0; i < inventory.length; i++) {
  const acc = inventory[i];
  const email = acc.email.toLowerCase().trim();
  const role = acc.role;
  const expectedName = acc.full_name;
  const expectedHosp = acc.hospital;
  const expectedMembers = acc.member_count;

  const cred = accountsWithCreds[email];
  if (!cred || !cred.password) {
    results.push({
      index: i + 1,
      account_id: acc.account_id,
      email,
      role,
      expected_name: expectedName,
      status: 'BLOCKED',
      reason: 'No password found in credentials workbook'
    });
    console.log(`[${i + 1}/${inventory.length}] ${email} (${role}): BLOCKED - No password in workbook`);
    failedCount++;
    continue;
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon') && !txt.includes('404')) {
        consoleErrors.push(txt);
      }
    }
  });

  const startTime = Date.now();
  let status = 'PASS';
  let failureReason = '';
  let details = {};

  try {
    // 1. Navigate to login
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 2. Clear any lingering session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // 3. Fill and submit login
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', cred.password);
    await page.click('button[type="submit"]');

    // 4. Role-specific validation
    if (role === 'CHAIRMAN') {
      await page.waitForSelector('.chairman-shell', { timeout: 12000 });
      const bodyText = await page.textContent('body');
      const hasTitle = bodyText.includes('Platform Owner') || bodyText.includes('MediMind');
      details = { shell_verified: true, title_verified: hasTitle };
      if (!hasTitle) {
        status = 'MISMATCH';
        failureReason = `Expected Chairman UI indicators not found on page`;
      }
    } else if (role === 'HOSPITAL_ADMIN') {
      await page.waitForSelector('.ha-shell', { timeout: 12000 });
      const bodyText = await page.textContent('body');
      const hasRole = bodyText.includes('Hospital Admin');
      details = { shell_verified: true, role_verified: hasRole };
      if (!hasRole) {
        status = 'MISMATCH';
        failureReason = `Expected Hospital Admin UI indicators not found on page`;
      }
    } else if (role === 'DEPARTMENT_HEAD') {
      await page.waitForSelector('.dh-shell', { timeout: 12000 });
      const bodyText = await page.textContent('body');
      const hasDept = bodyText.includes('Overview') || bodyText.includes('Clinical Workforce') || bodyText.includes('Department');
      details = { shell_verified: true, dept_verified: hasDept };
      if (!hasDept) {
        status = 'MISMATCH';
        failureReason = `Expected Department Head UI indicators not found on page`;
      }
    } else if (role === 'DOCTOR') {
      await page.waitForSelector('.doctor-shell', { timeout: 12000 });
      const bodyText = await page.textContent('body');
      const hasDoc = bodyText.includes('Clinical Overview') || bodyText.includes('Doctor') || bodyText.includes('Availability & Slots');
      details = { shell_verified: true, doctor_verified: hasDoc };
      if (!hasDoc) {
        status = 'MISMATCH';
        failureReason = `Expected Doctor UI indicators not found on page`;
      }
    } else if (role === 'FAMILY') {
      await page.waitForSelector('.app-shell', { timeout: 12000 });
      
      // Wait for members cards to appear (may take a moment for useEffect dynamic fetch)
      try {
        await page.waitForSelector('.member-card', { timeout: 8000 });
      } catch (e) {
        // Fallback wait
        await page.waitForTimeout(2000);
      }
      
      const memberCards = await page.$$('.member-card');
      const bodyText = await page.textContent('body');
      
      // Check for "Manage members (N)"
      const countMatch = bodyText.match(/Manage members \((\d+)\)/);
      const displayedCount = countMatch ? parseInt(countMatch[1], 10) : memberCards.length;
      
      const invariantHolds = displayedCount >= 1;
      const countMatches = displayedCount === expectedMembers;
      
      details = {
        shell_verified: true,
        displayed_members_count: displayedCount,
        expected_members_count: expectedMembers,
        invariant_passed: invariantHolds,
        exact_count_matched: countMatches
      };

      if (!invariantHolds) {
        status = 'FAIL';
        failureReason = `Family Invariant Violated: 0 members displayed (expected ${expectedMembers})`;
      } else if (!countMatches) {
        status = 'MISMATCH';
        failureReason = `Member count mismatch: UI showed ${displayedCount}, expected ${expectedMembers}`;
      }
    }

    const elapsed = Date.now() - startTime;
    details.latency_ms = elapsed;
    details.console_errors = consoleErrors.length;

    if (status === 'PASS') {
      passedCount++;
      console.log(`[${i + 1}/${inventory.length}] [PASS] ${email} (${role}) in ${elapsed}ms ${role === 'FAMILY' ? `[${details.displayed_members_count} members]` : ''}`);
    } else {
      failedCount++;
      console.log(`[${i + 1}/${inventory.length}] [${status}] ${email} (${role}): ${failureReason}`);
    }

    results.push({
      index: i + 1,
      account_id: acc.account_id,
      email,
      role,
      expected_name: expectedName,
      status,
      failure_reason: failureReason,
      details
    });

  } catch (err) {
    const elapsed = Date.now() - startTime;
    failedCount++;
    console.log(`[${i + 1}/${inventory.length}] [ERROR] ${email} (${role}): ${err.message}`);
    results.push({
      index: i + 1,
      account_id: acc.account_id,
      email,
      role,
      expected_name: expectedName,
      status: 'ERROR',
      failure_reason: err.message,
      details: { latency_ms: elapsed, console_errors: consoleErrors.length }
    });
  } finally {
    await context.close();
  }
}

await browser.close();

console.log(`\n=== AUDIT COMPLETED ===`);
console.log(`Total Accounts Tested: ${inventory.length}`);
console.log(`PASS: ${passedCount}`);
console.log(`FAIL/MISMATCH/ERROR: ${failedCount}`);

fs.writeFileSync(
  path.resolve(__dirname, '../../scripts/playwright_59_accounts_results.json'),
  JSON.stringify(results, null, 2),
  'utf-8'
);
console.log(`Wrote results to scripts/playwright_59_accounts_results.json`);
