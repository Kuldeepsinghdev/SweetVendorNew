/**
 * Calculate OTP expiration timestamp. Returns an ISO 8601 string representing
 * the time when the OTP will expire (current time + OTP_EXPIRY_MINUTES).
 *
 * Environment variables:
 *   OTP_EXPIRY_MINUTES (default: 10) — minutes until OTP expires
 *
 * @returns ISO 8601 timestamp string (e.g., '2024-01-15T14:30:00Z')
 */
export function getOtpExpiration(): string {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
  if (isNaN(expiryMinutes) || expiryMinutes <= 0) {
    throw new Error('OTP_EXPIRY_MINUTES must be a positive integer');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);
  return expiresAt.toISOString();
}
