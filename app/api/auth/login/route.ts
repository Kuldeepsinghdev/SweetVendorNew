import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/src/db';
import { users, saleCenters } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Client-side login API for customer/mitra roles.
 * 
 * This endpoint is used by the LoginModal component for customer and mitra login.
 * Admin roles (kendra, city_admin, super_admin) must use the server-side login at /login.
 * 
 * POST /api/auth/login
 * Body: { phone: string, pin: string }
 * Returns: { success: boolean, user?: { id, name, phone, role }, token?: string, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, pin } = body;

    // Validate input
    if (!phone || !pin) {
      return NextResponse.json(
        { success: false, error: 'Phone and PIN are required' },
        { status: 400 }
      );
    }

    // Normalize phone to 10 digits
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    if (normalizedPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Query the users table
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.phone, normalizedPhone))
      .limit(1);

    const user = rows[0];
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

    // Verify PIN hash
    if (!user.pinHash) {
      // For customer/mitra without PIN, allow first-time login with any 4-digit PIN
      // This sets their PIN on first use
      if (pin.length === 4 && /^\d{4}$/.test(pin)) {
        const pinHash = await bcrypt.hash(pin, 10);
        await db
          .update(users)
          .set({ pinHash, updatedAt: new Date().toISOString() })
          .where(eq(users.id, user.id));
      } else {
        return NextResponse.json(
          { success: false, error: 'Please set a 4-digit PIN' },
          { status: 400 }
        );
      }
    } else {
      // Verify existing PIN
      const ok = await bcrypt.compare(pin, user.pinHash);
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
