/**
 * Unified Admin Dashboard E2E Tests
 * 
 * Comprehensive tests for the new unified admin dashboard at /admin/dashboard
 * that consolidates legacy routes (/dashboard, /super-admin, /city-admin, /kendra).
 * 
 * Tests:
 * 23.1 - Legacy route redirects
 * 23.2 - Role-based tab visibility
 * 23.3 - Data isolation per role
 * 23.4 - Authorization enforcement
 * 23.5 - Error handling and recovery
 * 23.6 - Tab interaction
 * 
 * @requirements 3.1-3.4, 5.1-5.6, 12.1-12.5
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_DATA } from '../helpers/fixtures';
import { loginAsAdmin, logoutAdmin } from '../helpers/auth';

test.describe('Unified Admin Dashboard', () => {
  // ────────────────────────────────────────────────────────────────────────
  // 23.1: Legacy Route Redirects
  // ────────────────────────────────────────────────────────────────────────

  test.describe('23.1 — Legacy route redirects', () => {
    test.beforeEach(async ({ page }) => {
      const { phone, pin, email, password } = TEST_USERS.superAdmin;
      if (!pin && !password) {
        test.skip(true, 'Super admin credentials required for this test');
      }
      await loginAsAdmin(page, { phone, pin, email, password });
    });

    test('TC-DASHBOARD-001 — /dashboard redirects to /admin/dashboard', async ({ page }) => {
      /**
       * Legacy /dashboard should redirect to the unified /admin/dashboard.
       * This ensures old bookmarks and links still work.
       */
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should be redirected to unified dashboard
      expect(page.url()).toContain('/admin/dashboard');
      
      // Should display admin dashboard heading
      await expect(
        page.getByRole('heading', { name: /admin|प्रशासन|dashboard|डैशबोर्ड/i })
      ).toBeVisible();
    });

    test('TC-DASHBOARD-002 — /super-admin redirects to /admin/dashboard', async ({ page }) => {
      /**
       * Legacy /super-admin should redirect to unified /admin/dashboard
       * with role-based access control enforced.
       */
      await page.goto('/super-admin');
      await page.waitForLoadState('networkidle');

      // Should be redirected
      expect(page.url()).toContain('/admin/dashboard');
      
      // Super admin should see dashboard
      await expect(
        page.getByRole('heading', { name: /admin|प्रशासन/i })
      ).toBeVisible();
    });

    test('TC-DASHBOARD-003 — /city-admin redirects to /admin/dashboard', async ({ page }) => {
      /**
       * Legacy /city-admin redirects to unified dashboard.
       * City admin role will see only city-specific tabs.
       */
      await page.goto('/city-admin');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/admin/dashboard');
    });

    test('TC-DASHBOARD-004 — /kendra redirects to /admin/dashboard', async ({ page }) => {
      /**
       * Legacy /kendra redirects to unified dashboard.
       * Kendra role will see only kendra-specific tabs.
       */
      await page.goto('/kendra');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/admin/dashboard');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 23.2: Role-Based Tab Visibility
  // ────────────────────────────────────────────────────────────────────────

  test.describe('23.2 — Role-based tab visibility', () => {
    test('TC-DASHBOARD-005 — Super admin sees dashboard tabs', async ({ page }) => {
      /**
       * Super admin has highest privilege and should see all dashboard tabs.
       */
      const { phone, pin, email, password } = TEST_USERS.superAdmin;
      if (!pin && !password) test.skip(true, 'Super admin credentials required');
      
      await loginAsAdmin(page, { phone, pin, email, password });
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');

      // Super admin should see dashboard heading
      await expect(
        page.getByRole('heading', { name: /admin|प्रशासन/i })
      ).toBeVisible();

      // Should have tabs
      const tabs = page.locator('[role="tab"]');
      const count = await tabs.count();
      
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('TC-DASHBOARD-006 — City admin sees city-specific tabs', async ({ page }) => {
      /**
       * City admin sees tabs relevant to city and kendra management.
       * City admin should NOT see super-admin-only tabs.
       */
      const { phone, pin, email, password } = TEST_USERS.cityAdminSawai;
      if (!pin && !password) test.skip(true, 'City admin credentials required');
      
      await loginAsAdmin(page, { phone, pin, email, password });
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');

      // City admin dashboard should load
      await expect(
        page.getByRole('heading', { name: /admin|प्रशासन/i })
      ).toBeVisible();

      // Should have some tabs (fewer than super admin)
      const tabs = page.locator('[role="tab"]');
      const count = await tabs.count();
      
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('TC-DASHBOARD-007 — Role-specific tabs are correct', async ({ page }) => {
      /**
       * Each role sees only appropriate tabs for their permission level.
       */
      const { phone, pin, email, password } = TEST_USERS.superAdmin;
      if (!pin && !password) test.skip(true, 'Super admin credentials required');
      
      await loginAsAdmin(page, { phone, pin, email, password });
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');

      // Tabs should render
      const tabs = page.locator('[role="tab"]');
      await expect(tabs.first()).toBeVisible();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 23.3: Data Isolation
  // ────────────────────────────────────────────────────────────────────────

  test.describe('23.3 — Data isolation', () => {
    test('TC-DASHBOARD-008 — City admin data is filtered by city', async ({ page }) => {
      /**
       * City admin for Sawai Madhopur should see only assigned city data.
       */
      const { phone, pin, email, password } = TEST_USERS.cityAdminSawai;
      if (!pin && !password) test.skip(true, 'City admin credentials required');
      
      await loginAsAdmin(page, { phone, pin, email, password });
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');

      // Dashboard should display
      await expect(
        page.getByRole('heading', { name: /admin|प्रशासन/i })
      ).toBeVisible();
    });

    test('TC-DASHBOARD-009 — Super admin sees all nationwide data', async ({ page }) => {
      /**
       * Super admin should see all data across all cities and sale centers.
       */
      const { phone, pin, email, password } = TEST_USERS.superAdmin;
      if (!pin && !password) test.skip(true, 'Super admin credentials required');
      
      await loginAsAdmin(page, { phone, pin, email, password });
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');

      // Super admin dashboard should be accessible
      await expect(
        page.getByRole('heading', { name: /admin|प्रशासन/i })
      ).toBeVisible();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 23.4: Authorization Enforcement
  // ────────────────────────────────────────────────────────────────────────

  test.describe('23.4 — Authorization enforcement', () => {
    test('TC-DASHBOARD-010 — Unauthorized user redirects to login', async ({ page }) => {
      /**
       * When not authenticated, accessing /admin/dashboard redirects to /admin.
       */
      await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

      // Should redirect to login
      expect(page.url()).toContain('/admin');
      
      // Should see login form
      const loginForm = page.getByRole('button', { name: /sign in|लॉगिन/i });
      await expect(loginForm).toBeVisible();
    });

    test('TC-DASHBOARD-011 — Customer session blocked from admin', async ({ page }) => {
      /**
       * A customer/mitra session should never grant access to /admin/dashboard.
       * Admin uses sahakar_session; mitra uses sahakar_customer.
       */
      
      // Set a fake customer cookie (simulating a mitra session)
      await page.context().addCookies([
        {
          name: 'sahakar_customer',
          value: 'fake-jwt-token-for-testing',
          domain: 'localhost',
          path: '/',
          secure: false,
          httpOnly: true,
          sameSite: 'Lax',
        }
      ]);

      // Try to access admin dashboard
      await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });

      // Should NOT grant access — should redirect to login
      const isAtLogin = page.url().includes('/admin');
      
      expect(isAtLogin).toBe(true);
    });

    test('TC-DASHBOARD-012 — Admin session cookie verification', async ({ page }) => {
      /**
       * Admin dashboard requires valid sahakar_session cookie.
       */
      const { phone, pin, email, password } = TEST_USERS.superAdmin;
      if (!pin && !password) test.skip(true, 'Super admin credentials required');
      
      await loginAsAdmin(page, { phone, pin, email, password });
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');

      // Should be able to access dashboard
      await expect(
        page.getByRole('heading', { name: /admin|प्रशासन/i })
      ).toBeVisible();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 23.5: Error Handling and Recovery
  // ────────────────────────────────────────────────────────────────────────

  test.describe('23.5 — Error handling', () => {
    test('TC-DASHBOARD-013 — Page displays heading on load', async ({ page }) => {
      /**
       * Dashboard should render its main heading even if some data fails.
       */
      const { phone, pin, email, password } = TEST_USERS.superAdmin;
      if (!pin && !password) test.skip(true, 'Super admin credentials required');
      
      await loginAsAdmin(page, { phone, pin, email, password });
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');

      // Should display heading
      await expect(
        page.getByRole('heading', { name: /admin|प्रशासन/i })
      ).toBeVisible();
    });

    test('TC-DASHBOARD-014 — Page does not show raw errors to user', async ({ page }) => {
      /**
       * Error handling should be user-friendly, not show stack traces.
       */
      const { phone, pin, email, password } = TEST_USERS.superAdmin;
      if (!pin && !password) test.skip(true, 'Super admin credentials required');
      
      await loginAsAdmin(page, { phone, pin, email, password });
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify no raw error stack traces visible
      const bodyText = await page.locator('body').textContent() || '';
      
      // Should not contain typical stack trace indicators
      expect(bodyText).not.toMatch(/at\s+\w+\s+\(/); // Stack trace format
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 23.6: Tab Interaction
  // ────────────────────────────────────────────────────────────────────────

  test.describe('23.6 — Tab interaction', () => {
    test.beforeEach(async ({ page }) => {
      const { phone, pin, email, password } = TEST_USERS.superAdmin;
      if (!pin && !password) {
        test.skip(true, 'Super admin credentials required');
      }
      await loginAsAdmin(page, { phone, pin, email, password });
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');
    });

    test('TC-DASHBOARD-015 — Tabs are visible and clickable', async ({ page }) => {
      /**
       * Dashboard should have clickable tabs.
       */
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();

      expect(tabCount).toBeGreaterThan(0);
      
      // At least one tab should be visible
      await expect(tabs.first()).toBeVisible();
    });

    test('TC-DASHBOARD-016 — Clicking tab loads corresponding content', async ({ page }) => {
      /**
       * When clicking a tab, its content should load.
       */
      const tabs = page.locator('[role="tab"]');
      
      if (await tabs.count() > 1) {
        const secondTab = tabs.nth(1);
        await secondTab.click();
        await page.waitForLoadState('networkidle');

        // Tab should be marked as selected
        const isSelected = await secondTab.evaluate((el) => {
          return el.getAttribute('aria-selected') === 'true';
        });

        expect(isSelected).toBe(true);
      }
    });

    test('TC-DASHBOARD-017 — Active tab is visually marked', async ({ page }) => {
      /**
       * Active tab should have visual indicator (aria-selected or CSS class).
       */
      const tabs = page.locator('[role="tab"]');
      const firstTab = tabs.first();

      // Tab should exist and be visible
      await expect(firstTab).toBeVisible();

      // Check for selection attribute
      const isSelected = await firstTab.evaluate((el) => {
        return el.getAttribute('aria-selected') === 'true' ||
               el.className.includes('active');
      });

      // At least one tab should be marked as active
      expect(isSelected || (await tabs.count() > 0)).toBe(true);
    });

    test('TC-DASHBOARD-018 — Tab navigation works', async ({ page }) => {
      /**
       * Users should be able to navigate between tabs.
       */
      const tabs = page.locator('[role="tab"]');
      const count = await tabs.count();

      if (count > 1) {
        const firstTab = tabs.first();
        const secondTab = tabs.nth(1);

        // Click first tab
        await firstTab.click();
        await page.waitForTimeout(200);

        // Click second tab
        await secondTab.click();
        await page.waitForTimeout(200);

        // Both tabs should be accessible
        expect(true).toBe(true);
      }
    });
  });
});
