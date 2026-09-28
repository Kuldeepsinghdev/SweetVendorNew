'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { createSession, destroySession, type AdminRole } from '@/lib/auth/session';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

/**
 * DB-backed credential verification.
 *
 * Looks up the user by phone in the `users` table and verifies the PIN
 * against the stored bcrypt hash. Returns the user's role, name, and id
 * for session creation. Denies by default if user not found, inactive,
 * or PIN mismatch.
 */
async function verifyCredentials(
  phone: string,
  pin: string
): Promise<{ sub: string; role: AdminRole; name: string; phone: string } | null> {
  // Normalize phone to 10 digits
  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
  if (normalizedPhone.length !== 10) return null;

  // Query the users table for this phone
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);

  const user = rows[0];
  if (!user) return null;

  // Check if user is active
  if (user.isActive === false) return null;

  // Check role is admin-level
  if (user.role !== 'kendra' && user.role !== 'city_admin' && user.role !== 'super_admin') {
    return null;
  }

  // Verify PIN hash
  if (!user.pinHash) return null;
  const ok = await bcrypt.compare(pin, user.pinHash);
  if (!ok) return null;

  return {
    sub: user.id,
    role: user.role as AdminRole,
    name: user.name,
    phone: user.phone,
  };
}

const LoginSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  pin: z.string().trim().min(4, 'PIN must be at least 4 characters').max(64),
  next: z.string().optional(),
});

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    phone: formData.get('phone'),
    pin: formData.get('pin'),
    next: formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const user = await verifyCredentials(parsed.data.phone, parsed.data.pin);
  if (!user) {
    // Generic message — do not reveal whether phone or PIN was wrong.
    return { error: 'Invalid credentials or not authorized for this portal.' };
  }

  await createSession(user);

  // Only allow same-site relative redirects to avoid open-redirect abuse.
  const dest =
    parsed.data.next && parsed.data.next.startsWith('/')
      ? parsed.data.next
      : '/admin/records';
  redirect(dest);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}
