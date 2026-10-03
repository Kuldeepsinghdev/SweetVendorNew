import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

/**
 * Customer / Mitra session — separate from the admin RBAC session.
 *
 * Rationale (migration Task 6): the public storefront needs a lightweight,
 * server-verified identity for customers and Sahakar Mitra so bookings can be
 * attributed and authorized server-side, WITHOUT granting any admin privilege.
 * It is deliberately a DIFFERENT cookie and a DIFFERENT payload shape from the
 * admin session (lib/auth/session.ts):
 *   - distinct cookie name (`sahakar_customer` vs `sahakar_session`)
 *   - a `kind: 'customer'` claim, verified on read, so an admin token can never
 *     be replayed as a customer token or vice-versa
 * The admin session and its middleware gate are untouched.
 *
 * Like the admin session, this is a signed httpOnly cookie verified on every
 * request. No role/identity is ever stored in localStorage.
 */

/** Non-admin roles that use the customer session. */
export type CustomerRole = 'customer' | 'mitra';

export interface CustomerSessionUser {
  sub: string; // stable users.id
  role: CustomerRole;
  name: string;
  phone: string;
  /** Present for mitra: their assigned sale-centre, used to scope the flow. */
  centerId?: string | null;
  cityId?: string | null;
  distributionCenterId?: string | null;
}

const COOKIE_NAME = 'sahakar_customer';
const KIND = 'customer';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days — storefront convenience

function getSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    'sahakar_bharati_dev_session_secret_key_minimum_32_chars';
  return new TextEncoder().encode(secret);
}

/**
 * Issue the customer session cookie. Called only after credentials are verified
 * server-side (see lib/actions/customerAuth.ts).
 */
export async function createCustomerSession(user: CustomerSessionUser): Promise<void> {
  const token = await new SignJWT({
    kind: KIND,
    role: user.role,
    name: user.name,
    phone: user.phone,
    centerId: user.centerId ?? null,
    cityId: user.cityId ?? null,
    distributionCenterId: user.distributionCenterId ?? null,
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
    maxAge: MAX_AGE_SECONDS,
  });
}

/**
 * Read and verify the current customer session. Returns null unless the cookie
 * carries a valid, unexpired, correctly-signed token with `kind === 'customer'`
 * and a recognized non-admin role. Never trusts unsigned input.
 */
export async function getCustomerSession(): Promise<CustomerSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (payload.kind !== KIND) return null;
    const role = payload.role as CustomerRole | undefined;
    if (role !== 'customer' && role !== 'mitra') return null;
    return {
      sub: String(payload.sub ?? ''),
      role,
      name: String(payload.name ?? ''),
      phone: String(payload.phone ?? ''),
      centerId: (payload.centerId as string | null) ?? null,
      cityId: (payload.cityId as string | null) ?? null,
      distributionCenterId: (payload.distributionCenterId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function destroyCustomerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export const CUSTOMER_SESSION_COOKIE_NAME = COOKIE_NAME;
