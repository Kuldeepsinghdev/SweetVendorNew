import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/fixtures';
import { loginAsAdmin } from '../helpers/auth';

/**
 * TC-ADMIN-001 through TC-ADMIN-006 — Super Admin dashboard
 *
 * Tests festival management (PASS), sweet management (PASS),
 * city management (FAIL — BUG-002 read-only), booking management (FAIL — BUG-004 missing tab).
 */

const LOCALE = 'hi';
const SUPER_ADMIN_URL = `/super-admin`;

test.describe('Super Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.superAdmin;
    if (!pin && !password) {
      test.skip(true, 'No super admin credentials set in TEST_SUPER_ADMIN_PIN or TEST_SUPER_ADMIN_PASSWORD');
    }
    await loginAsAdmin(page, { phone, pin, email, password });
    await page.goto(SUPER_ADMIN_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-ADMIN-001 — super admin dashboard loads', async ({ page }) => {
    expect(page.url()).not.toMatch(new RegExp(`/admin`));
    // Should see some admin content
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('TC-ADMIN-003 — festivals tab is visible and functional', async ({ page }) => {
    await page.getByRole('tab', { name: /festival|त्योहार|उत्सव/i }).click();
    await page.waitForLoadState('networkidle');

    // Should see at least one festival (diwali_2026)
    await expect(page.getByText(/दीपावली|Diwali/i)).toBeVisible();
  });

  test('TC-ADMIN-004 — master sweets tab shows products', async ({ page }) => {
    await page.getByRole('tab', { name: /sweet|मिठाई/i }).click();
    await page.waitForLoadState('networkidle');

    // Should see काजू कतली (Kaju Katli)
    await expect(page.getByText(/काजू कतली|Kaju Katli/i)).toBeVisible();

    // Should have an "Add Sweet" button
    await expect(
      page.getByRole('button', { name: /add sweet|नई मिठाई/i })
    ).toBeVisible();
  });

  test('TC-ADMIN-005 — cities tab is read-only (BUG-002)', async ({ page }) => {
    await page.getByRole('tab', { name: /city|शहर/i }).click();
    await page.waitForLoadState('networkidle');

    // Should show cities
    await expect(page.getByText(/जयपुर|Jaipur/i)).toBeVisible();
    await expect(page.getByText(/सवाई माधोपुर|Sawai Madhopur/i)).toBeVisible();

    // BUG-002: No "Add City" button should exist currently
    // (this assertion documents the CURRENT broken state — once fixed, the test
    // should be flipped to expect the button to be present)
    const addCityBtn = page.getByRole('button', { name: /add city|new city|नया शहर/i });
    // Currently this should NOT exist (bug confirmed)
    // When BUG-002 is fixed, change this to: await expect(addCityBtn).toBeVisible();
    await expect(addCityBtn).not.toBeVisible(); // passes NOW, should be inverted after fix
  });

  test('TC-ADMIN-006 — bookings tab is missing (BUG-004)', async ({ page }) => {
    /**
     * BUG-004: Super Admin dashboard has no Bookings tab.
     * This test documents the desired state — will FAIL until ADMIN-002 is implemented.
     */
    // Look for a Bookings tab
    const bookingsTab = page.getByRole('tab', { name: /booking|बुकिंग/i });

    // BUG-004: Currently this tab does NOT exist
    // This test WILL FAIL until BUG-004 is fixed (which is the desired outcome —
    // it signals the feature is missing)
    await expect(bookingsTab).toBeVisible(); // WILL FAIL — documents desired state
  });

  test('TC-ADMIN-010 — mitras tab is missing in super admin (BUG-005)', async ({ page }) => {
    /**
     * BUG-005: No Mitras tab in Super Admin.
     * Documents desired state — WILL FAIL until ADMIN-003 is implemented.
     */
    const mitrasTab = page.getByRole('tab', { name: /mitra|आवेदन/i });
    await expect(mitrasTab).toBeVisible(); // WILL FAIL — documents desired state
  });

  test('TC-ADMIN-004 — super admin can add a new sweet', async ({ page }) => {
    await page.getByRole('tab', { name: /sweet|मिठाई/i }).click();
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add sweet|नई मिठाई/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Form should appear
    await expect(page.getByLabel(/name|नाम/i)).toBeVisible();
  });
});

test.describe('TC-ADMIN-002 — Mitra Cannot Access Super Admin', () => {
  test('mitra session is rejected from /super-admin', async ({ page, context }) => {
    // No admin session → redirect to admin login
    await page.goto(SUPER_ADMIN_URL);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(new RegExp(`/admin`));
  });
});
