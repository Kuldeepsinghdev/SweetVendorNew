import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Sahakar Bharati E2E tests.
 *
 * Test structure:
 *   tests/e2e/auth/         — authentication flows
 *   tests/e2e/mitra/        — mitra registration, approval, portal
 *   tests/e2e/shopping/     — catalog browsing, cart
 *   tests/e2e/booking/      — checkout, booking creation, history
 *   tests/e2e/admin/        — super admin and city admin flows
 *   tests/e2e/security/     — access control, data isolation, price manipulation
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'hi-IN',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
