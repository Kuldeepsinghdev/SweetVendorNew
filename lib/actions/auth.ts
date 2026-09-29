'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { createSession, destroySession, type AdminRole } from '@/lib/auth/session';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq, sql } from 'drizzle-orm';

type VerifiedUser = { sub: string; role: AdminRole; name: string; phone: string };

/**
 * Shared post-lookup checks: active flag, admin-level role, and bcrypt
 * verification of the supplied secret (PIN or password) against `pinHash`.
 */
async function verifyUserRow(
  user: typeof users.$inferSelect | undefined,
  secret: string
): Promise<VerifiedUser | null> {
  if (!user) return null;

  // Check if user is active
  if (user.isActive === false) return null;

  // Check role is admin-level
  if (user.role !== 'kendra' && user.role !== 'city_admin' && user.role !== 'super_admin') {
    return null;
  }

  // Verify credential hash (same bcrypt `pinHash` column backs PIN & password)
  if (!user.pinHash) return null;
  const ok = await bcrypt.compare(secret, user.pinHash);
  if (!ok) return null;

  return {
    sub: user.id,
    role: user.role as AdminRole,
    name: user.name,
    phone: user.phone,
  };
}

/**
 * DB-backed credential verification via phone + PIN.
 *
 * Looks up the user by phone in the `users` table and verifies the PIN
 * against the stored bcrypt hash. Denies by default if user not found,
 * inactive, non-admin role, or PIN mismatch.
 */
async function verifyCredentials(
  phone: string,
  pin: string
): Promise<VerifiedUser | null> {
  // Normalize phone to 10 digits
  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
  if (normalizedPhone.length !== 10) return null;

  // Query the users table for this phone
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);

  return verifyUserRow(rows[0], pin);
}

/**
 * DB-backed credential verification via email + password.
 *
 * Looks up the user by a case-insensitive email match and verifies the
 * password against the stored bcrypt hash. Same deny-by-default rules as
 * the phone/PIN path.
 */
async function verifyEmailCredentials(
  email: string,
  password: string
): Promise<VerifiedUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const rows = await db
    .select()
    .from(users)
    .where(eq(sql`lower(${users.email})`, normalizedEmail))
    .limit(1);

  return verifyUserRow(rows[0], password);
}

const PhoneLoginSchema = z.object({
  method: z.literal('phone'),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  pin: z.string().trim().min(4, 'PIN must be at least 4 characters').max(64),
  next: z.string().optional(),
});

const EmailLoginSchema = z.object({
  method: z.literal('email'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(128),
  next: z.string().optional(),
});

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  // Default to phone for backward compatibility with the original contract.
  const method = (formData.get('method') as string) === 'email' ? 'email' : 'phone';
  const next = (formData.get('next') as string) ?? undefined;
  const localeRaw = formData.get('locale');
  const locale = localeRaw === 'en' || localeRaw === 'hi' ? localeRaw : undefined;

  let user: VerifiedUser | null = null;

  if (method === 'email') {
    const parsed = EmailLoginSchema.safeParse({
      method: 'email',
      email: formData.get('email'),
      password: formData.get('password'),
      next,
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }
    user = await verifyEmailCredentials(parsed.data.email, parsed.data.password);
    if (!user) {
      // Generic message — do not reveal whether email or password was wrong.
      return { error: 'Invalid credentials or not authorized for this portal.' };
    }
    return finishLogin(user, parsed.data.next, locale);
  }

  const parsed = PhoneLoginSchema.safeParse({
    method: 'phone',
    phone: formData.get('phone'),
    pin: formData.get('pin'),
    next,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  user = await verifyCredentials(parsed.data.phone, parsed.data.pin);
  if (!user) {
    // Generic message — do not reveal whether phone or PIN was wrong.
    return { error: 'Invalid credentials or not authorized for this portal.' };
  }
  return finishLogin(user, parsed.data.next, locale);
}

async function finishLogin(user: VerifiedUser, next?: string, locale?: string): Promise<never> {

  await createSession(user);

  const loc = locale === 'en' || locale === 'hi' ? locale : 'hi';
  // Only allow same-site relative redirects to avoid open-redirect abuse.
  // Fall back to the locale-scoped dashboard when `next` is absent/unsafe.
  const dest = next && next.startsWith('/') ? next : `/${loc}/dashboard`;
  redirect(dest);
}

export async function logoutAction(formData?: FormData): Promise<void> {
  await destroySession();
  const rawLocale = formData?.get('locale');
  const loc = rawLocale === 'en' || rawLocale === 'hi' ? rawLocale : 'hi';
  redirect(`/${loc}/admin`);
}
