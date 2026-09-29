import 'server-only';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  getCustomerSession,
  type CustomerRole,
  type CustomerSessionUser,
} from './customerSession';
import { AuthorizationError } from './rbac';
import { DEFAULT_LOCALE, isLocale } from '@/src/lib/locale';

/**
 * Guards for the customer/mitra storefront session (Task 6).
 *
 * These mirror the admin RBAC helpers (lib/auth/rbac.ts) but operate on the
 * separate customer session and never grant admin privilege. Deny by default.
 */

async function currentLocale(): Promise<string> {
  try {
    const h = await headers();
    const loc = h.get('x-locale');
    return isLocale(loc) ? loc : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/**
 * For pages/layouts: require any signed-in customer/mitra, else redirect to the
 * storefront login for the active locale.
 */
export async function requireCustomer(): Promise<CustomerSessionUser> {
  const session = await getCustomerSession();
  if (!session) redirect(`/${await currentLocale()}/login`);
  return session;
}

/**
 * For pages/layouts: require a specific customer role (e.g. 'mitra'). Redirects
 * unauthenticated users to login and wrong-role users to the storefront home.
 */
export async function requireCustomerRole(
  required: CustomerRole
): Promise<CustomerSessionUser> {
  const session = await getCustomerSession();
  const loc = await currentLocale();
  if (!session) redirect(`/${loc}/login`);
  if (required === 'mitra' && session.role !== 'mitra') redirect(`/${loc}`);
  return session;
}

/**
 * For Server Actions / Route Handlers: throw instead of redirect so the caller
 * can return a structured error. Deny by default.
 */
export async function requireCustomerOrThrow(): Promise<CustomerSessionUser> {
  const session = await getCustomerSession();
  if (!session) throw new AuthorizationError('Authentication required');
  return session;
}

export async function requireCustomerRoleOrThrow(
  required: CustomerRole
): Promise<CustomerSessionUser> {
  const session = await getCustomerSession();
  if (!session) throw new AuthorizationError('Authentication required');
  if (required === 'mitra' && session.role !== 'mitra') {
    throw new AuthorizationError('Insufficient role');
  }
  return session;
}
