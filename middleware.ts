import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

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
    "img-src 'self' data: https://*.supabase.co",
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
  const { pathname } = req.nextUrl;

  // Coarse gate for admin routes: verify a valid signed session exists at the
  // edge. Fine-grained role checks happen server-side in the (admin) layout.
  if (pathname.startsWith('/admin')) {
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
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  // Run on all routes except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
