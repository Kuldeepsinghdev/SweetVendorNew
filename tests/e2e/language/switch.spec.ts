import { test, expect } from '@playwright/test';

/**
 * Language — Switch tests
 *
 * Verifies that clicking the language toggle:
 *  1. Changes the displayed language
 *  2. Does NOT change the URL
 *  3. Works in both directions (hi→en, en→hi)
 */

test.describe('Language switching — URL stays unchanged', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('TC-LANG-SWITCH-001 — switch to English: URL stays /', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const urlBefore = page.url();

    // Click language toggle (shows 'EN' when current is Hindi)
    await page.getByRole('button', { name: /EN|english/i }).click();
    await page.waitForLoadState('networkidle');

    // URL must not change
    expect(page.url()).toBe(urlBefore);
    expect(new URL(page.url()).pathname).toBe('/');
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
  });

  test('TC-LANG-SWITCH-002 — after switching to English, UI is in English', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /EN|english/i }).click();
    await page.waitForLoadState('networkidle');

    // English brand text should appear
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/Sahakar Bharati/);
    // html lang must update
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');
  });

  test('TC-LANG-SWITCH-003 — switch back to Hindi: URL stays unchanged', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // First switch to English
    await page.getByRole('button', { name: /EN|english/i }).click();
    await page.waitForLoadState('networkidle');

    const urlAfterEnglish = page.url();

    // Now switch back to Hindi (toggle now shows 'हिन्दी')
    await page.getByRole('button', { name: /हिन्दी|hindi/i }).click();
    await page.waitForLoadState('networkidle');

    // URL must remain the same
    expect(page.url()).toBe(urlAfterEnglish);
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('TC-LANG-SWITCH-004 — after switching back to Hindi, UI is in Hindi', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to English then back to Hindi
    await page.getByRole('button', { name: /EN|english/i }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /हिन्दी|hindi/i }).click();
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/सहकार भारती/);

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('hi');
  });

  test('TC-LANG-SWITCH-005 — switching on /mitra keeps URL at /mitra', async ({ page }) => {
    await page.goto('/mitra');
    await page.waitForLoadState('networkidle');

    const urlBefore = page.url();
    expect(new URL(urlBefore).pathname).toBe('/mitra');

    await page.getByRole('button', { name: /EN|english/i }).click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(urlBefore);
    expect(new URL(page.url()).pathname).toBe('/mitra');
  });

  test('TC-LANG-SWITCH-006 — switching on /login keeps URL at /login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const urlBefore = page.url();
    await page.getByRole('button', { name: /EN|english/i }).click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(urlBefore);
    expect(new URL(page.url()).pathname).toBe('/login');
  });
});
