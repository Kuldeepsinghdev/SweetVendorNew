import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireRoleOrThrow, AuthorizationError } from '@/lib/auth/rbac';
import type { AdminRole } from '@/lib/auth/session';

/**
 * Shared helpers for the ported data API route handlers.
 *
 * These mirror the response shapes of the legacy Express server (server.ts) so
 * the existing client (AppContext.loadDataFromDb and the mutation helpers) works
 * unchanged against the Next.js route handlers.
 *
 * SECURITY (migration stopgap): these route handlers were ported from the old
 * public Express CRUD API and were originally unauthenticated. Until each write
 * path is replaced by a Server Action, protected routes must call
 * `requireApiRole(...)` at the top of the handler so the server — never the
 * client — is the trust boundary. Deny by default.
 */

/** Standard JSON success response. */
export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * JSON success response with a shared (CDN) cache policy for read-mostly
 * reference data. On Vercel these headers make the edge network serve cached
 * responses, so a burst of parallel page-load fetches hits Postgres far less.
 *
 *   s-maxage             seconds the CDN may serve a fresh cached response
 *   stale-while-revalidate  seconds the CDN may serve a stale response while it
 *                           refreshes in the background
 *
 * We intentionally do NOT set a browser cache (max-age=0) so mutations made by
 * an admin are reflected quickly for that user, while anonymous catalog traffic
 * is served from the edge. Writes should follow up with revalidation if instant
 * consistency is required.
 */
export function cached(
  data: unknown,
  opts: { sMaxAge?: number; staleWhileRevalidate?: number } = {}
) {
  const sMaxAge = opts.sMaxAge ?? 60;
  const swr = opts.staleWhileRevalidate ?? 300;
  const res = NextResponse.json(data, { status: 200 });
  res.headers.set(
    'Cache-Control',
    `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
  );
  return res;
}

/** Standard JSON error response, matching the Express `{ error }` shape. */
export function fail(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wrap a route handler body with a uniform try/catch. Maps known error types to
 * the correct HTTP status so authorization and validation failures are not
 * masked as generic 500s:
 *   - AuthorizationError → 401 (no session) / 403 (wrong role)
 *   - ZodError           → 400 with the first validation message
 *   - anything else      → 500
 */
export async function handle<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const result = await fn();
    return result instanceof NextResponse ? result : NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      const status = err.message === 'Authentication required' ? 401 : 403;
      return fail(err.message, status);
    }
    if (err instanceof ZodError) {
      return fail(err.issues[0]?.message || 'Invalid input', 400);
    }
    return fail(err?.message || 'Internal server error', 500);
  }
}

/**
 * Route-handler authorization guard (migration stopgap).
 *
 * Call at the top of any protected route handler body, inside `handle(...)`, so
 * a missing/insufficient session is rejected before any DB access. Throws
 * AuthorizationError, which `handle` maps to 401/403. Returns the verified
 * session user for handlers that need the actor identity (e.g. audit logging).
 */
export async function requireApiRole(required: AdminRole) {
  return requireRoleOrThrow(required);
}


/** Normalize a phone number to its last 10 digits. */
export const normPhone = (p?: string | null) => (p || '').replace(/\D/g, '').slice(-10);

/**
 * Normalize an email for storage and comparison: trim + lowercase.
 * Returns null for empty/blank input so the column stays NULL rather than ''.
 */
export const normEmail = (e?: string | null): string | null => {
  const v = (e || '').trim().toLowerCase();
  return v.length > 0 ? v : null;
};

/** Timestamp string in the same locale format the legacy server used. */
export const nowStamp = () =>
  new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
