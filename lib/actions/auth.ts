'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { createSession, destroySession, type AdminRole } from '@/lib/auth/session';
import { headers } from 'next/headers';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq, sql } from 'drizzle-orm';
import { isLocale } from '@/src/lib/locale';

type VerifiedUser = { sub: string; role: AdminRole; name: string; phone: string };

/**
 * Get the current locale from the request header (set by middleware).
 * Defaults to 'hi' (Hindi) if not set or invalid.
 */
async function getRequestLocale(): Promise<'hi' | 'en'> {
  try {
    const h = await headers();
    const loc = h.get('x-locale');
    return isLocale(loc) && loc === 'en' ? 'en' : 'hi';
  } catch {
    return 'hi';
  }
}

/**
 * Localized error messages for authentication failures.
 */
function getErrorMessage(locale: 'hi' | 'en', type: 'invalid_credentials' | 'invalid_input'): string {
  if (locale === 'hi') {
    return type === 'invalid_credentials'
      ? 'अमान्य साख-पत्र या इस पोर्टल के लिए अनुमति नहीं है।'
      : 'अमान्य इनपुट';
  }
  return type === 'invalid_credentials'
    ? 'Invalid credentials or not authorized for this portal.'
    : 'Invalid input';
}

async function verifyUserRow(
  user: typeof users.$inferSelect | undefined,
  secret: string
): Promise<VerifiedUser | null> {
  if (!user) return null;
  if (user.isActive === false) return null;
  if (user.role !== 'kendra' && user.role !== 'city_admin' && user.role !== 'super_admin') {
    return null;
  }
  if (!user.pinHash) return null;
  const ok = await bcrypt.compare(secret, user.pinHash);
  if (!ok) return null;
  return { sub: user.id, role: user.role as AdminRole, name: user.name, phone: user.phone };
}

async function verifyCredentials(phone: string, pin: string): Promise<VerifiedUser | null> {
  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
  if (normalizedPhone.length !== 10) return null;
  const rows = await db.select().from(users).where(eq(users.phone, normalizedPhone)).limit(1);
  return verifyUserRow(rows[0], pin);
}

async function verifyEmailCredentials(email: string, password: string): Promise<VerifiedUser | null> {
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
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
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
  const locale = await getRequestLocale();
  const method = (formData.get('method') as string) === 'email' ? 'email' : 'phone';
  const next = (formData.get('next') as string) ?? undefined;

  let user: VerifiedUser | null = null;

  if (method === 'email') {
    const parsed = EmailLoginSchema.safeParse({
      method: 'email',
      email: formData.get('email'),
      password: formData.get('password'),
      next,
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? getErrorMessage(locale, 'invalid_input') };
    }
    user = await verifyEmailCredentials(parsed.data.email, parsed.data.password);
    if (!user) return { error: getErrorMessage(locale, 'invalid_credentials') };
    return finishLogin(user, parsed.data.next);
  }

  const parsed = PhoneLoginSchema.safeParse({
    method: 'phone',
    phone: formData.get('phone'),
    pin: formData.get('pin'),
    next,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? getErrorMessage(locale, 'invalid_input') };
  }
  user = await verifyCredentials(parsed.data.phone, parsed.data.pin);
  if (!user) return { error: getErrorMessage(locale, 'invalid_credentials') };
  return finishLogin(user, parsed.data.next);
}

async function finishLogin(user: VerifiedUser, next?: string): Promise<never> {
  await createSession(user);
  // Only same-site relative redirects to prevent open-redirect abuse.
  const dest = next && next.startsWith('/') ? next : '/admin/dashboard';
  redirect(dest);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/admin');
}
