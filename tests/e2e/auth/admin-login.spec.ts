import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/fixtures';

/**
 * TC-AUTH-001 through TC-AUTH-005 — Admin authentication
 *
 * Tests the admin login page, credential validation, redirect behaviour,
 * and that all protected dashboard routes block unauthenticated access.
 *
 * Locale is no longer in the URL — the lang cookie controls language.
 */

const ADMIN_LOGIN_URL = '/admin';
const DASHBOARD_URL = '/dashboard';

test.describe('Admin Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_LOGIN_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-AUTH-001 — admin login page renders with both method tabs', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin$/);

    await expect(page.getByRole('button', { name: /mobile|मोबाइल/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /email|ईमेल/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|लॉगिन/i })).toBeVisible();
  });

  test('TC-AUTH-002 — invalid phone+PIN shows error, no redirect', async ({ page }) => {
    await page.getByLabel(/mobile|अधिकृत मोबाइल/i).fill('9999999999');
    await page.getByLabel(/pin|पिन/i).fill('0000');
    await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).not.toBeEmpty();
  });

  test('TC-AUTH-003 — URL does not contain a locale prefix', async ({ page }) => {
    // Core requirement: no /hi/ or /en/ in the URL
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
    expect(page.url()).toMatch(/\/admin$/);
  });

  test('TC-AUTH-004 — already signed-in admin is redirected to dashboard', async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.superAdmin;
    if (!pin && !password) {
      test.skip(true, 'No admin credentials set in TEST_SUPER_ADMIN_PIN or TEST_SUPER_ADMIN_PASSWORD');
    }

    if (pin) {
      await page.getByLabel(/mobile|अधिकृत मोबाइल/i).fill(phone);
      await page.getByLabel(/pin|पिन/i).fill(pin);
    } else {
      await page.getByRole('button', { name: /email/i }).click();
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
    }
    await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();
    await page.waitForURL(`${DASHBOARD_URL}**`);

    // Revisit login — should redirect back to dashboard
    await page.goto(ADMIN_LOGIN_URL);
    await expect(page).toHaveURL(new RegExp(DASHBOARD_URL));
  });
});

test.describe('Protected Admin Routes — Unauthenticated', () => {
  /**
   * TC-AUTH-005 / TC-SECURITY-001
   * All admin dashboard routes must redirect to /admin when no session exists.
   * URLs must never contain /hi or /en.
   */
  const protectedRoutes = [
    '/dashboard',
    '/city-admin',
    '/super-admin',
    '/kendra',
  ];

  for (const route of protectedRoutes) {
    test(`should redirect ${route} to admin login when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Final URL must be /admin — no locale prefix
      expect(page.url()).toMatch(/\/admin/);
      expect(page.url()).not.toMatch(/\/(hi|en)\//);
    });
  }
});
