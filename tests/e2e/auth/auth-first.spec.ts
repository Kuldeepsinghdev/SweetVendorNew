import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/fixtures';
import { loginAsMitra, logoutMitra } from '../helpers/auth';

/**
 * TC-AUTH-FIRST — Authentication-First Architecture Tests
 *
 * Tests the auth-first migration: all public-facing routes require authentication.
 * This test suite verifies:
 * - Unauthenticated access to / redirects to /login
 * - Customer login flow: phone+PIN → redirect to /
 * - Mitra login flow: phone+PIN → redirect to /mitra/portal
 * - Session persistence across pages
 * - Logout clears session
 * - Admin routes still require admin session (not customer session)
 *
 * Locale is in the cookie, not the URL.
 * No /hi or /en prefixes in any URL.
 */

test.describe('Auth-First Migration — Unauthenticated Access', () => {
  /**
   * TC-AUTH-FIRST-001
   * Unauthenticated user accessing / should redirect to /login
   */
  test('TC-AUTH-FIRST-001 — should redirect / to /login when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Must redirect to /login, no locale prefix
    expect(page.url()).toMatch(/\/login/);
    expect(page.url()).not.toMatch(/\/(hi|en)\//);

    // Login form should be visible
    await expect(page.getByRole('heading', { name: /sign in|लॉगिन/i })).toBeVisible();
  });

  /**
   * TC-AUTH-FIRST-002
   * Unauthenticated user cannot access /checkout
   */
  test('TC-AUTH-FIRST-002 — should redirect /checkout to /login when unauthenticated', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toMatch(/\/login/);
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
  });

  /**
   * TC-AUTH-FIRST-003
   * Unauthenticated user cannot access /mitra/portal
   */
  test('TC-AUTH-FIRST-003 — should redirect /mitra/portal to /login when unauthenticated', async ({ page }) => {
    await page.goto('/mitra/portal');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toMatch(/\/login/);
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
  });

  /**
   * TC-AUTH-FIRST-004
   * Public pages (login, admin, mitra/apply, reset-password) should be accessible without auth
   */
  test('TC-AUTH-FIRST-004 — public auth pages should be accessible without authentication', async ({ page }) => {
    const publicPages = ['/login', '/admin', '/mitra/apply', '/reset-password'];

    for (const url of publicPages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(new RegExp(url.replace(/\//g, '\\/')));
      expect(page.url()).not.toMatch(/\/(hi|en)\//);
    }
  });
});

test.describe('Auth-First Migration — Customer Login & Portal', () => {
  /**
   * TC-AUTH-FIRST-005
   * Customer login with phone+PIN should redirect to /
   */
  test('TC-AUTH-FIRST-005 — customer login should redirect to home (/)', async ({ page }) => {
    const { phone, pin } = TEST_USERS.approvedMitra;

    if (!phone || !pin) {
      test.skip(true, 'Mitra credentials (TEST_MITRA_PHONE/PIN) not set in environment');
    }

    // Login as mitra (which is a type of customer)
    await loginAsMitra(page, { phone, pin });

    // Should be redirected to / after login
    expect(page.url()).toMatch(/\/$/);
    expect(page.url()).not.toMatch(/\/(hi|en)\//);

    // Should see catalog content (not login form)
    await expect(page.getByRole('heading', { name: /मिठाई|sweet/i }).first()).toBeVisible({ timeout: 5000 });
  });

  /**
   * TC-AUTH-FIRST-006
   * Mitra login should redirect appropriately based on role
   */
  test('TC-AUTH-FIRST-006 — mitra login should be authenticated', async ({ page }) => {
    const { phone, pin } = TEST_USERS.approvedMitra;

    if (!phone || !pin) {
      test.skip(true, 'Mitra credentials not set');
    }

    // Logout first to ensure clean state
    await page.context().clearCookies();

    // Navigate to login
    await loginAsMitra(page, { phone, pin });

    // Should not be on /login anymore
    await expect(page).not.toHaveURL(/\/login/);
  });

  /**
   * TC-AUTH-FIRST-007
   * Session persistence: logged-in user can navigate between protected pages
   */
  test('TC-AUTH-FIRST-007 — session should persist across protected pages', async ({ page }) => {
    const { phone, pin } = TEST_USERS.approvedMitra;

    if (!phone || !pin) {
      test.skip(true, 'Mitra credentials not set');
    }

    await loginAsMitra(page, { phone, pin });

    // Navigate to / and verify session is active
    await page.goto('/');
    await expect(page).not.toHaveURL(/\/login/);

    // Navigate to /checkout and verify session still active
    await page.goto('/checkout');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /checkout|चेकआउट/i }).first()).toBeVisible({ timeout: 5000 });

    // Navigate back to / and verify session still active
    await page.goto('/');
    await expect(page).not.toHaveURL(/\/login/);
  });

  /**
   * TC-AUTH-FIRST-008
   * Logout should clear session and redirect to /login
   */
  test('TC-AUTH-FIRST-008 — logout should clear session and redirect to login', async ({ page }) => {
    const { phone, pin } = TEST_USERS.approvedMitra;

    if (!phone || !pin) {
      test.skip(true, 'Mitra credentials not set');
    }

    await loginAsMitra(page, { phone, pin });
    await page.waitForLoadState('networkidle');

    // Call logout helper
    await logoutMitra(page);

    // Should be redirected to /login after logout
    expect(page.url()).toMatch(/\/login/);

    // Try to access / — should redirect to /login
    await page.goto('/');
    expect(page.url()).toMatch(/\/login/);
  });
});

test.describe('Auth-First Migration — Session Isolation', () => {
  /**
   * TC-AUTH-FIRST-009
   * Admin session (sahakar_session) should not grant access to customer routes
   */
  test('TC-AUTH-FIRST-009 — admin session should not access customer routes', async ({ browser }) => {
    const { phone: adminPhone, pin: adminPin } = TEST_USERS.superAdmin;

    if (!adminPhone || !adminPin) {
      test.skip(true, 'Admin credentials not set');
    }

    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as admin
    await page.goto('/admin');
    await page.getByLabel(/mobile|मोबाइल/i).fill(adminPhone);
    await page.getByLabel(/pin|पिन/i).fill(adminPin);
    await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();
    await page.waitForURL('/dashboard**');

    // Verify admin is logged into dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard|डैशबोर्ड/i }).first()).toBeVisible();

    // Try to access /checkout — should fail or redirect
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    // Should redirect to /login (admin session doesn't grant checkout access)
    // OR show an error/forbidden page
    // The key is: they shouldn't see the checkout page
    const urlDoesNotMatch = !page.url().includes('/checkout');
    const hasNoCheckoutHeading = !(await page.getByRole('heading', { name: /checkout/i }).isVisible().catch(() => false));

    expect(urlDoesNotMatch || hasNoCheckoutHeading).toBeTruthy();

    await context.close();
  });

  /**
   * TC-AUTH-FIRST-010
   * Customer session (sahakar_customer) should not access admin routes
   */
  test('TC-AUTH-FIRST-010 — customer session should not access admin routes', async ({ browser }) => {
    const { phone, pin } = TEST_USERS.approvedMitra;

    if (!phone || !pin) {
      test.skip(true, 'Mitra credentials not set');
    }

    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as customer/mitra
    await loginAsMitra(page, { phone, pin });

    // Try to access /dashboard — should redirect to admin login
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should redirect to /admin (different session type required)
    expect(page.url()).toMatch(/\/admin/);

    await context.close();
  });
});

test.describe('Auth-First Migration — Preserved Functionality', () => {
  /**
   * TC-AUTH-FIRST-011
   * Existing functionality should continue to work (login still works)
   */
  test('TC-AUTH-FIRST-011 — login form should accept valid credentials', async ({ page }) => {
    const { phone, pin } = TEST_USERS.approvedMitra;

    if (!phone || !pin) {
      test.skip(true, 'Mitra credentials not set');
    }

    await page.goto('/login');
    await page.getByLabel(/mobile|phone|मोबाइल/i).fill(phone);
    await page.getByLabel(/pin|पिन/i).fill(pin);
    await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();
    await page.waitForLoadState('networkidle');

    // Should not be on /login anymore
    expect(page.url()).not.toMatch(/\/login/);
  });

  /**
   * TC-AUTH-FIRST-012
   * Invalid credentials should show error, not redirect
   */
  test('TC-AUTH-FIRST-012 — invalid credentials should show error, not redirect', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/mobile|phone|मोबाइल/i).fill('9999999999');
    await page.getByLabel(/pin|पिन/i).fill('0000');
    await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();

    // Should still be on /login
    expect(page.url()).toMatch(/\/login/);

    // Should show error message
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  /**
   * TC-AUTH-FIRST-013
   * Public mitra/apply page should remain public
   */
  test('TC-AUTH-FIRST-013 — /mitra/apply should remain public', async ({ page }) => {
    await page.goto('/mitra/apply');
    await page.waitForLoadState('networkidle');

    // Should stay on /mitra/apply (no redirect)
    expect(page.url()).toMatch(/\/mitra\/apply/);

    // Should show mitra application form
    await expect(page.getByRole('heading', { name: /mitra|apply/i }).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Auth-First Migration — URL Structure', () => {
  /**
   * TC-AUTH-FIRST-014
   * No URLs should contain /hi/ or /en/ locale prefix
   * Locale is controlled by the cookie, not the URL
   */
  test('TC-AUTH-FIRST-014 — no URLs should have locale prefix (/hi/ or /en/)', async ({ page }) => {
    const urlsToCheck = [
      '/',
      '/login',
      '/admin',
      '/mitra/apply',
      '/reset-password',
    ];

    for (const url of urlsToCheck) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // URL must not have /hi/ or /en/
      expect(page.url()).not.toMatch(/\/(hi|en)\//);
      console.log(`✓ ${url} has no locale prefix`);
    }
  });
});
