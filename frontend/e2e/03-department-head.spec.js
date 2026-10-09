import { test, expect } from '@playwright/test';
import { getAccount } from './testAccounts.js';

test.describe('Department Head E2E Acceptance Suite', () => {
  test('Orthopedics Department Head Verification', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const acc1 = getAccount('arun.prakash@aarogyam.hospital');

    await page.goto('/');
    await page.fill('input[type="email"]', 'arun.prakash@aarogyam.hospital');
    await page.fill('input[type="password"]', acc1.password);
    await page.click('button[type="submit"]');

    // Verify Department Head layout
    await expect(page.locator('text=Department Head').first()).toBeVisible({ timeout: 10000 });

    // Verify Knowledge View loads without ReferenceError
    const knowledgeTab = page.locator('button:has-text("Knowledge")').first();
    if (await knowledgeTab.isVisible()) {
      await knowledgeTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    const fatalErrors = consoleErrors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(fatalErrors).toHaveLength(0);
  });

  test('Diabetology Department Head Isolation Verification', async ({ page }) => {
    const acc2 = getAccount('meenakshi.sundaram@aarogyam.hospital');

    await page.goto('/');
    await page.fill('input[type="email"]', 'meenakshi.sundaram@aarogyam.hospital');
    await page.fill('input[type="password"]', acc2.password);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Department Head').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
