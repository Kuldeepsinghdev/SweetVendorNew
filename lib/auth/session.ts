import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

/**
 * Server-verified admin roles. `common`/`customer`/`mitra`/`profile` are UI-only
 * states handled client-side; only these elevated roles get a real server session.
 */
export type AdminRole = 'kendra' | 'city_admin' | 'super_admin';

export interface SessionUser {
  sub: string; // stable user id
  role: AdminRole;
  name: string;
  phone: string;
}

const COOKIE_NAME = 'sahakar_session';
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET || '';
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET is missing or too short. Set a strong (>=32 char) SESSION_SECRET in the environment.'
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Issue a signed, httpOnly session cookie. Called from the login Server Action
 * only after credentials are verified server-side.
 */
export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    role: user.role,
    name: user.name,
    phone: user.phone,
  } satisfies JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Do NOT set maxAge - let cookie expire when browser closes
    // JWT exp enforces 8-hour server-side limit
  });
}

/**
 * Read and verify the current session from the cookie. Returns null if there is
 * no valid, unexpired, correctly-signed session. Never trusts unsigned input.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });
    const role = payload.role as AdminRole | undefined;
    if (role !== 'kendra' && role !== 'city_admin' && role !== 'super_admin') {
      return null;
    }
    return {
      sub: String(payload.sub ?? ''),
      role,
      name: String(payload.name ?? ''),
      phone: String(payload.phone ?? ''),
    };
  } catch {
    // Invalid signature, expired, or malformed — treat as unauthenticated.
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
