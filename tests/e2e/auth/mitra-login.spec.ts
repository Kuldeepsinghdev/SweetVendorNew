import { test, expect } from '@playwright/test';

/**
 * TC-AUTH-006 through TC-AUTH-009 — Mitra/Customer authentication
 *
 * Tests storefront login (sahakar_customer session), protected routes,
 * session isolation from admin, and logout.
 *
 * Locale is no longer in the URL — the lang cookie controls language.
 */

test.describe('Mitra Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('TC-AUTH-006 — mitra login page renders correctly', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    // URL must not contain a locale prefix
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
    await expect(page.getByRole('button', { name: /sign in|लॉगिन/i })).toBeVisible();
  });

  test('TC-AUTH-007 — invalid credentials show error', async ({ page }) => {
    await page.getByLabel(/mobile|phone|मोबाइल/i).fill('9000000000');
    await page.getByLabel(/pin|पिन/i).fill('9999');
    await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('alert')).toBeVisible();
  });
});

test.describe('Mitra Protected Routes — Unauthenticated', () => {
  /**
   * TC-SECURITY-001 — storefront protected routes redirect to /login.
   * URLs must never include a locale prefix.
   */
  const protectedStorefrontRoutes = ['/checkout', '/mitra/portal'];

  for (const route of protectedStorefrontRoutes) {
    test(`should redirect ${route} to /login when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      expect(page.url()).toMatch(/\/login/);
      expect(page.url()).not.toMatch(/\/(hi|en)\//);
    });
  }
});

test.describe('Session Isolation', () => {
  test('TC-AUTH-008 — admin login page is accessible without session', async ({ page }) => {
    const response = await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/admin$/);
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
    await expect(page.getByRole('button', { name: /sign in|लॉगिन/i })).toBeVisible();
  });

  test('TC-AUTH-009 — sahakar_customer cookie cannot grant admin access', async ({ page, context }) => {
    await context.addCookies([{
      name: 'sahakar_customer',
      value: 'fake_invalid_token',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/admin/);
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
  });

  test('TC-SECURITY-004 — fake sahakar_session cookie cannot grant mitra access', async ({ page, context }) => {
    await context.addCookies([{
      name: 'sahakar_session',
      value: 'fake_invalid_admin_token',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/mitra/portal');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/login/);
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
  });
});
