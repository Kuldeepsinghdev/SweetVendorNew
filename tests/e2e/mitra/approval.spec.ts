import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/fixtures';
import { loginAsAdmin } from '../helpers/auth';

/**
 * TC-MITRA-008 through TC-MITRA-011 — Mitra approval and rejection
 *
 * Tests that City Admin and Super Admin can approve/reject Mitra applications,
 * and that the approval creates a proper user record.
 *
 * Precondition: A pending Mitra application must exist in the DB.
 * Create one via: TC-MITRA-006 registration test, or insert directly via seed script.
 */

const LOCALE = 'hi';

test.describe('Mitra Approval — City Admin', () => {
  test.beforeEach(async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.cityAdminSawai;
    if (!pin && !password) {
      test.skip(true, 'No city admin credentials set in environment variables');
    }
    await loginAsAdmin(page, { phone, pin, email, password });
    await page.goto(`/city-admin`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-MITRA-008 — city admin can view pending applications', async ({ page }) => {
    // Navigate to Mitras tab
    await page.getByRole('tab', { name: /mitra|आवेदन/i }).click();

    // Should show a list of applications
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('TC-MITRA-008 — city admin can approve a pending application', async ({ page }) => {
    await page.getByRole('tab', { name: /mitra|आवेदन/i }).click();

    // Find a pending application row
    const pendingRow = page.getByText(/pending|लंबित/i).first();
    if (!(await pendingRow.isVisible())) {
      test.skip(true, 'No pending applications in DB — run registration test first');
    }

    // Click Approve button in that row
    const approveBtn = page.getByRole('button', { name: /approve|स्वीकृत/i }).first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Status should update to approved
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/approved|स्वीकृत/i).first()).toBeVisible();
  });

  test('TC-MITRA-011 — city admin can reject a pending application with reason', async ({ page }) => {
    await page.getByRole('tab', { name: /mitra|आवेदन/i }).click();

    const rejectBtn = page.getByRole('button', { name: /reject|अस्वीकृत/i }).first();
    if (!(await rejectBtn.isVisible())) {
      test.skip(true, 'No pending applications available to reject');
    }

    await rejectBtn.click();

    // Enter rejection reason in the dialog/form
    const reasonField = page.getByPlaceholder(/reason|कारण/i);
    if (await reasonField.isVisible()) {
      await reasonField.fill('Incomplete documentation / अधूरे दस्तावेज़');
    }

    await page.getByRole('button', { name: /confirm|reject|अस्वीकृत/i }).last().click();
    await page.waitForLoadState('networkidle');

    // Status should show rejected
    await expect(page.getByText(/rejected|अस्वीकृत/i).first()).toBeVisible();
  });
});

test.describe('TC-MITRA-009 — Super Admin can approve Mitra via City Admin panel', () => {
  test('super admin role satisfies city admin requirement (role hierarchy)', async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.superAdmin;
    if (!pin && !password) {
      test.skip(true, 'No super admin credentials set');
    }

    await loginAsAdmin(page, { phone, pin, email, password });

    // Super admin navigates to city-admin panel (role hierarchy allows this)
    await page.goto(`/city-admin`);
    await page.waitForLoadState('networkidle');

    // Should NOT be redirected away — super_admin passes city_admin role check
    expect(page.url()).not.toMatch(/\/admin(\?|$)/);
    await expect(page.getByRole('tab', { name: /mitra|आवेदन/i })).toBeVisible();
  });
});

test.describe('TC-MITRA-010 — Super Admin dashboard missing Mitras tab (BUG-005)', () => {
  test('super admin dashboard should have a Mitras tab (currently missing)', async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.superAdmin;
    if (!pin && !password) {
      test.skip(true, 'No super admin credentials set');
    }

    await loginAsAdmin(page, { phone, pin, email, password });
    await page.goto(`/super-admin`);
    await page.waitForLoadState('networkidle');

    // BUG-005: This tab does NOT currently exist — test documents desired state
    // Once ADMIN-003 is implemented, this test should PASS
    await expect(
      page.getByRole('tab', { name: /mitra|आवेदन/i })
    ).toBeVisible(); // WILL FAIL until BUG-005 is fixed
  });
});
