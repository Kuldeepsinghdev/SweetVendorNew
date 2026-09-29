import { test, expect } from '@playwright/test';

/**
 * Language — Persistence tests
 *
 * Verifies that the selected language:
 *  1. Survives a full browser refresh
 *  2. Is Hindi for a new visitor with no cookie
 *  3. Persists across the whole browsing session
 */

test.describe('Language persistence across refresh', () => {
  test('TC-LANG-PERSIST-001 — English persists after page refresh', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to English
    await page.getByRole('button', { name: /EN|english/i }).click();
    await page.waitForLoadState('networkidle');

    // Confirm English is active
    expect(await page.getAttribute('html', 'lang')).toBe('en');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // English must still be active after reload
    expect(await page.getAttribute('html', 'lang')).toBe('en');
    expect(new URL(page.url()).pathname).toBe('/');
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
  });

  test('TC-LANG-PERSIST-002 — Hindi persists after page refresh', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Default is Hindi — confirm
    expect(await page.getAttribute('html', 'lang')).toBe('hi');

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Hindi must still be active
    expect(await page.getAttribute('html', 'lang')).toBe('hi');
  });

  test('TC-LANG-PERSIST-003 — lang cookie is set after visit', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cookies = await context.cookies();
    const langCookie = cookies.find(c => c.name === 'lang');
    expect(langCookie).toBeDefined();
    expect(langCookie?.value).toBe('hi');
  });

  test('TC-LANG-PERSIST-004 — lang cookie updates when switching to English', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /EN|english/i }).click();
    await page.waitForLoadState('networkidle');

    const cookies = await context.cookies();
    const langCookie = cookies.find(c => c.name === 'lang');
    expect(langCookie).toBeDefined();
    expect(langCookie?.value).toBe('en');
  });

  test('TC-LANG-PERSIST-005 — new browser context (no cookie) defaults to Hindi', async ({ browser }) => {
    // Completely fresh browser context — no cookies at all
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    await newPage.goto('/');
    await newPage.waitForLoadState('networkidle');

    expect(await newPage.getAttribute('html', 'lang')).toBe('hi');
    expect(new URL(newPage.url()).pathname).toBe('/');

    await newContext.close();
  });
});
