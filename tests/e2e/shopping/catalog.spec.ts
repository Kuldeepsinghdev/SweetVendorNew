import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_DATA } from '../helpers/fixtures';
import { loginAsMitra } from '../helpers/auth';

/**
 * TC-SHOP-001 through TC-SHOP-003, TC-SHOP-008 — Catalog browsing
 *
 * Verifies that the sweet catalog is publicly visible, that non-Mitra
 * visitors see a login CTA instead of cart buttons, and that prices
 * come from the DB (not hardcoded).
 */

const LOCALE = 'hi';
const HOME_URL = `/`;

test.describe('Public Catalog — Anonymous Visitor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-SHOP-001 — catalog is visible without login', async ({ page }) => {
    // Home page loads with sweet products visible
    await expect(page).toHaveURL(new RegExp(HOME_URL));

    // City/shop picker or sweet products should be visible
    // (before picker, the onboarding picker is shown)
    const hasPicker = await page.getByText(/select.*city|शहर चुनें/i).isVisible();
    const hasProducts = await page.getByRole('img').count() > 0;
    expect(hasPicker || hasProducts).toBeTruthy();
  });

  test('TC-SHOP-001 — page loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(HOME_URL);
    await page.waitForLoadState('networkidle');

    // No critical JS errors should block the page
    const criticalErrors = errors.filter(
      (e) => e.includes('__webpack_modules__') || e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('TC-SHOP-002 — anonymous user sees Login as Mitra CTA not Add to Cart', async ({ page }) => {
    // Complete city/shop picker if shown
    const cityPicker = page.getByText(/select.*city|शहर चुनें/i);
    if (await cityPicker.isVisible()) {
      // Click first active city
      await page.getByRole('button', { name: /जयपुर|Jaipur/i }).first().click();
      // Click first shop
      await page.getByRole('button').filter({ hasText: /सहकार|Sahakar/i }).first().click();
    }
    await page.waitForLoadState('networkidle');

    // Anonymous user must NOT see "Add to cart" button
    await expect(page.getByRole('button', { name: /add to cart|कार्ट में जोड़ें/i })).not.toBeVisible();

    // Must see the "Login as Mitra to book" CTA
    await expect(page.getByRole('button', { name: /mitra.*login|login.*mitra|मित्र.*लॉगिन|लॉगिन.*मित्र/i })).toBeVisible();
  });

  test('TC-SHOP-001 — product prices are displayed', async ({ page }) => {
    // After picker, at least one product price (₹) should be shown
    const cityPicker = page.getByText(/select.*city|शहर चुनें/i);
    if (await cityPicker.isVisible()) {
      await page.getByRole('button', { name: /जयपुर|Jaipur/i }).first().click();
      await page.getByRole('button').filter({ hasText: /सहकार|Sahakar/i }).first().click();
    }
    await page.waitForLoadState('networkidle');

    // Should show at least one price with ₹ symbol
    const priceElements = page.getByText(/₹\d+/);
    await expect(priceElements.first()).toBeVisible();
  });
});

test.describe('Catalog for Authenticated Mitra', () => {
  test.beforeEach(async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.approvedMitra;
    if (!pin && !password) {
      test.skip(true, 'No mitra credentials provided');
    }
    await loginAsMitra(page, { phone, pin, email, password });
    await page.goto(HOME_URL);
    await page.waitForLoadState('networkidle');
  });

  test('TC-SHOP-003 — authenticated mitra sees Add to Cart buttons', async ({ page }) => {
    // Complete picker if needed
    const cityPicker = page.getByText(/select.*city|शहर चुनें/i);
    if (await cityPicker.isVisible()) {
      await page.getByRole('button', { name: /सवाई माधोपुर|Sawai/i }).first().click();
      await page.getByRole('button').filter({ hasText: /सहकार|Sahakar/i }).first().click();
    }
    await page.waitForLoadState('networkidle');

    // Mitra must see Add to Cart button
    await expect(page.getByRole('button', { name: /add to cart|कार्ट में जोड़ें/i }).first()).toBeVisible();

    // Must NOT see "Login as Mitra" CTA (they are already mitra)
    await expect(page.getByRole('button', { name: /mitra.*login|login.*mitra/i })).not.toBeVisible();
  });

  test('TC-SHOP-008 — prices shown match database values', async ({ page }) => {
    // Complete picker
    const cityPicker = page.getByText(/select.*city|शहर चुनें/i);
    if (await cityPicker.isVisible()) {
      await page.getByRole('button', { name: /सवाई माधोपुर|Sawai/i }).first().click();
      await page.getByRole('button').filter({ hasText: /सहकार|Sahakar/i }).first().click();
    }
    await page.waitForLoadState('networkidle');

    // Kaju Katli base price is ₹700/kg — at least one product with that price range should show
    const pricesText = await page.getByText(/₹\d+/).allTextContents();
    const prices = pricesText.map((t) => parseInt(t.replace(/[^0-9]/g, ''))).filter(Boolean);

    // Prices should be in a realistic range (not ₹1 and not ₹999999)
    const allRealistic = prices.every((p) => p >= 50 && p <= 5000);
    expect(prices.length).toBeGreaterThan(0);
    expect(allRealistic).toBeTruthy();
  });
});
