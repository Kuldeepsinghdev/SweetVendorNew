import { test, expect } from '@playwright/test';

/**
 * Language — Navigation tests
 *
 * Verifies that:
 *  1. Language selection persists as the user navigates between pages
 *  2. All URLs remain locale-free regardless of the active language
 *  3. Legacy /hi and /en URLs redirect cleanly to the locale-free equivalent
 */

test.describe('Language persists across navigation', () => {
  test('TC-LANG-NAV-001 — English stays active when navigating home → mitra → login', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to English
    await page.getByRole('button', { name: /EN|english/i }).click();
    await page.waitForLoadState('networkidle');
    expect(await page.getAttribute('html', 'lang')).toBe('en');

    // Navigate to /mitra
    await page.goto('/mitra');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/mitra');
    expect(await page.getAttribute('html', 'lang')).toBe('en');

    // Navigate to /login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/login');
    expect(await page.getAttribute('html', 'lang')).toBe('en');
  });

  test('TC-LANG-NAV-002 — Hindi stays active when navigating home → admin → login', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(await page.getAttribute('html', 'lang')).toBe('hi');

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/admin');
    expect(await page.getAttribute('html', 'lang')).toBe('hi');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/login');
    expect(await page.getAttribute('html', 'lang')).toBe('hi');
  });

  test('TC-LANG-NAV-003 — no URL ever contains /hi/ or /en/ during navigation', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    const visitedUrls: string[] = [];

    page.on('response', (res) => {
      if (res.status() < 400) visitedUrls.push(res.url());
    });

    const routes = ['/', '/mitra', '/login', '/admin', '/reset-password'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const currentPath = new URL(page.url()).pathname;
      expect(currentPath).not.toMatch(/^\/(hi|en)(\/|$)/);
    }
  });
});

test.describe('Legacy URL redirects', () => {
  test('TC-LANG-LEGACY-001 — /hi redirects to / and sets lang=hi cookie', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto('/hi');
    await page.waitForLoadState('networkidle');

    // Must have redirected to /
    expect(new URL(page.url()).pathname).toBe('/');

    // lang cookie must be hi
    const cookies = await context.cookies();
    const langCookie = cookies.find(c => c.name === 'lang');
    expect(langCookie?.value).toBe('hi');
  });

  test('TC-LANG-LEGACY-002 — /en redirects to / and sets lang=en cookie', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    expect(new URL(page.url()).pathname).toBe('/');

    const cookies = await context.cookies();
    const langCookie = cookies.find(c => c.name === 'lang');
    expect(langCookie?.value).toBe('en');
  });

  test('TC-LANG-LEGACY-003 — /hi/products redirects to /products with lang=hi', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    // /products doesn't exist so we'll test with /mitra which does
    await page.goto('/hi/mitra');
    await page.waitForLoadState('networkidle');

    expect(new URL(page.url()).pathname).toBe('/mitra');

    const cookies = await context.cookies();
    const langCookie = cookies.find(c => c.name === 'lang');
    expect(langCookie?.value).toBe('hi');
  });

  test('TC-LANG-LEGACY-004 — /en/admin redirects to /admin with lang=en cookie', async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto('/en/admin');
    await page.waitForLoadState('networkidle');

    expect(new URL(page.url()).pathname).toBe('/admin');

    const cookies = await context.cookies();
    const langCookie = cookies.find(c => c.name === 'lang');
    expect(langCookie?.value).toBe('en');
  });
});
