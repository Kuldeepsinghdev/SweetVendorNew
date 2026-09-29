import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import {
  DEFAULT_LOCALE,
  isNonLocalizedPath,
  stripLocale,
  withLocale,
} from './src/lib/locale';

const SESSION_COOKIE_NAME = 'sahakar_session';

function getSecret(): Uint8Array | null {
  const secret =
    process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET || '';
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

/**
 * Apply security headers to every response. CSP is intentionally strict; the
 * Zoho payments SDK + Supabase storage/fonts hosts are allowlisted explicitly.
 */
function withSecurityHeaders(res: NextResponse): NextResponse {
  const csp = [
    "default-src 'self'",
    // Next.js needs inline/eval in dev; Zoho SDK is loaded from its CDN.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.zohocdn.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    // Catalog/sweet images may come from arbitrary external HTTPS hosts (and are
    // additionally proxied same-origin via /api/image-proxy on failure). Images
    // cannot execute code, so allowing any HTTPS image source is a safe, standard
    // relaxation that unblocks legitimate product imagery.
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co https://payments.zoho.in https://payments.zoho.com",
    "frame-src https://static.zohocdn.com https://payments.zoho.in https://payments.zoho.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // API routes, Next internals, and static assets are never localized and are
  // passed straight through (with security headers) — no locale redirect.
  if (isNonLocalizedPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const { locale, rest } = stripLocale(pathname);

  // No explicit locale in the URL → redirect to the default-locale equivalent,
  // preserving the rest of the path and any query string (3=a). An explicit
  // locale is authoritative and is never redirected away (A=a).
  if (!locale) {
    const target = new URL(withLocale(DEFAULT_LOCALE, rest), req.url);
    target.search = search;
    return withSecurityHeaders(NextResponse.redirect(target));
  }

  // Coarse gate for the protected dashboard routes: verify a valid signed
  // session exists at the edge. Fine-grained role checks happen server-side in
  // the (dashboard) layout. The login page lives at the locale-scoped /admin
  // route, and the auth redirect preserves the active locale.
  if (rest === '/dashboard' || rest.startsWith('/dashboard/')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const secret = getSecret();
    let valid = false;
    if (token && secret) {
      try {
        await jwtVerify(token, secret, { algorithms: ['HS256'] });
        valid = true;
      } catch {
        valid = false;
      }
    }
    if (!valid) {
      const loginUrl = new URL(withLocale(locale, '/admin'), req.url);
      // `next` carries the full locale-prefixed path so post-login returns here.
      loginUrl.searchParams.set('next', pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // Forward the resolved locale to server components / actions via a request
  // header so RBAC redirects and revalidation can stay locale-aware.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-locale', locale);
  return withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } })
  );
}

export const config = {
  // Run on all routes except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
