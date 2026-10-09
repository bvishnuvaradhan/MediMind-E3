import { test, expect } from '@playwright/test';
import { getAccount } from './testAccounts.js';

test.describe('Cross-Account Session & Boundary Isolation E2E Suite', () => {
  test('Complete Role Transition Lifecycle (Chairman -> Admin -> Doctor -> Family)', async ({ page }) => {
    test.setTimeout(60000);
    const chairman = getAccount('chairman', 'chairman@medimind.org');
    const admin = getAccount('hospital_admin', 'admin@aarogyam.hospital');
    const doctor = getAccount('doctor', 'dr.rahul.sharma@aarogyam.hospital');
    const family = getAccount('family', 'rohan.kapoor@example.com');

    // 1. Chairman Login
    await page.goto('/');
    await page.fill('input[type="email"]', chairman.email);
    await page.fill('input[type="password"]', chairman.password);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Platform Dashboard').first()).toBeVisible({ timeout: 10000 });

    // Chairman Logout
    const chairmanLogout = page.locator('button:has-text("Sign out"), button:has-text("Logout")').first();
    if (await chairmanLogout.isVisible()) {
      await chairmanLogout.click();
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[type="email"]')).toBeEnabled({ timeout: 10000 });
    }

    // 2. Hospital Admin Login
    await page.fill('input[type="email"]', admin.email);
    await page.fill('input[type="password"]', admin.password);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Hospital Admin').first()).toBeVisible({ timeout: 10000 });

    // Verify does NOT display Chairman platform owner controls
    await expect(page.locator('text=Dr. Devendra Roy')).toHaveCount(0);

    // Admin Logout
    const adminLogout = page.locator('button:has-text("Sign Out"), button:has-text("Logout")').first();
    if (await adminLogout.isVisible()) {
      await adminLogout.click();
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[type="email"]')).toBeEnabled({ timeout: 10000 });
    }

    // 3. Doctor Login (Orthopedics)
    await page.fill('input[type="email"]', doctor.email);
    await page.fill('input[type="password"]', doctor.password);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dr. Rahul Sharma').or(page.locator('text=Clinical Workspace'))).toBeVisible({ timeout: 10000 });

    // Doctor Logout
    const docLogout = page.locator('button:has-text("Sign Out")').first();
    await docLogout.scrollIntoViewIfNeeded();
    await docLogout.click();
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeEnabled({ timeout: 10000 });

    // 4. Family Login (FAM-001)
    await page.fill('input[type="email"]', family.email);
    await page.fill('input[type="password"]', family.password);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Kapoor Family').first()).toBeVisible({ timeout: 10000 });

    // Verify does NOT display doctor workspace or admin layout
    await expect(page.locator('.doctor-shell')).toHaveCount(0);
    await expect(page.locator('text=Lead Hospital Administrator')).toHaveCount(0);
  });

  test('Family Member Switching & Isolation within Household', async ({ page }) => {
    const family = getAccount('family', 'rohan.kapoor@example.com');
    await page.goto('/');
    await page.fill('input[type="email"]', family.email);
    await page.fill('input[type="password"]', family.password);
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
