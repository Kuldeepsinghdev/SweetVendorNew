/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ZohoPaymentSessionRequest,
  ZohoPaymentSessionResponse,
  ZohoPaymentVerificationRequest
} from '../types';

declare global {
  interface Window {
    ZPayments?: any;
  }
}

let scriptLoadPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the official Zoho Payments JavaScript SDK
 * (https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js)
 */
export function loadZohoPaymentsSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.ZPayments) return Promise.resolve(true);

  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve) => {
    // Check if already injected in DOM
    const existingScript = document.querySelector('script[src*="zpayments.js"]');
    if (existingScript) {
      if (window.ZPayments) {
        resolve(true);
      } else {
        existingScript.addEventListener('load', () => resolve(Boolean(window.ZPayments)));
        existingScript.addEventListener('error', () => resolve(false));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js';
    script.async = true;
    script.onload = () => {
      console.log('Zoho Payments SDK loaded successfully');
      resolve(Boolean(window.ZPayments));
    };
    script.onerror = () => {
      console.warn('Could not load Zoho Payments CDN script directly (might be offline or blocked). Using embedded gateway interface.');
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Fetch Zoho Payments Gateway configuration
 */
export async function getZohoConfig(): Promise<{
  configured: boolean;
  accountId: string;
  domain: string;
  gatewayName: string;
  mode: 'live' | 'test';
}> {
  try {
    const res = await fetch('/api/zoho-payments/config');
    if (!res.ok) throw new Error('Failed to load Zoho config');
    return await res.json();
  } catch (err) {
    return {
      configured: false,
      accountId: 'zpay_acc_sahakar_bharati_sandbox',
      domain: 'IN',
      gatewayName: 'Zoho Payments',
      mode: 'test'
    };
  }
}

/**
 * Create a Zoho payment session on the backend
 */
export async function createZohoPaymentSession(
  params: ZohoPaymentSessionRequest
): Promise<ZohoPaymentSessionResponse> {
  const res = await fetch('/api/zoho-payments/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Zoho Payments सत्र निर्माण विफल (Session creation failed)');
  }

  return await res.json();
}

/**
 * Verify payment with backend once completed by user
 */
export async function verifyZohoPayment(params: ZohoPaymentVerificationRequest): Promise<{
  success: boolean;
  transactionId: string;
  invoiceId: string;
  paymentMode: string;
  booking: any;
}> {
  const res = await fetch('/api/zoho-payments/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Zoho Payments सत्यापन विफल (Payment verification failed)');
  }

  return await res.json();
}
