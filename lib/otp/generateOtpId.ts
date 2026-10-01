import crypto from 'crypto';

/**
 * Generate a unique ID for an OTP record using UUID v4.
 * Provides a distinct identifier for each OTP session.
 *
 * @returns A UUID v4 string
 */
export function generateOtpId(): string {
  return crypto.randomUUID();
}
