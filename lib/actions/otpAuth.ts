'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { eq, and, isNull, gte } from 'drizzle-orm';
import { headers } from 'next/headers';
import { db } from '@/src/db';
import { users, loginOtps } from '@/src/db/schema';
import { createCustomerSession } from '@/lib/auth/customerSession';
import { ensureAuthTables } from '@/lib/db/ensureAuthTables';
import { isLocale } from '@/src/lib/locale';
import { generateOtpCode } from '@/lib/otp/generateOtpCode';
import { generateOtpId } from '@/lib/otp/generateOtpId';
import { getOtpExpiration } from '@/lib/otp/getOtpExpiration';
import { validateOtp } from '@/lib/otp/validateOtp';
import { getErrorMessage } from '@/lib/otp/getErrorMessage';
import { sendOtpEmail } from '@/lib/email/sendOtpEmail';
import {
  logOtpRequest,
  logOtpVerification,
  logRateLimitHit,
  logOtpError,
} from '@/lib/otp/auditLog';

/**
 * Get the current locale from the request header (set by middleware).
 * Defaults to 'hi' (Hindi) if not set or invalid.
 */
async function getRequestLocale(): Promise<'en' | 'hi'> {
  try {
    const h = await headers();
    const loc = h.get('x-locale');
    return isLocale(loc) && loc === 'en' ? 'en' : 'hi';
  } catch {
    return 'hi';
  }
}

/**
 * Check if OTP login is enabled via feature flag.
 */
function isOtpLoginEnabled(): boolean {
  return process.env.ENABLE_OTP_LOGIN === 'true';
}

/**
 * Validate email format using a simple RFC 5322 regex.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Request an OTP for Mitra login.
 *
 * Process:
 *   1. Validate email format
 *   2. Query user: email (case-insensitive), role='mitra', isActive=true
 *   3. Check rate limit: max 3 OTP requests per email per hour
 *   4. Generate OTP code and store in login_otps
 *   5. Send OTP via email
 *   6. Log event (no plaintext OTP)
 *
 * Returns: { success: boolean, error?: string, otpId?: string, expiresAt?: string }
 */
export async function requestOtpAction(params: {
  email: string;
  locale: string;
}): Promise<{
  success: boolean;
  error?: string;
  otpExpiresAt?: string;
  otp?: string; // dev-mode only
}> {
  const locale = isLocale(params.locale) ? (params.locale as 'en' | 'hi') : await getRequestLocale();

  // Feature flag check
  if (!isOtpLoginEnabled()) {
    const error = getErrorMessage('validation_error', locale);
    logOtpError({
      email: params.email,
      error: 'OTP login is disabled',
      context: 'ENABLE_OTP_LOGIN=false',
    });
    return { success: false, error };
  }

  // Ensure auth tables exist (self-healing)
  await ensureAuthTables();

  // Validate email format
  const trimmedEmail = params.email.trim().toLowerCase();
  if (!isValidEmail(trimmedEmail)) {
    const error = getErrorMessage('invalid_email', locale);
    logOtpRequest({
      email: trimmedEmail,
      status: 'failed',
      reason: 'invalid_email',
    });
    return { success: false, error };
  }

  try {
    // Query user: email (case-insensitive), role='mitra', isActive=true
    const userResults = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, trimmedEmail),
          eq(users.role, 'mitra'),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    console.log(`[OTP-DEBUG] Querying email: "${trimmedEmail}" (lowercase)`);
    console.log(`[OTP-DEBUG] Found ${userResults.length} user(s)`);

    const user = userResults[0];

    // Generic message to prevent email enumeration
    if (!user) {
      const error = getErrorMessage('user_not_found', locale);
      console.log(`[OTP-DEBUG] User not found for email: ${trimmedEmail}`);
      logOtpRequest({
        email: trimmedEmail,
        status: 'failed',
        reason: 'user_not_found',
      });
      return { success: false, error };
    }

    console.log(`[OTP-DEBUG] User found: ${user.id}`);

    // Rate limiting: check for 3+ OTP requests in the past 1 hour (skip in dev mode)
    if (process.env.NODE_ENV === 'production') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentOtps = await db
        .select()
        .from(loginOtps)
        .where(
          and(
            eq(loginOtps.userId, user.id),
            eq(loginOtps.method, 'email'),
            gte(loginOtps.createdAt, oneHourAgo)
          )
        );

      if (recentOtps.length >= 3) {
        const error = getErrorMessage('rate_limited', locale);
        logRateLimitHit({
          email: trimmedEmail,
          userId: user.id,
        });
        return { success: false, error };
      }
    } else {
      // Development mode: delete old OTPs to allow unlimited testing
      await db.delete(loginOtps).where(eq(loginOtps.userId, user.id));
      console.log(`[OTP] Dev mode: cleared old OTPs for ${trimmedEmail}`);
    }

    // Generate and store OTP
    const otpCode = generateOtpCode();
    const otpId = generateOtpId();
    const expiresAt = getOtpExpiration();
    const createdAt = new Date().toISOString();

    await db.insert(loginOtps).values({
      id: otpId,
      userId: user.id,
      emailAddress: trimmedEmail,
      otpCode,
      method: 'email',
      attempts: 0,
      maxAttempts: 5,
      createdAt,
      expiresAt,
      verifiedAt: null,
    });

    // Always log OTP in dev mode for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 [OTP for Testing] Email: ${trimmedEmail}`);
      console.log(`🔐 OTP Code: ${otpCode}`);
      console.log(`⏰ Expires at: ${expiresAt}\n`);
    }

    // Send OTP email
    const emailSent = await sendOtpEmail({
      email: trimmedEmail,
      otpCode,
      locale,
      expiresInMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    });

    // For development: if email fails, log to console and allow verification to proceed
    if (!emailSent) {
      console.warn(
        `[OTP] Email failed for ${trimmedEmail}, but OTP stored. Dev mode: allowing verification. OTP: ${otpCode}`
      );
      // In development, we still allow the user to proceed with verification
      // In production, this should fail
      if (process.env.NODE_ENV === 'production') {
        const error = getErrorMessage('email_send_failed', locale);
        logOtpRequest({
          email: trimmedEmail,
          userId: user.id,
          status: 'failed',
          reason: 'email_send_failed',
        });
        return { success: false, error };
      }
    }

    logOtpRequest({
      email: trimmedEmail,
      userId: user.id,
      status: 'success',
    });

    // Return OTP for dev-mode client logging (only in development)
    return {
      success: true,
      otpExpiresAt: expiresAt,
      ...(process.env.NODE_ENV !== 'production' && { otp: otpCode }),
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logOtpError({
      email: trimmedEmail,
      error: errorMsg,
      context: 'requestOtpAction',
    });
    const fallbackError = getErrorMessage('validation_error', locale);
    return { success: false, error: fallbackError };
  }
}

/**
 * Verify an OTP code and create a customer session.
 *
 * Process:
 *   1. Query user by email (case-insensitive)
 *   2. Validate: isActive=true, role='mitra'
 *   3. Validate OTP: not expired, attempts < maxAttempts, code matches
 *   4. If valid:
 *      - Set verifiedAt
 *      - Invalidate other OTPs
 *      - Create session via createCustomerSession()
 *      - Redirect to /[locale]/mitra/portal
 *   5. Log verification event
 *
 * This is a 'never' function (always redirects or throws on success).
 */
export async function verifyOtpAction(params: {
  email: string;
  otpCode: string;
  locale: string;
}): Promise<{ success: false; error: string; attemptsRemaining?: number }> {
  const locale = isLocale(params.locale) ? (params.locale as 'en' | 'hi') : await getRequestLocale();
  const trimmedEmail = params.email.trim().toLowerCase();

  try {
    // Query user
    const userResults = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, trimmedEmail),
          eq(users.role, 'mitra'),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    const user = userResults[0];
    if (!user) {
      const error = getErrorMessage('user_not_found', locale);
      logOtpVerification({
        email: trimmedEmail,
        success: false,
        reason: 'user_not_found',
      });
      return { success: false, error };
    }

    // Validate OTP
    const validation = await validateOtp(user.id, trimmedEmail, params.otpCode);

    if (!validation.isValid) {
      const errorKey = validation.error || 'validation_error';
      const error = getErrorMessage(errorKey, locale);

      logOtpVerification({
        email: trimmedEmail,
        userId: user.id,
        success: false,
        reason: errorKey,
        attemptsUsed: validation.otp?.attempts ? validation.otp.attempts + 1 : undefined,
      });

      return {
        success: false,
        error,
        attemptsRemaining: validation.attemptsRemaining,
      };
    }

    // OTP is valid: mark as verified
    const now = new Date().toISOString();
    await db
      .update(loginOtps)
      .set({ verifiedAt: now })
      .where(eq(loginOtps.id, validation.otp!.id));

    // Invalidate other unverified OTPs for this user (reuse prevention)
    await db
      .update(loginOtps)
      .set({ verifiedAt: now })
      .where(
        and(
          eq(loginOtps.userId, user.id),
          eq(loginOtps.method, 'email'),
          isNull(loginOtps.verifiedAt)
        )
      );

    // Log successful verification
    logOtpVerification({
      email: trimmedEmail,
      userId: user.id,
      success: true,
    });

    // Create customer session
    await createCustomerSession({
      sub: user.id,
      role: 'mitra',
      name: user.name,
      phone: user.phone,
      centerId: user.cityId ?? null,
      cityId: user.cityId ?? null,
      distributionCenterId: user.distributionCenterId ?? null,
    });

    // Redirect to Mitra portal (always same-site, safe redirect)
    redirect(`/${locale}/mitra/portal`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Don't log redirect as an error
    if (errorMsg.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error(`[OTP-VERIFY-ERROR] Error verifying OTP for ${trimmedEmail}:`, errorMsg);

    logOtpError({
      email: trimmedEmail,
      error: errorMsg,
      context: 'verifyOtpAction',
    });

    const fallbackError = getErrorMessage('validation_error', locale);
    return { success: false, error: fallbackError };
  }
}
