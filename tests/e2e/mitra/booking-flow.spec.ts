import { test, expect } from '@playwright/test';

/**
 * TC-BOOKING-* — Mitra Booking Flow Tests
 * 
 * Tests the complete end-to-end ordering workflow:
 * 1. Browse catalog
 * 2. Add to cart
 * 3. Proceed to checkout
 * 4. Create booking
 * 5. View confirmation and invoice
 *
 * Requires TEST_MITRA_PHONE and TEST_MITRA_PIN environment variables.
 */

test.describe('Mitra Booking Flow', () => {
  const mitraPhone = process.env.TEST_MITRA_PHONE;
  const mitraPin = process.env.TEST_MITRA_PIN;

  test.skip(!mitraPhone || !mitraPin, 'Mitra credentials not set in environment');

  test.beforeEach(async ({ page }) => {
    // Login as Mitra
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/mobile|phone|मोबाइल/i).fill(mitraPhone!);
    await page.getByLabel(/pin|पिन/i).fill(mitraPin!);
    await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();

    await page.waitForURL(/\/mitra\//);
    await page.waitForLoadState('networkidle');
  });

  test('TC-BOOKING-001 — Mitra can browse catalog and view products', async ({ page }) => {
    await page.goto('/mitra/catalog');
    await page.waitForLoadState('networkidle');

    // Verify catalog page loads
    await expect(page).toHaveURL(/\/mitra\/catalog/);
    expect(page.url()).not.toMatch(/\/(hi|en)\//);

    // Verify products are displayed
    const products = page.locator('[data-testid="product-card"]');
    await expect(products.first()).toBeVisible();

    // Verify product details are visible
    const productName = page.locator('[data-testid="product-name"]').first();
    await expect(productName).toBeVisible();

    const productPrice = page.locator('[data-testid="product-price"]').first();
    await expect(productPrice).toBeVisible();
    await expect(productPrice).toContainText(/₹|Rs/);
  });

  test('TC-BOOKING-002 — Mitra can add product to cart', async ({ page }) => {
    await page.goto('/mitra/catalog');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('[data-testid="add-to-cart-button"]').first();
    await addButton.click();

    // Should show success feedback
    await expect(page.getByRole('alert')).toContainText(/added|जोड़ा/i);

    // Cart should update
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toContainText('1');
  });

  test('TC-BOOKING-003 — Mitra can update cart quantity', async ({ page }) => {
    // Add item to cart
    await page.goto('/mitra/catalog');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();

    // Navigate to cart
    await page.goto('/mitra/cart');
    await page.waitForLoadState('networkidle');

    // Update quantity
    const quantityInput = page.locator('[data-testid="cart-item-quantity"]').first();
    await quantityInput.fill('3');

    // Verify total updates
    const lineTotal = page.locator('[data-testid="cart-item-total"]').first();
    const totalText = await lineTotal.textContent();
    expect(totalText).toMatch(/₹|Rs/);
  });

  test('TC-BOOKING-004 — Mitra can proceed to checkout with valid cart', async ({ page }) => {
    // Add item to cart
    await page.goto('/mitra/catalog');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();

    // Go to checkout
    await page.goto('/mitra/checkout');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/mitra\/checkout/);

    // Verify order summary visible
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-total"]')).toBeVisible();
  });

  test('TC-BOOKING-005 — Mitra can create booking with cash payment', async ({ page }) => {
    // Add item and go to checkout
    await page.goto('/mitra/catalog');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();
    await page.goto('/mitra/checkout');
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.getByLabel(/name|नाम/i).fill('Test Customer');
    await page.getByLabel(/phone|मोबाइल/i).fill('9876543210');
    
    // Select cash payment
    await page.getByLabel(/cash|नकद/i).check();

    // Submit
    await page.getByRole('button', { name: /confirm|पुष्टि/i }).click();

    // Should redirect to confirmation
    await page.waitForURL(/\/mitra\/order-confirmation/);
    await expect(page).toHaveURL(/\/mitra\/order-confirmation\/[a-z0-9_]+/);
  });

  test('TC-BOOKING-006 — Mitra can create booking with udhar payment', async ({ page }) => {
    // Add item and go to checkout
    await page.goto('/mitra/catalog');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();
    await page.goto('/mitra/checkout');
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.getByLabel(/name|नाम/i).fill('Test Customer');
    await page.getByLabel(/phone|मोबाइल/i).fill('9876543210');
    
    // Select udhar payment
    await page.getByLabel(/udhar|उधार/i).check();

    // Submit
    await page.getByRole('button', { name: /confirm|पुष्टि/i }).click();

    // Should redirect to confirmation
    await page.waitForURL(/\/mitra\/order-confirmation/);
  });

  test('TC-BOOKING-007 — Order confirmation shows OTP and invoice link', async ({ page }) => {
    // Create booking
    await page.goto('/mitra/catalog');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();
    await page.goto('/mitra/checkout');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/name|नाम/i).fill('Test Customer');
    await page.getByLabel(/phone|मोबाइल/i).fill('9876543210');
    await page.getByLabel(/cash|नकद/i).check();
    await page.getByRole('button', { name: /confirm|पुष्टि/i }).click();

    await page.waitForURL(/\/mitra\/order-confirmation/);

    // Verify confirmation page elements
    await expect(page.locator('[data-testid="confirmation-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="delivery-otp"]')).toBeVisible();

    // Verify OTP is numeric
    const otpText = await page.locator('[data-testid="delivery-otp"]').textContent();
    expect(otpText).toMatch(/\d{4}/);
  });

  test('TC-BOOKING-008 — Mitra cannot proceed without items', async ({ page }) => {
    await page.goto('/mitra/checkout');
    await page.waitForLoadState('networkidle');

    // Should see empty cart message
    const emptyMessage = page.locator('[data-testid="empty-cart"]');
    await expect(emptyMessage).toContainText(/empty|खाली/i);
  });

  test('TC-BOOKING-009 — Invalid phone rejected', async ({ page }) => {
    await page.goto('/mitra/catalog');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();
    await page.goto('/mitra/checkout');
    await page.waitForLoadState('networkidle');

    // Try invalid phone
    await page.getByLabel(/name|नाम/i).fill('Test Customer');
    await page.getByLabel(/phone|मोबाइल/i).fill('123');
    await page.getByLabel(/cash|नकद/i).check();
    await page.getByRole('button', { name: /confirm|पुष्टि/i }).click();

    // Should show validation error
    await expect(page.getByRole('alert')).toContainText(/phone|digit|अंक/i);
  });

  test('TC-BOOKING-010 — Missing required fields rejected', async ({ page }) => {
    await page.goto('/mitra/catalog');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();
    await page.goto('/mitra/checkout');
    await page.waitForLoadState('networkidle');

    // Try to submit without name
    await page.getByLabel(/phone|मोबाइल/i).fill('9876543210');
    await page.getByLabel(/cash|नकद/i).check();
    await page.getByRole('button', { name: /confirm|पुष्टि/i }).click();

    // Should show validation error
    await expect(page.getByRole('alert')).toContainText(/required|आवश्यक/i);
  });
});
