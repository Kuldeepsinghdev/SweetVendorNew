import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/fixtures';
import { loginAsAdmin, loginAsMitra } from '../helpers/auth';

/**
 * TC-SECURITY-001 through TC-SECURITY-007 — Access control and authorization
 *
 * Verifies that every protected route correctly blocks unauthorized access,
 * that session cookies cannot be swapped between admin and storefront systems,
 * and that role-based access is enforced server-side on all entry points.
 *
 * These tests do NOT require valid credentials for most cases —
 * they verify the unauthenticated/wrong-role redirect behaviour.
 */

const LOCALE = 'hi';

// ── Unauthenticated access ────────────────────────────────────────────────────

test.describe('TC-SECURITY-001 — Unauthenticated access to ALL protected routes', () => {
  const adminRoutes = [
    `/dashboard`,
    `/city-admin`,
    `/super-admin`,
    `/kendra`,
  ];

  const storefrontRoutes = [
    `/checkout`,
    `/mitra/portal`,
  ];

  test.describe('Admin routes redirect to /admin login', () => {
    for (const route of adminRoutes) {
      test(`${route} → redirects to /admin`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        expect(page.url()).toMatch(new RegExp(`/admin`));
        // Must NOT show dashboard content
        await expect(page.getByText(/super admin|city admin|kendra dashboard/i)).not.toBeVisible();
      });
    }
  });

  test.describe('Storefront routes redirect to /login', () => {
    for (const route of storefrontRoutes) {
      test(`${route} → redirects to /login`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        expect(page.url()).toMatch(new RegExp(`/login`));
      });
    }
  });
});

// ── Public routes remain accessible ──────────────────────────────────────────

test.describe('TC-SECURITY-002 — Public routes accessible without session', () => {
  const publicRoutes = [
    { url: `/`, desc: 'homepage catalog' },
    { url: `/admin`, desc: 'admin login page' },
    { url: `/login`, desc: 'mitra login page' },
    { url: `/mitra`, desc: 'mitra landing page' },
    { url: `/reset-password`, desc: 'password reset page' },
  ];

  for (const { url, desc } of publicRoutes) {
    test(`${desc} (${url}) is accessible without login`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      // Must NOT redirect away to a login page (except for admin/login pages themselves)
      if (!url.includes('/admin') && !url.includes('/login') && !url.includes('/reset')) {
        expect(page.url()).not.toMatch(/\/login(\?|$)/);
      }
      // Page should load (not blank or error)
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(10);
    });
  }
});

// ── Cross-session cookie isolation ───────────────────────────────────────────

test.describe('TC-SECURITY-004 — Admin and storefront session cookies are isolated', () => {
  test('a fake sahakar_session cookie does NOT grant mitra portal access', async ({ page, context }) => {
    // Inject a plausible-looking but invalid admin cookie
    await context.addCookies([{
      name: 'sahakar_session',
      value: 'eyJhbGciOiJIUzI1NiJ9.fake.payload',
      domain: 'localhost',
      path: '/',
      httpOnly: false, // Can't set httpOnly from test — just testing the guard logic
    }]);

    await page.goto(`/mitra/portal`);
    await page.waitForLoadState('networkidle');

    // Must redirect to mitra login — admin cookie is irrelevant for storefront
    expect(page.url()).toMatch(new RegExp(`/login`));
  });

  test('a fake sahakar_customer cookie does NOT grant admin dashboard access', async ({ page, context }) => {
    // Inject a plausible-looking but invalid customer cookie
    await context.addCookies([{
      name: 'sahakar_customer',
      value: 'eyJhbGciOiJIUzI1NiJ9.fake.customer',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
    }]);

    await page.goto(`/dashboard`);
    await page.waitForLoadState('networkidle');

    // Must redirect to admin login — customer cookie is irrelevant for admin
    expect(page.url()).toMatch(new RegExp(`/admin`));
  });

  test('a tampered sahakar_customer cookie is rejected (invalid JWT signature)', async ({ page, context }) => {
    // A JWT with a valid structure but wrong signature
    await context.addCookies([{
      name: 'sahakar_customer',
      value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfZmFrZSIsInJvbGUiOiJtaXRyYSIsImtpbmQiOiJjdXN0b21lciJ9.INVALID_SIGNATURE',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto(`/mitra/portal`);
    await page.waitForLoadState('networkidle');

    // JWT verification fails → redirect to login
    expect(page.url()).toMatch(new RegExp(`/login`));
  });
});

// ── Role-based access — Mitra cannot access admin ────────────────────────────

test.describe('TC-AUTH-008 / TC-MITRA-012 — Mitra cannot access admin routes', () => {
  test.beforeEach(async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.approvedMitra;
    if (!pin && !password) {
      test.skip(true, 'No mitra credentials — skipping role isolation test');
    }
    await loginAsMitra(page, { phone, pin, email, password });
  });

  const adminOnlyRoutes = [
    `/dashboard`,
    `/city-admin`,
    `/super-admin`,
    `/kendra`,
  ];

  for (const route of adminOnlyRoutes) {
    test(`authenticated mitra cannot access ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // Must redirect to admin login (mitra has no admin session)
      expect(page.url()).toMatch(new RegExp(`/admin`));
    });
  }
});

// ── Role-based access — Admin cannot access mitra portal ─────────────────────

test.describe('TC-AUTH-008 — Admin session does not grant mitra portal access', () => {
  test('logged-in super admin cannot access /mitra/portal', async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.superAdmin;
    if (!pin && !password) {
      test.skip(true, 'No super admin credentials');
    }
    await loginAsAdmin(page, { phone, pin, email, password });

    // Try to access storefront portal with admin session only
    await page.goto(`/mitra/portal`);
    await page.waitForLoadState('networkidle');

    // Admin has no sahakar_customer cookie → redirected to mitra login
    expect(page.url()).toMatch(new RegExp(`/login`));
  });
});

// ── Security headers ──────────────────────────────────────────────────────────

test.describe('TC-SECURITY-007 — Security response headers', () => {
  test('homepage has X-Frame-Options and X-Content-Type-Options headers', async ({ page }) => {
    const response = await page.goto(`/`);
    expect(response).toBeTruthy();

    const headers = response!.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('admin login page has security headers', async ({ page }) => {
    const response = await page.goto(`/admin`);
    expect(response).toBeTruthy();

    const headers = response!.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBeTruthy();
  });
});
