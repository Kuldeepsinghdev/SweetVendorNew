'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { users, saleCenters } from '@/src/db/schema';
import {
  createCustomerSession,
  destroyCustomerSession,
  type CustomerRole,
} from '@/lib/auth/customerSession';
import { isLocale } from '@/src/lib/locale';

/**
 * Customer / Mitra authentication Server Actions.
 *
 * Credentials are verified server-side and a signed httpOnly customer
 * cookie session is established — the client never holds the identity.
 * Only non-admin roles (`customer`, `mitra`) may use this path.
 */

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

export type CustomerLoginState = { error?: string };

const PhoneSchema = z.object({
  method: z.literal('phone'),
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  pin: z.string().trim().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
  next: z.string().optional(),
});

const EmailSchema = z.object({
  method: z.literal('email'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(128),
  next: z.string().optional(),
});

type ResolvedUser = typeof users.$inferSelect;

function isCustomerRole(role: string): role is CustomerRole {
  return role === 'customer' || role === 'mitra';
}

async function verifyOrProvision(
  user: ResolvedUser | undefined,
  secret: string,
  isEmail: boolean
): Promise<ResolvedUser | null> {
  if (!user) return null;
  if (user.isActive === false) return null;
  if (!isCustomerRole(user.role)) return null;

  if (!user.pinHash) {
    if (isEmail) {
      if (secret.length >= 6) {
        const pinHash = await bcrypt.hash(secret, 10);
        await db
          .update(users)
          .set({ pinHash, updatedAt: new Date().toISOString() })
          .where(eq(users.id, user.id));
        return { ...user, pinHash };
      }
      return null;
    }
    if (/^\d{4}$/.test(secret)) {
      const pinHash = await bcrypt.hash(secret, 10);
      await db
        .update(users)
        .set({ pinHash, updatedAt: new Date().toISOString() })
        .where(eq(users.id, user.id));
      return { ...user, pinHash };
    }
    return null;
  }

  const ok = await bcrypt.compare(secret, user.pinHash);
  return ok ? user : null;
}

async function finishLogin(user: ResolvedUser, next: string | undefined): Promise<never> {
  let centerId: string | null = null;
  if (user.role === 'mitra') {
    const rows = await db
      .select()
      .from(saleCenters)
      .where(eq(saleCenters.ownerUserId, user.id))
      .limit(1);
    centerId = rows[0]?.id ?? null;
  }

  await createCustomerSession({
    sub: user.id,
    role: user.role as CustomerRole,
    name: user.name,
    phone: user.phone,
    centerId,
    cityId: user.cityId ?? null,
    distributionCenterId: (user as any).distributionCenterId ?? null,
  });

  // Determine default redirect based on user role
  let defaultDest = '/';
  if (user.role === 'mitra') {
    defaultDest = '/mitra/portal';
  }

  // Only same-site relative redirects to prevent open-redirect abuse.
  // If next param is provided and safe, use it; otherwise use role-based default.
  const dest = next && next.startsWith('/') && !next.includes('..')
    ? next
    : defaultDest;
  redirect(dest);
}

export async function customerLoginAction(
  _prev: CustomerLoginState,
  formData: FormData
): Promise<CustomerLoginState> {
  const locale = await getRequestLocale();
  const method = (formData.get('method') as string) === 'email' ? 'email' : 'phone';
  const next = (formData.get('next') as string) ?? undefined;

  if (method === 'email') {
    const parsed = EmailSchema.safeParse({
      method: 'email',
      email: formData.get('email'),
      password: formData.get('password'),
      next,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? getErrorMessage(locale, 'invalid_input') };

    if (parsed.data.password.length < 6) {
      return { error: locale === 'hi' ? 'पासवर्ड कम से कम 6 वर्णों का होना चाहिए।' : 'Password must be at least 6 characters.' };
    }

    const rows = await db
      .select()
      .from(users)
      .where(eq(sql`lower(${users.email})`, parsed.data.email.toLowerCase()))
      .limit(1);
    const user = await verifyOrProvision(rows[0], parsed.data.password, true);
    if (!user) return { error: getErrorMessage(locale, 'invalid_credentials') };
    return finishLogin(user, parsed.data.next);
  }

  const parsed = PhoneSchema.safeParse({
    method: 'phone',
    phone: formData.get('phone'),
    pin: formData.get('pin'),
    next,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? getErrorMessage(locale, 'invalid_input') };

  const normalizedPhone = parsed.data.phone.replace(/\D/g, '').slice(-10);
  const rows = await db.select().from(users).where(eq(users.phone, normalizedPhone)).limit(1);
  const user = await verifyOrProvision(rows[0], parsed.data.pin, false);
  if (!user) return { error: getErrorMessage(locale, 'invalid_credentials') };
  return finishLogin(user, parsed.data.next);
}

export async function customerLogoutAction(): Promise<void> {
  await destroyCustomerSession();
  redirect('/');
}
