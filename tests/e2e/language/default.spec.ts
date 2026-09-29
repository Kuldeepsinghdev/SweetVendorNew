import { test, expect } from '@playwright/test';

/**
 * Language — Default language tests
 *
 * Verifies that a new visitor with no saved language preference sees Hindi.
 * The URL must always be clean (no /hi or /en prefix).
 */

test.describe('Default language — Hindi', () => {
  test.beforeEach(async ({ context }) => {
    // Simulate a completely new visitor: no lang cookie
    await context.clearCookies();
  });

  test('TC-LANG-001 — first visit renders Hindi UI', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // URL must be exactly / — no locale prefix
    expect(new URL(page.url()).pathname).toBe('/');

    // Hindi text must be present somewhere on the page
    // The brand name and tagline are always rendered in the active language
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/सहकार भारती/);
  });

  test('TC-LANG-002 — html lang attribute is "hi" by default', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('hi');
  });

  test('TC-LANG-003 — URL is / with no locale segment', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const url = new URL(page.url());
    expect(url.pathname).toBe('/');
    expect(url.pathname).not.toMatch(/^\/(hi|en)/);
  });

  test('TC-LANG-004 — /admin renders Hindi by default', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    expect(new URL(page.url()).pathname).toBe('/admin');

    // Admin page has Hindi text by default
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/प्रशासनिक/);
  });

  test('TC-LANG-005 — /login renders Hindi by default', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    expect(new URL(page.url()).pathname).toBe('/login');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/लॉगिन/);
  });
});
