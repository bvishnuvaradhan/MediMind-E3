import { test, expect } from '@playwright/test';

const PASSWORD = 'Password123!';

test.describe('Responsive Viewport Sanity E2E Suite', () => {
  test('Desktop Viewport (1280x800) Family Health Workspace', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.fill('input[type="email"]', 'rohan.kapoor@example.com');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Kapoor Family').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('Tablet Viewport (768x1024) Doctor Clinical Workspace', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.fill('input[type="email"]', 'rahul.mehta@medimindhospital.com');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dr. Rahul Mehta').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('Mobile Viewport (375x667) Chairman Platform Dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.fill('input[type="email"]', 'chairman@medimind.org');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Platform Dashboard').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });
});
