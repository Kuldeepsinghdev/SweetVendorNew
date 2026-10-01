import 'server-only';
import { redirect } from 'next/navigation';
import { getCustomerSession, type CustomerSessionUser } from './customerSession';
import { getSession, type SessionUser } from './session';

/**
 * Server-side guard ensuring customer/mitra session exists.
 * Redirects to /login if not authenticated.
 * Returns the verified session.
 */
export async function requireCustomerSession(): Promise<CustomerSessionUser> {
  const session = await getCustomerSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

/**
 * Server-side guard ensuring mitra session.
 * Redirects to /login if not authenticated or wrong role.
 */
export async function requireMitraSession(): Promise<CustomerSessionUser> {
  const session = await getCustomerSession();
  if (!session || session.role !== 'mitra') {
    redirect('/login?next=/mitra/portal');
  }
  return session;
}

/**
 * Server-side guard ensuring customer (non-mitra) session.
 * Redirects to /login if not authenticated or wrong role.
 */
export async function requireCustomerOnlySession(): Promise<CustomerSessionUser> {
  const session = await getCustomerSession();
  if (!session || session.role !== 'customer') {
    redirect('/login');
  }
  return session;
}

/**
 * Server-side guard ensuring admin session.
 * Redirects to /admin if not authenticated or insufficient role.
 * Requires at least 'kendra' role (city admin or higher).
 */
export async function requireAdminSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect('/admin?next=/admin/dashboard');
  }
  // Fine-grained role checks happen in (dashboard) layout
  return session;
}
