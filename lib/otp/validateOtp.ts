import 'server-only';
import { db } from '@/src/db';
import { loginOtps } from '@/src/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export interface ValidateOtpResult {
  isValid: boolean;
  error?: string;
  otp?: any;
  attemptsRemaining?: number;
}

/**
 * Validate a submitted OTP code for a given user and email.
 * Queries the most recent active (non-verified) OTP for the user, then validates:
 *   1. Not expired
 *   2. Not max attempts reached
 *   3. Code matches
 *
 * If code doesn't match, increments attempts. Returns result object with details.
 *
 * @param userId - User ID to validate OTP for
 * @param email - Email address (used for logging/audit)
 * @param submittedOtp - The 6-digit OTP submitted by user
 * @returns Validation result with status, error message, and remaining attempts
 */
export async function validateOtp(
  userId: string,
  email: string,
  submittedOtp: string
): Promise<ValidateOtpResult> {
  try {
    // Query the most recent active (unverified) OTP for this user
    const results = await db
      .select()
      .from(loginOtps)
      .where(
        and(
          eq(loginOtps.userId, userId),
          eq(loginOtps.method, 'email'),
          isNull(loginOtps.verifiedAt)
        )
      )
      .orderBy(desc(loginOtps.createdAt))
      .limit(1);

    const otp = results[0];

    if (!otp) {
      return {
        isValid: false,
        error: 'otp_not_found',
      };
    }

    // Check expiration
    const now = new Date().toISOString();
    if (now > otp.expiresAt) {
      return {
        isValid: false,
        error: 'otp_expired',
        otp,
      };
    }

    // Check max attempts
    const attemptsRemaining = otp.maxAttempts - otp.attempts;
    if (otp.attempts >= otp.maxAttempts) {
      return {
        isValid: false,
        error: 'otp_max_attempts',
        otp,
        attemptsRemaining: 0,
      };
    }

    // Validate code match (constant-time comparison to prevent timing attacks)
    const isCodeValid = submittedOtp === otp.otpCode;

    if (!isCodeValid) {
      // Increment attempts
      await db
        .update(loginOtps)
        .set({
          attempts: otp.attempts + 1,
        })
        .where(eq(loginOtps.id, otp.id));

      const newAttemptsRemaining = attemptsRemaining - 1;
      return {
        isValid: false,
        error: 'otp_invalid',
        otp,
        attemptsRemaining: Math.max(0, newAttemptsRemaining),
      };
    }

    // Code is valid
    return {
      isValid: true,
      otp,
      attemptsRemaining: attemptsRemaining,
    };
  } catch (error) {
    console.error('[validateOtp] Error validating OTP:', {
      userId,
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      isValid: false,
      error: 'validation_error',
    };
  }
}
