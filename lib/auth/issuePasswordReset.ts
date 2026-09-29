import 'server-only';
import crypto from 'crypto';
import { db } from '@/src/db';
import { users, passwordResets } from '@/src/db/schema';
import { eq, sql } from 'drizzle-orm';
import { sendResetEmail } from '@/lib/email/sendResetEmail';
import { ensureAuthTables } from '@/lib/db/ensureAuthTables';

/**
 * Shared helper that mints a single-use password token for a user and emails
 * the link. Used by:
 *   - the self-serve reset flow (purpose 'reset', short expiry)
 *   - new-account provisioning, e.g. approved Sahakar Mitra (purpose 'setup',
 *     longer expiry so the recipient has time to act)
 *
 * Only the SHA-256 hash of the token is stored. Any previous outstanding
 * (unused) tokens for the user are invalidated so only the newest link works.
 *
 * Returns { sent: boolean } where sent reflects whether SMTP accepted the mail
 * (false if SMTP is unconfigured and the link was only logged). If the email
 * does not resolve to an active user, this is a no-op that returns sent:false.
 */
export async function issuePasswordEmail(params: {
  email: string;
  purpose: 'reset' | 'setup';
}): Promise<{ sent: boolean; userFound: boolean }> {
  await ensureAuthTables();

  const email = params.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { sent: false, userFound: false };
  }

  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
  const user = rows[0];

  if (!user || user.isActive === false) {
    return { sent: false, userFound: false };
  }

  const ttlMinutes = params.purpose === 'setup' ? 60 * 24 : 30; // setup: 24h, reset: 30m
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000);

  // Invalidate previous outstanding tokens for this user.
  await db
    .update(passwordResets)
    .set({ usedAt: now.toISOString() })
    .where(
      sql`${passwordResets.userId} = ${user.id} AND ${passwordResets.usedAt} IS NULL`
    );

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

  const sent = await sendResetEmail({
    to: email,
    rawToken,
    expiresInMinutes: ttlMinutes,
    purpose: params.purpose,
  });

  return { sent, userFound: true };
}

// Re-export for callers that only need the user lookup id, if ever needed.
export { users as usersTable };
