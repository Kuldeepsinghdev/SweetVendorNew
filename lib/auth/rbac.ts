import 'server-only';
import { redirect } from 'next/navigation';
import { getSession, type AdminRole, type SessionUser } from './session';
import { roleSatisfies } from './role-utils';

// Re-export for backward compatibility
export { roleSatisfies };

/** Thrown by the *OrThrow variants so Server Actions can return a clean error. */
export class AuthorizationError extends Error {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * For pages/layouts: redirect to /admin login if there is no valid session.
 * Deny by default — only a verified session passes.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect('/admin');
  return session;
}

/**
 * For pages/layouts: require at least `required` role, else redirect.
 * Unauthenticated → /admin; authenticated but under-privileged → /admin?denied=1.
 */
export async function requireRole(required: AdminRole): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect('/admin');
  if (!roleSatisfies(session.role, required)) redirect('/admin?denied=1');
  return session;
}

/**
 * For Server Actions / Route Handlers: throw instead of redirect so the caller
 * can return a structured error. Deny by default.
 */
export async function requireRoleOrThrow(required: AdminRole): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthorizationError('Authentication required');
  if (!roleSatisfies(session.role, required)) {
    throw new AuthorizationError('Insufficient role');
  }
  return session;
}
