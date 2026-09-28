import { getZohoCredentials } from '@/lib/zoho/credentials';
import { handle, ok } from '@/lib/api/handler';

/** Returns public (non-secret) Zoho Payments configuration for the client widget. */
export async function GET() {
  return handle(async () => {
    const { accountId, domain, isConfigured } = getZohoCredentials();
    return ok({
      success: true,
      configured: isConfigured,
      accountId: accountId || 'zpay_acc_sahakar_bharati_sandbox',
      domain: domain || 'IN',
      gatewayName: 'Zoho Payments',
      supportedCurrencies: ['INR'],
      supportedModes: ['UPI', 'CARDS', 'NETBANKING'],
      mode: isConfigured ? 'live' : 'test',
    });
  });
}
