/**
 * Zoho Payments credential resolution (server-only).
 *
 * Ported from the legacy Express server (server/zohoPayments.ts). Reads the
 * ZOHO_PAYMENTS_* env vars and derives the correct regional API hosts.
 */
export function getZohoCredentials() {
  const accountId = process.env.ZOHO_PAYMENTS_ACCOUNT_ID || '';
  const clientId = process.env.ZOHO_PAYMENTS_CLIENT_ID || '';
  const clientSecret = process.env.ZOHO_PAYMENTS_CLIENT_SECRET || '';
  const apiKey = process.env.ZOHO_PAYMENTS_API_KEY || '';
  const domain = (process.env.ZOHO_PAYMENTS_DOMAIN || 'IN').toUpperCase(); // 'IN' | 'US' | 'EU'
  const isConfigured = Boolean(accountId && (apiKey || (clientId && clientSecret)));

  const apiHost = domain === 'IN' ? 'https://payments.zoho.in' : 'https://payments.zoho.com';
  const accountsHost = domain === 'IN' ? 'https://accounts.zoho.in' : 'https://accounts.zoho.com';

  return { accountId, clientId, clientSecret, apiKey, domain, isConfigured, apiHost, accountsHost };
}
