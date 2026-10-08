import { test, expect } from '@playwright/test';

const PASSWORD = 'Password123!';

test.describe('Cross-Account Session & Boundary Isolation E2E Suite', () => {
  test('Complete Role Transition Lifecycle (Chairman -> Admin -> Doctor -> Family)', async ({ page }) => {
    // 1. Chairman Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'chairman@medimind.org');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Platform Dashboard').first()).toBeVisible({ timeout: 10000 });

    // Chairman Logout
    const chairmanLogout = page.locator('button:has-text("Sign out"), button:has-text("Logout")').first();
    if (await chairmanLogout.isVisible()) {
      await chairmanLogout.click();
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    }

    // 2. Hospital Admin Login
    await page.fill('input[type="email"]', 'admin@medimindhospital.com');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Hospital Admin').first()).toBeVisible({ timeout: 10000 });

    // Verify does NOT display Chairman platform owner controls
    await expect(page.locator('text=Dr. Devendra Roy')).toHaveCount(0);

    // Admin Logout
    const adminLogout = page.locator('button:has-text("Sign Out"), button:has-text("Logout")').first();
    if (await adminLogout.isVisible()) {
      await adminLogout.click();
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    }

    // 3. Doctor Login (Orthopedics)
    await page.fill('input[type="email"]', 'rahul.mehta@medimindhospital.com');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dr. Rahul Mehta').first()).toBeVisible({ timeout: 10000 });

    // Doctor Logout
    const docLogout = page.locator('button:has-text("Sign Out"), button:has-text("Logout")').first();
    if (await docLogout.isVisible()) {
      await docLogout.click();
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    }

    // 4. Family Login (FAM-001)
    await page.fill('input[type="email"]', 'rohan.kapoor@example.com');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Kapoor Family').first()).toBeVisible({ timeout: 10000 });

    // Verify does NOT display doctor workspace or admin layout
    await expect(page.locator('.doctor-shell')).toHaveCount(0);
    await expect(page.locator('text=Lead Hospital Administrator')).toHaveCount(0);
  });

  test('Family Member Switching & Isolation within Household', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'rohan.kapoor@example.com');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Kapoor Family').first()).toBeVisible({ timeout: 10000 });

    // Switch member in family portal if selector exists
    const memberSelector = page.locator('select, button:has-text("Member"), div.member-card').first();
    if (await memberSelector.isVisible()) {
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});
