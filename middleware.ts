import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  isNonLocalizedPath,
  getLocaleFromCookieHeader,
  stripLegacyLocale,
} from './src/lib/locale';

const SESSION_COOKIE_NAME = 'sahakar_session';
const CUSTOMER_SESSION_COOKIE_NAME = 'sahakar_customer';

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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.zohocdn.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
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

  // API routes, Next internals, and static assets bypass all locale logic.
  if (isNonLocalizedPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  // ── Legacy locale-prefix redirect ──────────────────────────────────────────
  // Requests to /hi/... or /en/... are redirected to the clean path while
  // setting the lang cookie so the language preference is honoured.
  const legacy = stripLegacyLocale(pathname);
  if (legacy) {
    const target = new URL(legacy.rest, req.url);
    target.search = search;
    const res = NextResponse.redirect(target);
    res.cookies.set(LOCALE_COOKIE_NAME, legacy.locale, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return withSecurityHeaders(res);
  }

  // ── Resolve locale from cookie ─────────────────────────────────────────────
  // The locale is no longer in the URL; it lives in the `lang` cookie.
  // We read it here and forward it as an `x-locale` request header so every
  // Server Component can read `headers().get('x-locale')` without touching the
  // cookie directly (cookies() is not available in all rendering contexts).
  const cookieHeader = req.headers.get('cookie');
  const locale = getLocaleFromCookieHeader(cookieHeader);

  // ── Dashboard auth gate (admin) ──────────────────────────────────────────
  // Coarse JWT verification at the Edge for the protected /dashboard routes.
  // Fine-grained role checks happen server-side in the (dashboard) layout.
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
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
      const loginUrl = new URL('/admin', req.url);
      loginUrl.searchParams.set('next', pathname + search);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // ── Mitra portal routes protection ──────────────────────────────────────────
  // Protected storefront routes require sahakar_customer session (not admin).
  // Redirect unauthenticated users to the login page.
  const protectedMitraRoutes = ['/mitra/portal', '/mitra/catalog', '/mitra/cart', '/mitra/checkout', '/mitra/order-confirmation'];
  if (protectedMitraRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    const token = req.cookies.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
    const secret = getSecret();
    let valid = false;
    if (token && secret) {
      try {
        const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
        // Verify it's a customer/mitra session (not admin)
        if (payload.kind === 'customer' && (payload.role === 'mitra' || payload.role === 'customer')) {
          valid = true;
        }
      } catch {
        valid = false;
      }
    }
    if (!valid) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('next', pathname + search);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // Forward the resolved locale to Server Components via a request header.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-locale', locale);

  // Ensure new visitors always have the default locale cookie set so
  // subsequent requests (e.g. navigations without the header) are consistent.
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (!cookieHeader?.includes(`${LOCALE_COOKIE_NAME}=`)) {
    res.cookies.set(LOCALE_COOKIE_NAME, DEFAULT_LOCALE, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return withSecurityHeaders(res);
}

export const config = {
  // Run on all routes except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
