import { NextResponse } from 'next/server';

/**
 * Shared helpers for the ported data API route handlers.
 *
 * These mirror the response shapes of the legacy Express server (server.ts) so
 * the existing client (AppContext.loadDataFromDb and the mutation helpers) works
 * unchanged against the Next.js route handlers.
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
 * Wrap a route handler body with a uniform try/catch that returns a 500 with the
 * error message, matching the legacy server behaviour.
 */
export async function handle<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const result = await fn();
    return result instanceof NextResponse ? result : NextResponse.json(result);
  } catch (err: any) {
    return fail(err?.message || 'Internal server error', 500);
  }
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
