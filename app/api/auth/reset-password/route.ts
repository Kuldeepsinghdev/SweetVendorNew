import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/src/db';
import { users, passwordResets } from '@/src/db/schema';
import { eq, sql } from 'drizzle-orm';
import { ensureAuthTables } from '@/lib/db/ensureAuthTables';

/**
 * POST /api/auth/reset-password
 * Body: { token: string, password: string }
 *
 * Completes the self-serve reset flow. Validates the single-use token (exists,
 * not used, not expired), sets the user's password (bcrypt into pin_hash),
 * marks the token used, and invalidates any other outstanding tokens for that
 * user.
 */

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest) {
  try {
    // Self-heal: make sure the password_resets table exists before we use it.
    await ensureAuthTables();

    const body = await request.json().catch(() => ({}));
    const token = String(body?.token ?? '').trim();
    const password = String(body?.password ?? '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing reset token.' },
        { status: 400 }
      );
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    // Look up by the SHA-256 hash of the presented token.
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const rows = await db
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.tokenHash, tokenHash))
      .limit(1);

    const record = rows[0];
    const now = new Date();

    const invalid =
      !record ||
      record.usedAt != null ||
      new Date(record.expiresAt).getTime() < now.getTime();

    if (invalid) {
      return NextResponse.json(
        {
          success: false,
          error: 'This reset link is invalid or has expired. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Confirm the target user still exists and is active.
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, record.userId))
      .limit(1);
    const user = userRows[0];

    if (!user || user.isActive === false) {
      return NextResponse.json(
        { success: false, error: 'Account not found or inactive.' },
        { status: 400 }
      );
    }

    // Set the new password (bcrypt) and clear any forced-reset flag.
    const pinHash = await bcrypt.hash(password, 10);
    await db
      .update(users)
      .set({ pinHash, mustResetPin: false, updatedAt: now.toISOString() })
      .where(eq(users.id, user.id));

    // Mark this token used and invalidate all other outstanding tokens for the
    // user so a leaked older link can't be reused.
    await db
      .update(passwordResets)
      .set({ usedAt: now.toISOString() })
      .where(
        sql`${passwordResets.userId} = ${user.id} AND ${passwordResets.usedAt} IS NULL`
      );

    return NextResponse.json({
      success: true,
      message: 'Your password has been updated. You can now sign in.',
    });
  } catch (error) {
    console.error('reset-password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
