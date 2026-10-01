import crypto from 'crypto';

/**
 * Generate a 6-digit OTP code using cryptographically secure randomness.
 * Uses crypto.randomInt to ensure non-predictable values.
 *
 * @returns A 6-digit zero-padded OTP code (e.g., '000123', '987654')
 */
export function generateOtpCode(): string {
  // crypto.randomInt returns a secure random integer
  // Range: [0, 999999] = 6-digit space (000000 to 999999)
  const code = crypto.randomInt(0, 1000000);
  // Zero-pad to exactly 6 digits
  return code.toString().padStart(6, '0');
}
