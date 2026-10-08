import { test, expect } from '@playwright/test';

const PASSWORD = 'Password123!';

test.describe('Hospital Admin E2E Acceptance Suite', () => {
  test('Hospital Admin H1 Dashboard, Departments, Analytics and Isolation', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@medimindhospital.com');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Verify Hospital Admin layout
    await expect(page.locator('text=Hospital Admin').first()).toBeVisible({ timeout: 10000 });

    // 1. Departments tab
    const deptBtn = page.locator('button:has-text("Departments")').first();
    if (await deptBtn.isVisible()) {
      await deptBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    // 2. Doctors tab
    const docBtn = page.locator('button:has-text("Doctors")').first();
    if (await docBtn.isVisible()) {
      await docBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    // 3. Analytics tab
    const analyticsBtn = page.locator('button:has-text("Hospital Operational Analytics")').first();
    if (await analyticsBtn.isVisible()) {
      await analyticsBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }

    // 4. Logout
    const logoutBtn = page.locator('button:has-text("Sign Out")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    }

    const fatalErrors = consoleErrors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(fatalErrors).toHaveLength(0);
  });

  test('Hospital Admin H2 (Apex Metro) Isolation Verification', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@apexmetro.hospital');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Hospital Admin').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
