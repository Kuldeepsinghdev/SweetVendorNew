import 'server-only';

/**
 * Server-side audit logging for OTP authentication events.
 * These logs are for security auditing and debugging purposes.
 *
 * SECURITY NOTES:
 *   - OTP codes are NEVER logged
 *   - Emails and user IDs are logged for audit trail
 *   - Timestamps and event details are recorded for detection of abuse patterns
 */

export interface OtpLogEntry {
  timestamp: string;
  email: string;
  userId?: string;
  event: 'request' | 'verification' | 'rate_limit' | 'error';
  status: 'success' | 'failed';
  reason?: string;
  attemptsUsed?: number;
}

/**
 * Log an OTP request event (when user requests a new OTP).
 * No OTP code is logged for security.
 */
export function logOtpRequest(params: {
  email: string;
  userId?: string;
  status: 'success' | 'failed';
  reason?: string;
}): void {
  const { email, userId, status, reason } = params;
  const timestamp = new Date().toISOString();

  const logLevel = status === 'success' ? 'info' : 'warn';
  const reasonStr = reason ? ` — ${reason}` : '';

  console[logLevel as 'info' | 'warn'](
    `[OTP] Request ${status} for ${email}${reasonStr}`,
    {
      timestamp,
      email,
      userId,
      event: 'request',
      status,
    }
  );
}

/**
 * Log an OTP verification event (when user submits an OTP code).
 * Tracks attempt count for abuse detection.
 */
export function logOtpVerification(params: {
  email: string;
  userId?: string;
  success: boolean;
  reason?: string;
  attemptsUsed?: number;
}): void {
  const { email, userId, success, reason, attemptsUsed } = params;
  const timestamp = new Date().toISOString();

  const logLevel = success ? 'info' : 'warn';
  const reasonStr = reason ? ` — ${reason}` : '';
  const attemptsStr = attemptsUsed !== undefined ? ` (attempt ${attemptsUsed}/5)` : '';

  console[logLevel as 'info' | 'warn'](
    `[OTP] Verification ${success ? 'succeeded' : 'failed'} for ${email}${attemptsStr}${reasonStr}`,
    {
      timestamp,
      email,
      userId,
      event: 'verification',
      status: success ? 'success' : 'failed',
      attemptsUsed,
    }
  );
}

/**
 * Log rate limiting events (when user hits the 3-per-hour limit).
 * Used to identify potential brute-force attacks.
 */
export function logRateLimitHit(params: {
  email: string;
  userId?: string;
}): void {
  const { email, userId } = params;
  const timestamp = new Date().toISOString();

  console.warn(
    `[OTP] Rate limit exceeded for ${email} — 3+ requests in 1 hour`,
    {
      timestamp,
      email,
      userId,
      event: 'rate_limit',
      status: 'failed',
    }
  );
}

/**
 * Log general OTP errors for debugging and monitoring.
 */
export function logOtpError(params: {
  email: string;
  userId?: string;
  error: string;
  context?: string;
}): void {
  const { email, userId, error, context } = params;
  const timestamp = new Date().toISOString();

  console.error(
    `[OTP] Error for ${email}: ${error}${context ? ` (${context})` : ''}`,
    {
      timestamp,
      email,
      userId,
      event: 'error',
      status: 'failed',
      error,
    }
  );
}
