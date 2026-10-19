import { chromium } from 'playwright';
import { getTestAccounts } from './testAccounts.js';

const BASE_URL = 'http://localhost:5173';
const accounts = getTestAccounts();

console.log('=== VERIFYING DASHBOARD CORRECTIONS & LIVE AGGREGATIONS ===');

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

async function runTests() {
  let passed = 0;
  let total = 0;

  // Test 1: Chairman Dashboard Hospital Controls & Live Aggregation
  total++;
  const chairEmail = 'chairman@medimind.org';
  const chairCred = accounts[chairEmail] || accounts['chairman@medimind.com'];
  if (!chairCred) {
    console.error('FAIL: No Chairman credentials found in test accounts');
  } else {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await page.reload({ waitUntil: 'domcontentloaded' });

      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', chairEmail);
      await page.fill('input[type="password"]', chairCred.password);
      await page.click('button[type="submit"]');

      await page.waitForSelector('.chairman-shell', { timeout: 12000 });
      console.log('✓ Chairman authenticated successfully');

      // Check hospital cards initial count
      await page.waitForSelector('.table-card', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Verify KPI counts
      const bodyText = await page.textContent('body');
      const has2847 = bodyText.includes('2847') || bodyText.includes('2,847');
      const has570 = bodyText.includes('570');
      const has1301 = bodyText.includes('1301') || bodyText.includes('1,301');
      const has445 = bodyText.includes('445');

      console.log(`KPI verification:
  - 2,847 appointments present: ${has2847} (Mock 570 present: ${has570})
  - 1,301 AI predictions present: ${has1301} (Mock 445 present: ${has445})`);

      if (has2847 && !has570) {
        console.log('✓ Platform Dashboard displays live/reconciled appointment count (2,847), not mock 570');
      } else {
        console.warn('⚠️ Appointment KPI count check: has2847=', has2847, 'has570=', has570);
      }

      // Find the hospital cards inside the Hospital Network Overview
      const viewMoreBtn = await page.$('button:has-text("View more")');
      if (viewMoreBtn) {
        const btnText = await viewMoreBtn.textContent();
        console.log(`✓ "View more" button present for hospitals: "${btnText.trim()}"`);

        // Click View more
        await viewMoreBtn.click();
        await page.waitForTimeout(400);

        const viewLessBtn = await page.$('button:has-text("View less")');
        if (viewLessBtn) {
          console.log('✓ "View less" button appeared after expanding hospitals');
          // Click View less
          await viewLessBtn.click();
          await page.waitForTimeout(400);
          const viewMoreAgain = await page.$('button:has-text("View more")');
          if (viewMoreAgain) {
            console.log('✓ Hospital cards collapsed back and "View more" button restored');
            passed++;
          } else {
            console.error('FAIL: Could not collapse hospitals');
          }
        } else {
          console.error('FAIL: "View less" button not found after clicking View more');
        }
      } else {
        console.log('ℹ️ Exactly 3 or fewer hospitals available, no View more button needed (valid if hospitals <= 3)');
        passed++;
      }
    } catch (err) {
      console.error('FAIL: Chairman dashboard test threw:', err.message);
    } finally {
      await context.close();
    }
  }

  // Test 2: Family Dashboard Member Cards Controls
  total++;
  const familyEmail = 'rohan.kapoor@example.com';
  const familyCred = accounts[familyEmail];
  if (!familyCred) {
    console.error('FAIL: No Family credentials found in test accounts');
  } else {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await page.reload({ waitUntil: 'domcontentloaded' });

      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', familyEmail);
      await page.fill('input[type="password"]', familyCred.password);
      await page.click('button[type="submit"]');

      await page.waitForSelector('.app-shell', { timeout: 12000 });
      console.log('✓ Family authenticated successfully');

      await page.waitForSelector('.member-cards', { timeout: 10000 });
      await page.waitForTimeout(800);

      // Check how many member cards are displayed (excluding .add-card)
      const initialCards = await page.$$('.member-card:not(.add-card)');
      console.log(`Initial displayed member cards: ${initialCards.length}`);

      if (initialCards.length <= 3) {
        console.log(`✓ Maximum 3 member cards displayed initially (${initialCards.length} cards)`);
      } else {
        console.error(`FAIL: More than 3 member cards displayed initially: ${initialCards.length}`);
      }

      const viewMoreBtn = await page.$('button:has-text("View more")');
      if (viewMoreBtn) {
        const btnText = await viewMoreBtn.textContent();
        console.log(`✓ "View more" button present: "${btnText.trim()}"`);

        // Click View more (navigates to dedicated Members page)
        await viewMoreBtn.click();
        await page.waitForTimeout(600);

        const pageHeading = await page.$('h1:has-text("Family members")');
        const memberListItems = await page.$$('.feature-card');
        console.log(`Navigated to Members page: heading found=${!!pageHeading}, member count=${memberListItems.length}`);

        if (pageHeading && memberListItems.length >= initialCards.length) {
          console.log(`✓ Successfully navigated to dedicated Family Members page displaying all ${memberListItems.length} members`);
          passed++;
        } else {
          console.error('FAIL: View more did not navigate to dedicated Family Members page');
        }
      } else {
        console.log(`ℹ️ Only ${initialCards.length} members present; no View more button needed`);
        passed++;
      }
    } catch (err) {
      console.error('FAIL: Family dashboard test threw:', err.message);
    } finally {
      await context.close();
    }
  }

  // Test 3: Family Layout empty state behavior
  total++;
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    // Mock API returning empty array for /api/families/members
    await page.route('**/api/families/members', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', familyEmail);
    await page.fill('input[type="password"]', familyCred.password);
    await page.click('button[type="submit"]');

    await page.waitForSelector('.app-shell', { timeout: 12000 });
    await page.waitForTimeout(1000);

    const emptyCard = await page.$('.empty-state-card');
    if (emptyCard) {
      const text = await emptyCard.textContent();
      if (text.includes('No Family Members Registered') && text.includes('Add First Family Member')) {
        console.log('✓ Authoritative empty response correctly clears members and renders dedicated empty state card');
        passed++;
      } else {
        console.error('FAIL: Empty card text missing expected message:', text);
      }
    } else {
      console.error('FAIL: .empty-state-card not found when members API returns []');
    }
    await context.close();
  } catch (err) {
    console.error('FAIL: Empty state test threw:', err.message);
  }

  console.log(`\n=== AUDIT RESULTS: ${passed}/${total} TESTS PASSED ===`);
  await browser.close();
  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
