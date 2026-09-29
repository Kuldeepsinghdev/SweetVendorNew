import 'server-only';
import { redirect } from 'next/navigation';
import {
  getCustomerSession,
  type CustomerRole,
  type CustomerSessionUser,
} from './customerSession';
import { AuthorizationError } from './rbac';

/**
 * Guards for the customer/mitra storefront session.
 *
 * These mirror the admin RBAC helpers (lib/auth/rbac.ts) but operate on the
 * separate customer session and never grant admin privilege. Deny by default.
 */

/**
 * For pages/layouts: require any signed-in customer/mitra, else redirect to
 * the storefront login page.
 */
export async function requireCustomer(): Promise<CustomerSessionUser> {
  const session = await getCustomerSession();
  if (!session) redirect('/login');
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
  if (!session) redirect('/login');
  if (required === 'mitra' && session.role !== 'mitra') redirect('/');
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
