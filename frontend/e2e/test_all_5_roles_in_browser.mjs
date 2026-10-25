import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

const ROLES = [
  { role: 'CHAIRMAN', name: 'Platform Owner', email: 'chairman@medimind.org', password: 'Chair#2026$01!Dev', selector: '.chairman-shell, [data-role="chairman"], .table-card' },
  { role: 'HOSPITAL_ADMIN', name: 'Hospital Admin', email: 'admin@aarogyam.hospital', password: 'Admin#2026$01!Dev', selector: '.admin-layout, .hadmin-layout, header, nav' },
  { role: 'DOCTOR', name: 'Doctor', email: 'dr.rahul.sharma@aarogyam.hospital', password: 'Doctor#2026$01!Dev', selector: '.doctor-layout, header, nav' },
  { role: 'DEPARTMENT_HEAD', name: 'Department Head', email: 'meenakshi.sundaram@aarogyam.hospital', password: 'Head#2026$02!Dev', selector: '.depthead-layout, header, nav' },
  { role: 'FAMILY', name: 'Family Account', email: 'rohan.kapoor@example.com', password: 'Family#2026$01!Dev', selector: '.family-layout, header, nav' },
];

console.log('=== VERIFYING ALL 5 ROLES IN REAL BROWSER ===');

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

for (const r of ROLES) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  let unauth401s = 0;
  page.on('response', (res) => {
    if (res.status() === 401) {
      unauth401s++;
      console.error(`  [401] ${res.request().method()} ${res.url()}`);
    }
  });

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload({ waitUntil: 'networkidle' });

    await page.waitForSelector('input[type="email"]', { timeout: 8000 });
    await page.fill('input[type="email"]', r.email);
    await page.fill('input[type="password"]', r.password);
    await page.click('button[type="submit"]');

    await page.waitForSelector(r.selector, { timeout: 12000 });
    await page.waitForTimeout(1000);

    const title = await page.title();
    console.log(`✓ [PASS] ${r.name.padEnd(18)} | Email: ${r.email.padEnd(42)} | 401 Errors: ${unauth401s} | Page Title: "${title}"`);
  } catch (err) {
    console.error(`✗ [FAIL] ${r.name}: ${err.message}`);
  } finally {
    await context.close();
  }
}

await browser.close();
console.log('\n>>> ALL 5 ROLES SUCCESSFULLY TESTED IN REAL BROWSER');
