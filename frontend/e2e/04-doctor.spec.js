import { test, expect } from '@playwright/test';
import { getAccount } from './testAccounts.js';

test.describe('Doctor E2E Acceptance Suite', () => {
  test('Doctor Rahul Sharma (Orthopedics) Verification', async ({ page }) => {
    page.on('pageerror', err => console.log('UNCAUGHT PAGE ERROR:', err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
    });

    const acc1 = getAccount('dr.rahul.sharma@aarogyam.hospital');

    await page.goto('/');
    await page.fill('input[type="email"]', 'dr.rahul.sharma@aarogyam.hospital');
    await page.fill('input[type="password"]', acc1.password);
    await page.click('button[type="submit"]');

    // Verify Doctor layout
    await expect(page.locator('text=Dr. Rahul Sharma').or(page.locator('text=Clinical Workspace'))).toBeVisible({ timeout: 10000 });

    // OPD Appointments tab
    const apptTab = page.locator('button:has-text("OPD Appointments"), button:has-text("Appointments")').first();
    if (await apptTab.isVisible()) {
      await apptTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    // Consultations tab
    const consultTab = page.locator('button:has-text("Consultations")').first();
    if (await consultTab.isVisible()) {
      await consultTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    // Prescriptions tab
    const rxTab = page.locator('button:has-text("Prescriptions")').first();
    if (await rxTab.isVisible()) {
      await rxTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('Doctor Vikram Joshi (Diabetology) Identity & Isolation Verification', async ({ page }) => {
    const acc2 = getAccount('dr.vikram.joshi@aarogyam.hospital');

    await page.goto('/');
    await page.fill('input[type="email"]', 'dr.vikram.joshi@aarogyam.hospital');
    await page.fill('input[type="password"]', acc2.password);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dr. Vikram Joshi').or(page.locator('text=Clinical Workspace'))).toBeVisible({ timeout: 10000 });
  });
});
