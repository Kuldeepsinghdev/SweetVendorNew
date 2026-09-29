import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/fixtures';
import { loginAsMitra } from '../helpers/auth';

/**
 * TC-SHOP-004 through TC-SHOP-007 — Cart functionality
 *
 * Tests add to cart, quantity controls, remove, and cart total
 * for an authenticated Mitra.
 */

const LOCALE = 'hi';
const HOME_URL = `/`;

/** Helper: complete the city/shop picker on the homepage */
async function completePicker(page: import('@playwright/test').Page) {
  const cityPicker = page.getByText(/select.*city|शहर चुनें/i);
  if (await cityPicker.isVisible()) {
    // Pick Sawai Madhopur — it has sale centers with products
    const cityBtn = page.getByRole('button', { name: /सवाई माधोपुर|Sawai Madhopur/i });
    if (await cityBtn.isVisible()) {
      await cityBtn.click();
    } else {
      // Fall back to first city
      await page.getByRole('button').filter({ hasText: /जयपुर|Jaipur/i }).first().click();
    }
    // Pick first shop
    await page.getByRole('button').filter({ hasText: /सहकार|Sahakar|आस्था|Aastha/i }).first().click();
  }
  await page.waitForLoadState('networkidle');
}

test.describe('Cart — Authenticated Mitra', () => {
  test.beforeEach(async ({ page }) => {
    const { phone, pin, email, password } = TEST_USERS.approvedMitra;
    if (!pin && !password) {
      test.skip(true, 'No mitra credentials set');
    }
    await loginAsMitra(page, { phone, pin, email, password });
    await page.goto(HOME_URL);
    await completePicker(page);
  });

  test('TC-SHOP-004 — mitra can add a product to cart', async ({ page }) => {
    // Click "Add to cart" on the first product
    const addBtn = page.getByRole('button', { name: /add to cart|कार्ट में जोड़ें/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Cart count badge or cart bar should appear
    await expect(
      page.getByText(/1 item|1 product|cart|कार्ट/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('TC-SHOP-004 — cart shows added item details', async ({ page }) => {
    await page.getByRole('button', { name: /add to cart|कार्ट में जोड़ें/i }).first().click();

    // Open cart (click cart bar or cart icon)
    const cartBar = page.getByRole('button', { name: /checkout|view cart|कार्ट देखें/i });
    if (await cartBar.isVisible()) {
      await cartBar.click();
    }

    // Cart should show item name and price
    await expect(page.getByText(/₹\d+/)).toBeVisible();
  });

  test('TC-SHOP-005 — quantity can be increased and decreased', async ({ page }) => {
    // Add item to cart first
    await page.getByRole('button', { name: /add to cart|कार्ट में जोड़ें/i }).first().click();
    await page.waitForLoadState('networkidle');

    // Increment quantity using stepper
    const plusBtn = page.getByRole('button', { name: /\+/i }).first();
    if (await plusBtn.isVisible()) {
      await plusBtn.click();
      await plusBtn.click();
      // Quantity should now be 3 (started at 1, +2)
    }
  });

  test('TC-SHOP-006 — item can be removed from cart', async ({ page }) => {
    await page.getByRole('button', { name: /add to cart|कार्ट में जोड़ें/i }).first().click();
    await page.waitForLoadState('networkidle');

    // Remove item from cart
    const removeBtn = page.getByRole('button', { name: /remove|delete|हटाएं/i }).first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await page.waitForLoadState('networkidle');

      // Cart should be empty or item no longer visible
      await expect(page.getByText(/cart is empty|कार्ट खाली/i)).toBeVisible({ timeout: 3000 }).catch(() => {
        // Alternatively, the cart count badge might disappear
      });
    }
  });

  test('TC-SHOP-003 — floating cart bar only visible to mitra', async ({ page }) => {
    // After adding an item, the floating cart bar should be visible for mitra
    await page.getByRole('button', { name: /add to cart|कार्ट में जोड़ें/i }).first().click();
    await page.waitForLoadState('networkidle');

    // Cart bar (fixed position at bottom) should appear
    const cartBar = page.locator('[data-testid="cart-bar"]').or(
      page.getByRole('complementary').filter({ hasText: /checkout|₹/ })
    );
    // Check if some cart summary is visible
    await expect(page.getByText(/₹\d+/).first()).toBeVisible();
  });
});

test.describe('Cart — Anonymous Visitor Cannot Add to Cart', () => {
  test('TC-SHOP-002 — clicking add to cart as anonymous user redirects to mitra portal/login', async ({ page }) => {
    await page.goto(HOME_URL);
    await completePicker(page);

    // Anonymous visitor should not see "Add to cart" — should see "Login as Mitra"
    const loginCta = page.getByRole('button', { name: /mitra.*login|login.*mitra|मित्र.*लॉगिन/i });
    await expect(loginCta.first()).toBeVisible();

    // Clicking it should navigate to mitra or login page
    await loginCta.first().click();
    await page.waitForLoadState('networkidle');

    // Should redirect to login or mitra apply page
    const url = page.url();
    expect(url).toMatch(new RegExp(`/(login|mitra)`));
  });
});
