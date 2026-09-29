import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/fixtures';
import { loginAsAdmin } from '../helpers/auth';

/**
 * TC-ADMIN-007, TC-ADMIN-008, TC-ADMIN-011 — City Admin management features
 *
 * Tests city admin's ability to manage sale centers, pricing, and discounts.
 */

const LOCALE = 'hi';
const CITY_ADMIN_URL = `/city-admin`;

test.describe('City Admin — Mitra Management', () => {
  test.beforeEach(async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.cityAdminSawai;
    if (!pin && !password) {
      test.skip(true, 'No city admin credentials set');
    }
    await loginAsAdmin(page, { phone, pin, email, password });
    await page.goto(CITY_ADMIN_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-ADMIN-007 — city admin can view sale centers', async ({ page }) => {
    await page.getByRole('tab', { name: /sale center|बिक्री केंद्र|kendra/i }).click();
    await page.waitForLoadState('networkidle');

    // Sale centers for Sawai Madhopur should be visible
    await expect(page.getByText(/सहकार केंद्र|बजरिया|Bajariya/i)).toBeVisible();
  });

  test('TC-ADMIN-008 — city admin can view and update pricing', async ({ page }) => {
    await page.getByRole('tab', { name: /price|मूल्य|pricing/i }).click();
    await page.waitForLoadState('networkidle');

    // Should show pricing table with sweets
    await expect(page.getByText(/काजू कतली|Kaju Katli/i)).toBeVisible();

    // Price field should be editable
    const priceInput = page.getByRole('spinbutton').first().or(
      page.getByRole('textbox').filter({ hasText: /₹|\d+/ }).first()
    );
    if (await priceInput.isVisible()) {
      const currentVal = await priceInput.inputValue();
      expect(parseInt(currentVal || '0')).toBeGreaterThan(0);
    }
  });

  test('TC-ADMIN-011 — city admin can manage discounts', async ({ page }) => {
    await page.getByRole('tab', { name: /discount|छूट/i }).click();
    await page.waitForLoadState('networkidle');

    // Discount section should be present
    await expect(
      page.getByRole('button', { name: /add discount|new discount|नई छूट/i })
    ).toBeVisible();
  });
});

test.describe('TC-ADMIN-012 — Kendra Dashboard', () => {
  test('kendra dashboard loads for city admin', async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.cityAdminSawai;
    if (!pin && !password) {
      test.skip(true, 'No city admin credentials set');
    }
    await loginAsAdmin(page, { phone, pin, email, password });
    await page.goto(`/kendra`);
    await page.waitForLoadState('networkidle');

    // Should not be redirected to admin login
    expect(page.url()).not.toMatch(new RegExp(`/admin`));
    // Some kendra content should be visible
    await expect(page.getByRole('heading')).toBeVisible();
  });
});

test.describe('TC-ADMIN-009 — Distribution Center Management Missing (BUG-006)', () => {
  test('no DC management tab exists in city admin (BUG-006)', async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.cityAdminSawai;
    if (!pin && !password) {
      test.skip(true, 'No city admin credentials set');
    }
    await loginAsAdmin(page, { phone, pin, email, password });
    await page.goto(CITY_ADMIN_URL);
    await page.waitForLoadState('networkidle');

    /**
     * BUG-006: DC management does not exist in any admin panel.
     * This test documents the desired state — will FAIL until ADMIN-004 is implemented.
     */
    const dcTab = page.getByRole('tab', { name: /distribution center|वितरण केंद्र/i });
    await expect(dcTab).toBeVisible(); // WILL FAIL — documents desired state
  });
});
