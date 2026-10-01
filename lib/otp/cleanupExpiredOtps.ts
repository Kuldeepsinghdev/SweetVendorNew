import 'server-only';
import { db } from '@/src/db';
import { loginOtps } from '@/src/db/schema';
import { lt } from 'drizzle-orm';

export interface CleanupResult {
  deleted: number;
}

/**
 * Delete all expired OTP records (where expiresAt < now).
 * This is a periodic cleanup task to keep the login_otps table lean.
 *
 * Security note: This function does NOT log the OTP codes or other sensitive data.
 * Only the count is logged for auditing.
 *
 * @returns Object with count of deleted records
 */
export async function cleanupExpiredOtps(): Promise<CleanupResult> {
  try {
    const now = new Date().toISOString();

    const result = await db
      .delete(loginOtps)
      .where(lt(loginOtps.expiresAt, now));

    // Result is the deleted count (Drizzle returns the count for DELETE operations)
    const deletedCount = typeof result === 'object' ? 0 : result;

    // Log the cleanup event (WITHOUT sensitive data like OTP codes)
    console.log(`[cleanupExpiredOtps] Deleted ${deletedCount} expired OTP records at ${now}`);

    return {
      deleted: deletedCount,
    };
  } catch (error) {
    console.error('[cleanupExpiredOtps] Error cleaning up expired OTPs:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      deleted: 0,
    };
  }
}
