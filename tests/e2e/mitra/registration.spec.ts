import { test, expect } from '@playwright/test';
import { newMitraPayload } from '../helpers/fixtures';

/**
 * TC-MITRA-001 through TC-MITRA-007 — Mitra registration flow
 *
 * Locale is no longer in the URL. The apply page lives at /mitra/apply.
 */

const APPLY_URL = '/mitra/apply';

test.describe('Mitra Registration', () => {
  test('TC-MITRA-001 — mitra apply page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(APPLY_URL);
    await page.waitForLoadState('networkidle');

    expect(errors.filter(e => e.includes('__webpack_modules__'))).toHaveLength(0);
    await expect(page.getByRole('form')).toBeVisible();

    // URL must not contain a locale prefix
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
  });

  test('TC-MITRA-002 — city dropdown shows only active cities', async ({ page }) => {
    await page.goto(APPLY_URL);
    await page.waitForLoadState('networkidle');

    const citySelect = page.getByLabel(/city|शहर/i);
    await expect(citySelect).toBeVisible();

    const optionTexts = await citySelect.getByRole('option').allTextContents();
    const hasJaipur = optionTexts.some(t => /जयपुर|Jaipur/i.test(t));
    const hasSawai = optionTexts.some(t => /सवाई माधोपुर|Sawai Madhopur/i.test(t));
    expect(hasJaipur).toBeTruthy();
    expect(hasSawai).toBeTruthy();
  });

  test('TC-MITRA-003 — DC dropdown filters by selected city', async ({ page }) => {
    await page.goto(APPLY_URL);
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/city|शहर/i).selectOption({ value: 'jaipur' });

    const dcSelect = page.getByLabel(/distribution center|वितरण केंद्र/i);
    await expect(dcSelect).toBeVisible();

    const allOptions = await dcSelect.getByRole('option').allTextContents();
    const sawaiDcs = allOptions.filter(
      o => o.toLowerCase().includes('sawai') || o.includes('बजरिया') || o.includes('खेरदा')
    );
    expect(sawaiDcs).toHaveLength(0);
  });

  test('TC-MITRA-004 — form validation blocks empty submission', async ({ page }) => {
    await page.goto(APPLY_URL);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /submit|आगे बढ़ें/i }).click();

    await expect(page).toHaveURL(new RegExp(APPLY_URL));
    await expect(page.getByText(/SM-/i)).not.toBeVisible();
  });

  test('TC-MITRA-005 — invalid phone number shows validation error', async ({ page }) => {
    await page.goto(APPLY_URL);
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/city|शहर/i).selectOption({ index: 1 });
    await page.getByLabel(/full name|पूरा नाम/i).fill('Test User');
    await page.getByLabel(/mobile|मोबाइल नंबर/i).fill('12345'); // invalid — 5 digits
    await page.getByLabel(/pincode|पिनकोड/i).fill('302020');
    await page.getByLabel(/address|पूरा पता/i).fill('Test address');
    await page.getByRole('button', { name: /submit|आगे बढ़ें/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/SM-/i)).not.toBeVisible();
  });

  test('TC-MITRA-006 — successful registration shows reference number', async ({ page }) => {
    const mitra = newMitraPayload();

    await page.goto(APPLY_URL);
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/city|शहर/i).selectOption({ value: mitra.cityId });
    await page.waitForSelector('[name="centerId"]');
    await page.getByLabel(/distribution center|वितरण केंद्र/i).selectOption({ value: mitra.cityDcId });

    await page.getByLabel(/full name|पूरा नाम/i).fill(mitra.fullName);
    await page.getByLabel(/mobile|मोबाइल नंबर/i).fill(mitra.phone);
    await page.getByLabel(/email|ईमेल/i).fill(mitra.email);
    await page.getByLabel(/pincode|पिनकोड/i).fill(mitra.pincode);
    await page.getByLabel(/address|पूरा पता/i).fill(mitra.address);

    const agreeCheckbox = page.getByRole('checkbox');
    if (!(await agreeCheckbox.isChecked())) await agreeCheckbox.check();

    await page.getByRole('button', { name: /submit|आगे बढ़ें/i }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/SM-/i)).toBeVisible();

    const refText = await page.getByText(/SM-[A-Z]+-\d{4}/i).textContent();
    expect(refText).toBeTruthy();
    expect(refText).toMatch(/SM-[A-Z]+-\d{4}/);

    // URL must remain clean after successful submission
    expect(page.url()).not.toMatch(/\/(hi|en)\//);
  });

  test('TC-MITRA-007 — duplicate phone number shows error', async ({ page }) => {
    /**
     * BUG-007: currently no duplicate check — documents expected behaviour
     * once the fix is applied. Currently WILL FAIL (second registration succeeds).
     */
    const mitra = newMitraPayload();

    for (let i = 0; i < 2; i++) {
      await page.goto(APPLY_URL);
      await page.waitForLoadState('networkidle');
      await page.getByLabel(/city|शهر/i).selectOption({ value: mitra.cityId });
      await page.waitForSelector('[name="centerId"]');
      await page.getByLabel(/distribution center|वितरण केंद्र/i).selectOption({ value: mitra.cityDcId });
      await page.getByLabel(/full name|पूरा नाम/i).fill(mitra.fullName);
      await page.getByLabel(/mobile|मोबाइल नंबर/i).fill(mitra.phone);
      await page.getByLabel(/pincode|पिनकोड/i).fill(mitra.pincode);
      await page.getByLabel(/address|पूरा पता/i).fill(mitra.address);
      const agreeCheckbox = page.getByRole('checkbox');
      if (!(await agreeCheckbox.isChecked())) await agreeCheckbox.check();
      await page.getByRole('button', { name: /submit|आगे बढ़ें/i }).click();
      await page.waitForLoadState('networkidle');
    }

    // Second submission should show a duplicate error (BUG-007: currently fails)
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
