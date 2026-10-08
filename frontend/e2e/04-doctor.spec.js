import { test, expect } from '@playwright/test';

const PASSWORD = 'Password123!';

test.describe('Doctor E2E Acceptance Suite', () => {
  test('Doctor Rahul Mehta (Orthopedics) Verification', async ({ page }) => {
    page.on('pageerror', err => console.log('UNCAUGHT PAGE ERROR:', err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
    });

    await page.goto('/');
    await page.fill('input[type="email"]', 'rahul.mehta@medimindhospital.com');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Verify Doctor layout
    await expect(page.locator('text=Dr. Rahul Mehta').first()).toBeVisible({ timeout: 10000 });

    // OPD Appointments tab
    const apptTab = page.locator('button:has-text("OPD Appointments")').first();
    if (await apptTab.isVisible()) {
      await apptTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('text=Dr. Rahul Mehta').first()).toBeVisible();
    }

    // Consultations tab
    const consultTab = page.locator('button:has-text("Consultations")').first();
    if (await consultTab.isVisible()) {
      await consultTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('text=Dr. Rahul Mehta').first()).toBeVisible();
    }

    // Prescriptions tab
    const rxTab = page.locator('button:has-text("Prescriptions")').first();
    if (await rxTab.isVisible()) {
      await rxTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('text=Dr. Rahul Mehta').first()).toBeVisible();
    }
  });

  test('Doctor Ananya Roy (Diabetology) Identity & Isolation Verification', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'ananya.roy@medimindhospital.com');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dr. Ananya Roy').first()).toBeVisible({ timeout: 10000 });
    // Verify does NOT say Dr. Rahul Mehta
    await expect(page.locator('text=Dr. Rahul Mehta')).toHaveCount(0);
  });
});
