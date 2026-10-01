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

// Legacy admin routes being monitored for deprecation
const LEGACY_ADMIN_ROUTES = ['/dashboard', '/super-admin', '/city-admin', '/kendra'];

/**
 * Feature flag: ENABLE_AUTH_FIRST
 * - true (default): Auth-first mode — all routes require authentication
 * - false: Public-first mode — home and catalog accessible without login (legacy behavior)
 * 
 * Set in .env:
 *   ENABLE_AUTH_FIRST=true    # Auth-first (new, default)
 *   ENABLE_AUTH_FIRST=false   # Public-first (legacy, rollback mode)
 */
const AUTH_FIRST_ENABLED = process.env.ENABLE_AUTH_FIRST !== 'false';

/**
 * Routes that do not require authentication.
 * Includes:
 * - Auth endpoints (login, logout, password reset)
 * - Admin login
 * - Mitra signup
 * - Payment webhooks (external services)
 * - Next.js internals and static assets (handled by isNonLocalizedPath)
 * - API routes that handle auth themselves
 */
const PUBLIC_PATHS = [
  // Auth routes (customer/mitra)
  '/login',
  '/reset-password',
  
  // Admin login
  '/admin',
  
  // Mitra public signup
  '/mitra/apply',
  
  // Public mitra landing
  '/mitra',
  
  // Auth API endpoints (handle their own auth)
  '/api/auth/request-password-reset',
  '/api/auth/send-set-password',
  '/api/auth/reset-password',
  '/api/auth/login',
  
  // External webhooks (no auth)
  '/api/zoho-payments/webhook',
  '/api/reset-data', // Dev endpoint
  '/api/seed',       // Dev endpoint
];

function isPublicPath(pathname: string): boolean {
  // Exact match first
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }
  
  // Pattern matches
  if (pathname.startsWith('/api/')) {
    // All other API routes default to public; they verify auth internally
    return true;
  }
  
  return false;
}

function getSecret(): Uint8Array | null {
  const secret =
    process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET || '';
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

/**
 * Verify admin JWT token from request without full decoding.
 * Returns true if valid, false otherwise.
 * Only checks signature and expiration, not role (fine-grained RBAC happens server-side).
 */
async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = getSecret();
  
  if (!token || !secret) return false;
  
  try {
    await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify customer JWT token from request without full decoding.
 * Returns true if valid and marked as 'customer' kind, false otherwise.
 */
async function verifyCustomerToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  const secret = getSecret();
  
  if (!token || !secret) return false;
  
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    // Verify this is marked as a customer token, not admin
    return payload.kind === 'customer';
  } catch {
    return false;
  }
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

  // ── Handle legacy admin route redirects with monitoring ─────────────────────
  // Redirect /dashboard, /super-admin, /city-admin, /kendra → /admin/dashboard
  // Log the redirect for monitoring and analytics
  if (LEGACY_ADMIN_ROUTES.includes(pathname)) {
    // Log legacy route access (useful for monitoring deprecation)
    // In production, this could send to analytics or logging service
    if (process.env.NODE_ENV === 'development') {
      console.log(`[LEGACY_ROUTE] ${pathname} → /admin/dashboard`);
    }
    
    // Create redirect to unified dashboard, preserving query params
    const redirectUrl = new URL('/admin/dashboard', req.url);
    redirectUrl.search = search;
    
    // 308 Permanent Redirect (method-preserving, cacheable by browsers)
    const res = NextResponse.redirect(redirectUrl, { status: 308 });
    
    // Optional: Add a header to track this was a legacy route redirect
    // This can be useful for server-side analytics or monitoring
    res.headers.set('x-legacy-redirect', pathname);
    
    return withSecurityHeaders(res);
  }

  // Public paths (auth routes, webhooks, etc) bypass auth check but keep locale
  if (isPublicPath(pathname)) {
    // Still apply locale logic for public pages like login
    const cookieHeader = req.headers.get('cookie');
    const locale = getLocaleFromCookieHeader(cookieHeader);
    
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-locale', locale);
    
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

  // ── Legacy locale-prefix redirect ──────────────────────────────────────────
  const legacy = stripLegacyLocale(pathname);
  if (legacy) {
    const target = new URL(legacy.rest, req.url);
    target.search = search;
    const res = NextResponse.redirect(target);
    res.cookies.set(LOCALE_COOKIE_NAME, legacy.locale, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
    return withSecurityHeaders(res);
  }

  // ── Resolve locale from cookie ─────────────────────────────────────────────
  const cookieHeader = req.headers.get('cookie');
  const locale = getLocaleFromCookieHeader(cookieHeader);

  // ── Authentication check for protected routes ──────────────────────────────
  // If AUTH_FIRST_ENABLED is false, skip auth check (public-first/rollback mode)
  if (AUTH_FIRST_ENABLED) {
    // Auth-first mode: verify session or redirect to login
    const adminValid = await verifyAdminToken(req);
    const customerValid = await verifyCustomerToken(req);
    
    if (!adminValid && !customerValid) {
      // Determine appropriate redirect based on route
      let loginUrl: URL;
      
      if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
        // Admin routes: redirect to admin login
        loginUrl = new URL('/admin', req.url);
      } else {
        // Customer/Mitra routes: redirect to Mitra landing (primary page for unauthenticated users)
        loginUrl = new URL('/mitra', req.url);
      }
      
      // Preserve the intended destination for post-login redirect
      loginUrl.searchParams.set('next', pathname + search);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }
  // If AUTH_FIRST_ENABLED is false, skip authentication and continue (public-first mode)

  // Forward locale and continue
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-locale', locale);

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
