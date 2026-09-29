import 'server-only';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession, type AdminRole, type SessionUser } from './session';
import { DEFAULT_LOCALE, isLocale } from '@/src/lib/locale';

/**
 * Resolve the active locale from the `x-locale` request header set by the Edge
 * middleware, falling back to the default locale. Used to keep RBAC redirects
 * on the same locale the user is browsing.
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
 * Role hierarchy: a higher-privileged role satisfies checks for lower ones.
 * super_admin ⊇ city_admin ⊇ kendra
 */
const ROLE_RANK: Record<AdminRole, number> = {
  kendra: 1,
  city_admin: 2,
  super_admin: 3,
};

export function roleSatisfies(actual: AdminRole, required: AdminRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

/** Thrown by the *OrThrow variants so Server Actions can return a clean error. */
export class AuthorizationError extends Error {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * For pages/layouts: redirect to the /admin login if there is no valid session.
 * Deny by default — only a verified session passes.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect(`/${await currentLocale()}/admin`);
  return session;
}

/**
 * For pages/layouts: require at least `required` role, else redirect.
 * Unauthenticated → /admin; authenticated but under-privileged → /admin?denied=1.
 */
export async function requireRole(required: AdminRole): Promise<SessionUser> {
  const session = await getSession();
  const loc = await currentLocale();
  if (!session) redirect(`/${loc}/admin`);
  if (!roleSatisfies(session.role, required)) redirect(`/${loc}/admin?denied=1`);
  return session;
}

/**
 * For Server Actions / Route Handlers: throw instead of redirect, so the caller
 * can return a structured error. Deny by default.
 */
export async function requireRoleOrThrow(
  required: AdminRole
): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthorizationError('Authentication required');
  if (!roleSatisfies(session.role, required)) {
    throw new AuthorizationError('Insufficient role');
  }
  return session;
}
