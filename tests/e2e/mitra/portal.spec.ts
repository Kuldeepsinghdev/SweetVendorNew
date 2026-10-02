import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/fixtures';
import { loginAsMitra } from '../helpers/auth';

/**
 * TC-MITRA-012 — Mitra portal access and identity display
 *
 * Tests that an approved Mitra can access their portal and see
 * correct identity information.
 */

const LOCALE = 'hi';
const PORTAL_URL = `/mitra/portal`;

test.describe('Mitra Portal', () => {
  test.beforeEach(async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.approvedMitra;
    if (!pin && !password) {
      test.skip(true, 'No approved mitra credentials set in TEST_MITRA_PIN or TEST_MITRA_PASSWORD');
    }
    await loginAsMitra(page, { phone, pin, email, password });
    await page.goto(PORTAL_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-MITRA-012 — approved mitra can access portal', async ({ page }) => {
    // Must NOT redirect to login
    expect(page.url()).toMatch(new RegExp(PORTAL_URL));
    // Mitra name should be visible
    await expect(page.getByText(TEST_USERS.approvedMitra.name)).toBeVisible();
  });

  test('portal opens on the dashboard and catalog navigation uses the Mitra catalog', async ({ page }) => {
    await expect(page.getByRole('button', { name: /dashboard|डैशबोर्ड/i })).toHaveClass(/bg-amber-600/);
    await expect(page.getByRole('link', { name: /browse catalog|कैटलॉग देखें/i })).toHaveAttribute('href', '/mitra/catalog');
  });

  test('should show mitra city assignment', async ({ page }) => {
    // City name must appear in the portal
    await expect(page.getByText(/सवाई माधोपुर|Sawai Madhopur/i)).toBeVisible();
  });

  test('should show bookings tab', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /booking|बुकिंग/i })).toBeVisible();
  });

  test('mitra portal does not redirect to admin (session isolation)', async ({ page }) => {
    // Mitra using storefront session must not see admin content
    await expect(page.getByText(/super admin|city admin|kendra/i)).not.toBeVisible();
  });
});

test.describe('Mitra Cannot Access Admin Routes', () => {
  test.beforeEach(async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.approvedMitra;
    if (!pin && !password) {
      test.skip(true, 'No mitra credentials set');
    }
    await loginAsMitra(page, { phone, pin, email, password });
  });

  test('mitra cannot access /dashboard', async ({ page }) => {
    await page.goto(`/dashboard`);
    await page.waitForLoadState('networkidle');
    // Should redirect to admin login (no admin session)
    expect(page.url()).toMatch(new RegExp(`/admin`));
  });

  test('mitra cannot access /city-admin', async ({ page }) => {
    await page.goto(`/city-admin`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(new RegExp(`/admin`));
  });

  test('mitra cannot access /super-admin', async ({ page }) => {
    await page.goto(`/super-admin`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(new RegExp(`/admin`));
  });
});
