import type { Page } from '@playwright/test';

/**
 * Authentication helpers for E2E tests.
 *
 * Admin and Mitra use completely separate session systems:
 *   Admin:  sahakar_session cookie  →  /admin login form
 *   Mitra:  sahakar_customer cookie →  /login login form
 *
 * Locale is no longer in the URL — it lives in the `lang` cookie.
 */

/**
 * Log in as an admin user (super_admin, city_admin, or kendra).
 * Uses phone+PIN tab by default; pass `method: 'email'` for email+password.
 */
export async function loginAsAdmin(
  page: Page,
  options: {
    phone?: string;
    pin?: string;
    email?: string;
    password?: string;
    method?: 'phone' | 'email';
  }
) {
  const method = options.method ?? (options.email ? 'email' : 'phone');

  await page.goto('/admin');
  await page.waitForLoadState('networkidle');

  if (method === 'email' && options.email && options.password) {
    await page.getByRole('button', { name: /email/i }).click();
    await page.getByLabel(/email/i).fill(options.email);
    await page.getByLabel(/password|पासवर्ड/i).fill(options.password);
  } else if (method === 'phone' && options.phone && options.pin) {
    await page.getByLabel(/mobile|मोबाइल/i).fill(options.phone);
    await page.getByLabel(/pin|पिन/i).fill(options.pin);
  } else {
    throw new Error('loginAsAdmin: provide (phone + pin) or (email + password)');
  }

  await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();
  await page.waitForURL('/dashboard**');
}

/**
 * Log in as a Mitra or customer (storefront session).
 * Uses phone+PIN tab by default.
 */
export async function loginAsMitra(
  page: Page,
  options: {
    phone?: string;
    pin?: string;
    email?: string;
    password?: string;
    method?: 'phone' | 'email';
    next?: string;
  }
) {
  const method = options.method ?? (options.email ? 'email' : 'phone');
  const nextParam = options.next ? `?next=${encodeURIComponent(options.next)}` : '';

  await page.goto(`/login${nextParam}`);
  await page.waitForLoadState('networkidle');

  if (method === 'email' && options.email && options.password) {
    await page.getByRole('button', { name: /email/i }).click();
    await page.getByLabel(/email/i).fill(options.email);
    await page.getByLabel(/password|पासवर्ड/i).fill(options.password);
  } else if (method === 'phone' && options.phone && options.pin) {
    await page.getByLabel(/mobile|phone|मोबाइल/i).fill(options.phone);
    await page.getByLabel(/pin|पिन/i).fill(options.pin);
  } else {
    throw new Error('loginAsMitra: provide (phone + pin) or (email + password)');
  }

  await page.getByRole('button', { name: /sign in|लॉगिन/i }).click();
  await page.waitForLoadState('networkidle');
}

/** Log out from the storefront (Mitra) session */
export async function logoutMitra(page: Page) {
  await page.goto('/');
  const logoutBtn = page.getByRole('button', { name: /logout|sign out|लॉगआउट/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForLoadState('networkidle');
  }
}

/** Log out from the admin session */
export async function logoutAdmin(page: Page) {
  await page.goto('/dashboard');
  const logoutBtn = page.getByRole('button', { name: /logout|sign out|लॉगआउट/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForLoadState('networkidle');
  }
}

/** Navigate to a URL and assert it redirects to the expected destination */
export async function assertRedirects(
  page: Page,
  fromUrl: string,
  toUrlPattern: string | RegExp
) {
  await page.goto(fromUrl);
  await page.waitForLoadState('networkidle');
  await page.waitForURL(toUrlPattern);
}
