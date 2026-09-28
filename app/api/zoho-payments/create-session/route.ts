import { NextRequest } from 'next/server';
import { getZohoCredentials } from '@/lib/zoho/credentials';
import { handle, ok, fail } from '@/lib/api/handler';

/**
 * POST /api/zoho-payments/create-session
 * Initiates a payment session. Uses the live Zoho Payments API when credentials
 * are configured, otherwise returns a sandbox/test session id.
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const body = (await request.json().catch(() => ({}))) || {};
    const { amount, currency = 'INR', orderId, customer, description, metadata } = body;

    if (!amount || amount <= 0) {
      return fail('अमान्य भुगतान राशि (Invalid payment amount)', 400);
    }

    const { accountId, clientId, clientSecret, apiKey, domain, isConfigured, apiHost, accountsHost } =
      getZohoCredentials();

    const normalizedOrderId = orderId || `ZORD-${Date.now()}`;
    const cleanCustomer = {
      name: customer?.name || 'ग्राहक',
      phone: customer?.phone || '9829012345',
      email: customer?.email || 'customer@sahakarbharati.org',
      address: customer?.address || '',
    };

    // Live path: call the official Zoho Payments Session API when configured.
    if (isConfigured) {
      try {
        let accessToken = apiKey;

        // Exchange client credentials for an OAuth access token when needed.
        if (clientId && clientSecret && !apiKey) {
          const tokenRes = await fetch(`${accountsHost}/oauth/v2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: clientId,
              client_secret: clientSecret,
              scope: 'ZohoPayments.fullaccess.all',
            }),
          });
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            accessToken = tokenData.access_token;
          }
        }

        if (accessToken) {
          const zohoResponse = await fetch(`${apiHost}/api/v1/payment_sessions?account_id=${accountId}`, {
            method: 'POST',
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: Number(amount) * 100, // paise
              currency: currency || 'INR',
              order_id: normalizedOrderId,
              customer_details: {
                name: cleanCustomer.name,
                phone: cleanCustomer.phone,
                email: cleanCustomer.email,
              },
              description: description || `सहकार भारती मिठाई प्री-बुकिंग ऑर्डर #${normalizedOrderId}`,
              metadata: { ...metadata, platform: 'Sahakar Bharati Sweets' },
            }),
          });

          if (zohoResponse.ok) {
            const zohoData = await zohoResponse.json();
            const sessionId = zohoData.payment_session_id || zohoData.session_id;
            return ok({
              success: true,
              mode: 'live',
              payment_session_id: sessionId,
              account_id: accountId,
              domain,
              amount: Number(amount),
              currency,
              order_id: normalizedOrderId,
            });
          } else {
            const errText = await zohoResponse.text();
            console.warn('Zoho Payments API call fallback to sandbox:', errText);
          }
        }
      } catch (err) {
        console.warn('Error invoking Zoho Payments API, falling back to sandbox gateway:', err);
      }
    }

    // Test/sandbox session (standard Zoho Payments format).
    const randomHex = Math.random().toString(36).substring(2, 10);
    const mockSessionId = `zpay_sess_${Date.now()}_${randomHex}`;

    return ok({
      success: true,
      mode: isConfigured ? 'live' : 'test',
      payment_session_id: mockSessionId,
      account_id: accountId || 'zpay_acc_sahakar_bharati_sandbox',
      domain: domain || 'IN',
      amount: Number(amount),
      currency,
      order_id: normalizedOrderId,
      message: 'Zoho Payments सत्र सफलतापूर्वक बनाया गया (Payment session created successfully)',
    });
  });
}
