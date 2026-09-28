import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/src/db';
import { users, saleCenters } from '@/src/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Client-side login API for customer/mitra roles.
 * 
 * This endpoint is used by the LoginModal component for customer and mitra login.
 * Admin roles (kendra, city_admin, super_admin) must use the server-side login at /admin.
 * 
 * POST /api/auth/login
 * Body (phone login):  { phone: string, pin: string }
 * Body (email login):  { email: string, password: string }
 * Body (generic):      { identifier: string, secret: string }  // identifier = email or phone
 * Returns: { success: boolean, user?: { id, name, phone, email, role, cityId, centerId }, error?: string }
 *
 * Backward compatible: the original { phone, pin } contract still works.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept several field shapes:
    //  - phone + pin        (existing phone/SMS-PIN login)
    //  - email + password   (new email/password login)
    //  - identifier + secret (generic: identifier may be email or phone)
    const rawIdentifier: string =
      body.identifier ?? body.email ?? body.phone ?? '';
    const secret: string =
      body.secret ?? body.password ?? body.pin ?? '';

    const identifier = String(rawIdentifier).trim();

    // Validate presence
    if (!identifier || !secret) {
      return NextResponse.json(
        { success: false, error: 'Login credentials are required' },
        { status: 400 }
      );
    }

    // Decide lookup mode: anything containing "@" is treated as an email.
    const isEmail = identifier.includes('@');

    let user;
    if (isEmail) {
      // Normalize email for a case-insensitive, trim-insensitive match.
      const normalizedEmail = identifier.toLowerCase();
      const rows = await db
        .select()
        .from(users)
        .where(eq(sql`lower(${users.email})`, normalizedEmail))
        .limit(1);
      user = rows[0];
    } else {
      // Normalize phone to 10 digits
      const normalizedPhone = identifier.replace(/\D/g, '').slice(-10);
      if (normalizedPhone.length !== 10) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number' },
          { status: 400 }
        );
      }
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.phone, normalizedPhone))
        .limit(1);
      user = rows[0];
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.isActive === false) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 403 }
      );
    }

    // Verify credential hash. The same bcrypt-hashed `pinHash` column backs
    // both the phone SMS-PIN and the email password.
    if (!user.pinHash) {
      // First-time phone login: allow setting a 4-digit PIN on first use.
      // Email/password accounts must be provisioned with a credential first.
      if (!isEmail && secret.length === 4 && /^\d{4}$/.test(secret)) {
        const pinHash = await bcrypt.hash(secret, 10);
        await db
          .update(users)
          .set({ pinHash, updatedAt: new Date().toISOString() })
          .where(eq(users.id, user.id));
      } else {
        return NextResponse.json(
          {
            success: false,
            error: isEmail
              ? 'No password set for this account. Please contact your administrator.'
              : 'Please set a 4-digit PIN',
          },
          { status: 400 }
        );
      }
    } else {
      // Verify existing credential (PIN or password).
      const ok = await bcrypt.compare(secret, user.pinHash);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // For kendra owners, resolve their assigned sale center so the client can
    // scope the KendraFlowView to their own center.
    let centerId: string | null = null;
    if (user.role === 'kendra') {
      const centerRows = await db
        .select()
        .from(saleCenters)
        .where(eq(saleCenters.ownerUserId, user.id))
        .limit(1);
      centerId = centerRows[0]?.id ?? null;
    }

    // Return user info (without sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email ?? null,
        role: user.role,
        cityId: user.cityId,
        centerId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
