import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/src/db';
import { users, passwordResets } from '@/src/db/schema';
import { sql } from 'drizzle-orm';
import { sendResetEmail } from '@/lib/email/sendResetEmail';
import { ensureAuthTables } from '@/lib/db/ensureAuthTables';

/**
 * POST /api/auth/request-password-reset
 * Body: { email: string }
 *
 * Starts the self-serve password-reset flow. Always responds 200 with a generic
 * message so the endpoint never reveals whether an email is registered
 * (prevents account enumeration). If a matching active user exists, a
 * single-use token is created and a reset link is emailed.
 */

const TOKEN_TTL_MINUTES = 30;

export async function POST(request: NextRequest) {
  // Generic response returned in all cases (found, not-found, or error paths
  // that shouldn't leak information).
  const genericOk = () =>
    NextResponse.json({
      success: true,
      message:
        'If an account exists for that email, a password reset link has been sent.',
    });

  try {
    // Self-heal: make sure the password_resets table exists before we use it.
    await ensureAuthTables();

    const body = await request.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      // Don't reveal validation specifics beyond the generic message.
      return genericOk();
    }

    // Case-insensitive lookup on the normalized email.
    const rows = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    const user = rows[0];

    // Only issue tokens for active accounts that actually have this email.
    if (user && user.isActive !== false) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + TOKEN_TTL_MINUTES * 60_000);

      // Invalidate any previous outstanding (unused, unexpired) tokens for this
      // user so only the newest link works.
      await db
        .update(passwordResets)
        .set({ usedAt: now.toISOString() })
        .where(
          sql`${passwordResets.userId} = ${user.id} AND ${passwordResets.usedAt} IS NULL`
        );

      // Generate a high-entropy raw token; store only its SHA-256 hash.
      const rawToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await db.insert(passwordResets).values({
        id: `pwr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        userId: user.id,
        email,
        tokenHash,
        expiresAt: expiresAt.toISOString(),
        usedAt: null,
        createdAt: now.toISOString(),
      });

      try {
        await sendResetEmail({
          to: email,
          rawToken,
          expiresInMinutes: TOKEN_TTL_MINUTES,
        });
      } catch (mailErr) {
        // Log server-side but still return the generic success message.
        console.error('request-password-reset: failed to send email:', mailErr);
      }
    }

    return genericOk();
  } catch (error) {
    console.error('request-password-reset error:', error);
    // Even on unexpected errors, avoid leaking information.
    return genericOk();
  }
}
