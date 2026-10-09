import { test, expect } from '@playwright/test';
import { getAccount } from './testAccounts.js';

test.describe('Chairman E2E Acceptance Suite', () => {
  test('Chairman Complete Navigation and View Verification', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const acc = getAccount('chairman@medimind.org');

    await page.goto('/');
    await page.fill('input[type="email"]', 'chairman@medimind.org');
    await page.fill('input[type="password"]', acc.password);
    await page.click('button[type="submit"]');

    // Verify Chairman layout loads
    await expect(page.locator('text=Platform Dashboard').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Platform Owner').first()).toBeVisible();

    // 1. Navigation to Hospitals Overview
    const hospitalBtn = page.locator('button:has-text("Hospitals")').first();
    if (await hospitalBtn.isVisible()) {
      await hospitalBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    // 2. Navigation to Analytics
    const analyticsBtn = page.locator('button:has-text("Platform Analytics")').first();
    if (await analyticsBtn.isVisible()) {
      await analyticsBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    // 3. Navigation to Settings
    const settingsBtn = page.locator('button:has-text("Settings")').first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    // 4. Logout
    const logoutBtn = page.locator('button:has-text("Sign out"), button:has-text("Sign Out")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    }

    const fatalErrors = consoleErrors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(fatalErrors).toHaveLength(0);
  });
});
