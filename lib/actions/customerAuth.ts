'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, saleCenters } from '@/src/db/schema';
import {
  createCustomerSession,
  destroyCustomerSession,
  type CustomerRole,
} from '@/lib/auth/customerSession';

/**
 * Customer / Mitra authentication Server Actions (Task 6/7).
 *
 * Replaces the legacy client-facing `POST /api/auth/login` route that returned
 * the user as JSON for the client to hold (the old localStorage trust model).
 * Here credentials are verified server-side and a signed httpOnly customer
 * cookie session is established — the client never holds the identity.
 *
 * Only non-admin roles (`customer`, `mitra`) may use this path. Admin roles must
 * use the admin login (lib/actions/auth.ts + /admin), which issues the separate
 * admin session. Deny by default.
 */

export type CustomerLoginState = { error?: string };

const PhoneSchema = z.object({
  method: z.literal('phone'),
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  pin: z.string().trim().min(4, 'PIN must be at least 4 characters').max(64),
  next: z.string().optional(),
  locale: z.string().optional(),
});

const EmailSchema = z.object({
  method: z.literal('email'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(128),
  next: z.string().optional(),
  locale: z.string().optional(),
});

type ResolvedUser = typeof users.$inferSelect;

/** Only customers and mitra authenticate here. */
function isCustomerRole(role: string): role is CustomerRole {
  return role === 'customer' || role === 'mitra';
}

/**
 * Verify a user row and secret. Returns the row on success.
 *
 * First-time login provisioning:
 * - Phone: 4-digit numeric PIN is accepted on first login (no existing hash)
 *   and stored as the credential going forward.
 * - Email: password (>=6 chars) is accepted on first login (no existing hash)
 *   and stored as the credential going forward. This lets newly-created users
 *   set their own password on first sign-in without needing an admin to run
 *   the set-password script first.
 *
 * Admin roles always require a pre-set hash and must use the /admin portal.
 */
async function verifyOrProvision(
  user: ResolvedUser | undefined,
  secret: string,
  isEmail: boolean
): Promise<ResolvedUser | null> {
  if (!user) return null;
  if (user.isActive === false) return null;
  if (!isCustomerRole(user.role)) return null; // admins must use /admin

  if (!user.pinHash) {
    // First-time login: provision the credential on first use.
    if (isEmail) {
      // Allow any password ≥6 chars on first email login.
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
    // Phone: allow 4-digit numeric PIN on first login.
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

async function finishLogin(user: ResolvedUser, next: string | undefined, locale?: string): Promise<never> {
  // For mitra, resolve their assigned sale-centre so the flow can be scoped.
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
  });

  const loc = locale === 'en' || locale === 'hi' ? locale : 'hi';
  // Only same-site relative redirects, to avoid open-redirect abuse.
  const dest = next && next.startsWith('/') ? next : `/${loc}`;
  redirect(dest);
}

export async function customerLoginAction(
  _prev: CustomerLoginState,
  formData: FormData
): Promise<CustomerLoginState> {
  const method = (formData.get('method') as string) === 'email' ? 'email' : 'phone';
  const next = (formData.get('next') as string) ?? undefined;
  const localeRaw = formData.get('locale');
  const locale = localeRaw === 'en' || localeRaw === 'hi' ? localeRaw : undefined;

  if (method === 'email') {
    const parsed = EmailSchema.safeParse({
      method: 'email',
      email: formData.get('email'),
      password: formData.get('password'),
      next,
      locale,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

    // Enforce minimum password length (6 chars) upfront for clear UX.
    if (parsed.data.password.length < 6) {
      return { error: hi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.' };
    }

    const rows = await db
      .select()
      .from(users)
      .where(eq(sql`lower(${users.email})`, parsed.data.email.toLowerCase()))
      .limit(1);
    const user = await verifyOrProvision(rows[0], parsed.data.password, true);
    if (!user) return { error: 'Invalid credentials or not authorized for this portal.' };
    return finishLogin(user, parsed.data.next, locale);
  }

  const parsed = PhoneSchema.safeParse({
    method: 'phone',
    phone: formData.get('phone'),
    pin: formData.get('pin'),
    next,
    locale,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const normalizedPhone = parsed.data.phone.replace(/\D/g, '').slice(-10);
  const rows = await db.select().from(users).where(eq(users.phone, normalizedPhone)).limit(1);
  const user = await verifyOrProvision(rows[0], parsed.data.pin, false);
  if (!user) return { error: 'Invalid credentials or not authorized for this portal.' };
  return finishLogin(user, parsed.data.next, locale);
}

export async function customerLogoutAction(formData?: FormData): Promise<void> {
  await destroyCustomerSession();
  const rawLocale = formData?.get('locale');
  const loc = rawLocale === 'en' || rawLocale === 'hi' ? rawLocale : 'hi';
  redirect(`/${loc}`);
}
