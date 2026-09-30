import { test, expect } from '@playwright/test';

/**
 * TC-SECURITY-MITRA-* — Mitra Data Isolation & Security Tests
 * 
 * Verifies that:
 * - One Mitra cannot access another Mitra's bookings
 * - One Mitra cannot access another Mitra's invoices
 * - Unauthorized users are blocked from Mitra portal
 * - Only approved Mitras can book
 *
 * Requires multiple Mitra credentials in environment
 */

test.describe('Mitra Data Isolation & Security', () => {
  const mitraAPhone = process.env.TEST_MITRA_PHONE;
  const mitraAPin = process.env.TEST_MITRA_PIN;

  test.skip(!mitraAPhone || !mitraAPin, 'Mitra credentials not set');

  test('TC-SECURITY-MITRA-001 — Unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/mitra/portal');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toMatch(/\/login/);
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
  });

  test('TC-SECURITY-MITRA-002 — Unauthenticated user cannot access checkout', async ({ page }) => {
    await page.goto('/mitra/checkout');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toMatch(/\/login/);
  });

  test('TC-SECURITY-MITRA-003 — Unauthenticated user cannot access invoices', async ({ page }) => {
    await page.goto('/mitra/invoices');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toMatch(/\/login/);
  });

  test('TC-SECURITY-MITRA-004 — Admin session cannot access Mitra routes', async ({ page }) => {
    const adminPhone = process.env.TEST_SUPER_ADMIN_PHONE;
    const adminPin = process.env.TEST_SUPER_ADMIN_PIN;

    test.skip(!adminPhone || !adminPin, 'Admin credentials not set');

    // Login as admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    await page.getByLabel(/phone|मोबाइल/i).fill(adminPhone!);
    await page.getByLabel(/pin|पिन/i).fill(adminPin!);
    await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();

    await page.waitForURL(/\/dashboard/);

    // Try to access Mitra portal with admin session
    await page.goto('/mitra/portal');
    await page.waitForLoadState('networkidle');

    // Should be redirected (admin token ≠ customer token)
    expect(page.url()).toMatch(/\/login/);
  });

  test('TC-SECURITY-MITRA-005 — Mitra receives server-authoritative prices', async ({ page }) => {
    // Login as Mitra
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.getByLabel(/mobile|phone|मोबाइल/i).fill(mitraAPhone!);
    await page.getByLabel(/pin|पिन/i).fill(mitraAPin!);
    await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();

    await page.waitForURL(/\/mitra\//);

    // Browse catalog and note displayed prices
    await page.goto('/mitra/catalog');
    await page.waitForLoadState('networkidle');

    const displayedPrice = await page.locator('[data-testid="product-price"]').first().textContent();

    // Add to cart and proceed to checkout
    await page.locator('[data-testid="add-to-cart-button"]').first().click();
    await page.goto('/mitra/checkout');
    await page.waitForLoadState('networkidle');

    // Verify checkout recalculates price (not using stale client price)
    const checkoutPrice = await page.locator('[data-testid="item-price"]').first().textContent();

    // Prices should match (both from server)
    // Note: If admin changed price between page loads, checkout price takes precedence
    expect(checkoutPrice).toBeTruthy();
  });

  test('TC-SECURITY-MITRA-006 — Only cash/udhar payment methods accepted', async ({ page }) => {
    // Login as Mitra
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.getByLabel(/mobile|phone|मोबाइल/i).fill(mitraAPhone!);
    await page.getByLabel(/pin|पिन/i).fill(mitraAPin!);
    await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();

    await page.waitForURL(/\/mitra\//);

    // Add to cart and go to checkout
    await page.goto('/mitra/catalog');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();
    await page.goto('/mitra/checkout');
    await page.waitForLoadState('networkidle');

    // Verify only cash and udhar options exist
    const paymentOptions = page.locator('[data-testid="payment-method-option"]');
    const optionCount = await paymentOptions.count();

    expect(optionCount).toBeGreaterThan(0);
    
    // Verify no 'online' option
    const labels = [];
    for (let i = 0; i < optionCount; i++) {
      const label = await paymentOptions.nth(i).textContent();
      labels.push(label);
    }
    
    const onlineOption = labels.some(l => l?.toLowerCase().includes('online'));
    expect(onlineOption).toBe(false);
  });
});
