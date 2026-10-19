import { chromium } from 'playwright';
import { getTestAccounts } from './testAccounts.js';

const accounts = getTestAccounts();
const credFam = accounts['amit.banerjee@example.com'];
const credDoc = accounts['dr.rahul.sharma@aarogyam.hospital'];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// 1. Test Doctor
console.log('Testing Doctor login...');
await page.goto('http://localhost:5173/');
await page.fill('input[type="email"]', 'dr.rahul.sharma@aarogyam.hospital');
await page.fill('input[type="password"]', credDoc.password);
await page.click('button[type="submit"]');

await page.waitForSelector('.doctor-shell', { timeout: 10000 });
console.log('Doctor shell verified!');
const docText = await page.textContent('body');
console.log('Doctor page has Dr. Rahul Sharma?', docText.includes('Rahul Sharma'));

// 2. Clear and Test Family
console.log('Testing Family login...');
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.goto('http://localhost:5173/');
await page.fill('input[type="email"]', 'amit.banerjee@example.com');
await page.fill('input[type="password"]', credFam.password);
await page.click('button[type="submit"]');

await page.waitForSelector('.family-shell', { timeout: 10000 });
console.log('Family shell verified!');
await page.waitForTimeout(1000);
const famText = await page.textContent('body');
console.log('Family page has Banerjee?', famText.includes('Banerjee'));
const memberCards = await page.$$('.member-card');
console.log('Member cards count:', memberCards.length);

await browser.close();
