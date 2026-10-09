import { test, expect } from '@playwright/test';
import { getAccount } from './testAccounts.js';

test.describe('Responsive Viewport Sanity E2E Suite', () => {
  test('Desktop Viewport (1280x800) Family Health Workspace', async ({ page }) => {
    const family = getAccount('family', 'rohan.kapoor@example.com');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.fill('input[type="email"]', family.email);
    await page.fill('input[type="password"]', family.password);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Kapoor Family').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('Tablet Viewport (768x1024) Doctor Clinical Workspace', async ({ page }) => {
    const doctor = getAccount('doctor', 'dr.rahul.sharma@aarogyam.hospital');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.fill('input[type="email"]', doctor.email);
    await page.fill('input[type="password"]', doctor.password);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dr. Rahul Sharma').or(page.locator('text=Clinical Workspace'))).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('Mobile Viewport (375x667) Chairman Platform Dashboard', async ({ page }) => {
    const chairman = getAccount('chairman', 'chairman@medimind.org');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.fill('input[type="email"]', chairman.email);
    await page.fill('input[type="password"]', chairman.password);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Platform Dashboard').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });
});
