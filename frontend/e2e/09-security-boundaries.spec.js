import { test, expect } from '@playwright/test';

test.describe('Security Boundaries & Unauthenticated Handling E2E Suite', () => {
  test('Unauthenticated Direct Access Redirects to Login', async ({ page }) => {
    await page.goto('/');
    // Check login form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Invalid Credentials Display User-Friendly Alert', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'nonexistent.user@medimind.invalid');
    await page.fill('input[type="password"]', 'WrongPassword999!');
    await page.click('button[type="submit"]');

    // Verify error notification / alert
    await expect(page.locator('text=Invalid email or password').or(page.locator('div[role="alert"]')).first()).toBeVisible({ timeout: 10000 });
    // Verify does NOT grant access to any dashboard
    await expect(page.locator('text=Dashboard')).toHaveCount(0);
  });

  test('API Gateway Strips Spoofed Client Identity Headers', async ({ request }) => {
    // Attempt spoofing x-user-id and x-user-role without valid JWT
    const response = await request.get('http://localhost:5000/api/auth/me', {
      headers: {
        'x-user-id': 'spoofed-admin-id',
        'x-user-role': 'CHAIRMAN',
      },
    });
    // Must be rejected with 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});
