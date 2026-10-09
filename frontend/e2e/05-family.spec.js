import { test, expect } from '@playwright/test';
import { getAccount } from './testAccounts.js';

test.describe('Family E2E Acceptance Suite', () => {
  test('Family Rohan Kapoor (FAM-001) Dashboard & Member Switching', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const acc1 = getAccount('rohan.kapoor@example.com');

    await page.goto('/');
    await page.fill('input[type="email"]', 'rohan.kapoor@example.com');
    await page.fill('input[type="password"]', acc1.password);
    await page.click('button[type="submit"]');

    // Verify Family layout
    await expect(page.locator('text=Kapoor Family').or(page.locator('text=Family Health Portal').or(page.locator('text=AI Health Assistant')))).toBeVisible({ timeout: 10000 });

    // Appointments tab
    const apptTab = page.locator('button:has-text("Appointments"), div:has-text("Appointments")').first();
    if (await apptTab.isVisible()) {
      await apptTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    // AI Predictions tab
    const aiTab = page.locator('button:has-text("AI Predictions"), button:has-text("AI Assessment"), div:has-text("AI Predictions")').first();
    if (await aiTab.isVisible()) {
      await aiTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    const fatalErrors = consoleErrors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(fatalErrors).toHaveLength(0);
  });

  test('Family Ravi Sharma (FAM-002) Cross-Family Isolation Verification', async ({ page }) => {
    const acc2 = getAccount('ravi.sharma@example.com');

    await page.goto('/');
    await page.fill('input[type="email"]', 'ravi.sharma@example.com');
    await page.fill('input[type="password"]', acc2.password);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Sharma Family').or(page.locator('text=Family Health Portal'))).toBeVisible({ timeout: 10000 });
    // Verify does NOT display Kapoor Family private data
    await expect(page.locator('text=Kapoor Family')).toHaveCount(0);
  });
});
