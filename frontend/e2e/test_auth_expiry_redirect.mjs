import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

console.log('=== VERIFYING EXPIRED SESSION REDIRECT & RETRY-LOOP PREVENTION ===');

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

let request401Count = 0;

page.on('response', (response) => {
  if (response.status() === 401) {
    request401Count++;
  }
});

try {
  console.log('1. Setting expired JWT token in localStorage...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  
  // Set expired token (expired in 2020)
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoiQ0hBSVJNQU4iLCJleHAiOjE1OTAwMDAwMDB9.invalid_signature';
  const dummySession = {
    id: 'usr_chair',
    role: 'CHAIRMAN',
    email: 'chairman@medimind.org',
    token: expiredToken
  };

  await page.evaluate(({ token, session }) => {
    localStorage.setItem('medimind_jwt_token', token);
    localStorage.setItem('medimind_auth_session', JSON.stringify(session));
  }, { token: expiredToken, session: dummySession });

  console.log('2. Reloading page with expired token...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('3. Checking that UI redirected to /login...');
  const isLoginPage = await page.isVisible('button:has-text("Sign In")');
  console.log(`   Login page visible: ${isLoginPage} (Expected TRUE)`);

  const hasExpiredAlert = await page.isVisible('text=expired') || await page.isVisible('text=sign in');
  console.log(`   Session expired alert visible: ${hasExpiredAlert}`);

  console.log(`4. Total 401 network requests made during test: ${request401Count}`);
  // Since isTokenExpired pre-checks token before sending, request401Count should be 0!
  console.log(`   Pre-check avoided 401 roundtrips entirely: ${request401Count === 0}`);

  if (isLoginPage && request401Count === 0) {
    console.log('>>> SUCCESS: Expired session cleanly redirected without any request retry loops!');
  } else {
    console.warn('Review redirect behavior.');
  }

} catch (err) {
  console.error('Test error:', err);
} finally {
  await browser.close();
}
