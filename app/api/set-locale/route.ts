import { NextResponse } from 'next/server';
import {
  isLocale,
  LOCALE_COOKIE_NAME,
  DEFAULT_LOCALE,
  type Locale,
} from '@/src/lib/locale';

/**
 * POST /api/set-locale
 *
 * Sets the user's language preference cookie and redirects back to the
 * requested path — without changing the URL in any meaningful way (the
 * redirect simply goes back to wherever the user was).
 *
 * Body (JSON):
 *   { locale: 'hi' | 'en', returnTo: string }
 *
 * The `returnTo` value is validated as a same-site relative path to prevent
 * open-redirect attacks.
 *
 * Response:
 *   302 redirect to `returnTo` with Set-Cookie: lang=<locale>
 *
 * This endpoint is intentionally not Edge-only (uses standard Response), but
 * is simple enough to be treated as one. It runs in the Node.js runtime so
 * the rest of the app's server-only imports are never pulled in.
 */
export async function POST(req: Request): Promise<Response> {
  let locale: Locale = DEFAULT_LOCALE;
  let returnTo = '/';

  try {
    const body = await req.json();
    const raw = body?.locale;
    const rawReturn = body?.returnTo;

    // Validate locale — fall back to default rather than 400 for resilience.
    locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

    // Validate returnTo: must be a same-site relative path (starts with /).
    // Reject anything that looks like an absolute URL or protocol-relative URL.
    if (
      typeof rawReturn === 'string' &&
      rawReturn.startsWith('/') &&
      !rawReturn.startsWith('//')
    ) {
      returnTo = rawReturn;
    }
  } catch {
    // Malformed JSON — just redirect to home with the default locale.
  }

  const response = NextResponse.redirect(
    new URL(returnTo, req.url),
    { status: 302 }
  );

  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: '/',
    sameSite: 'lax',
    // Not httpOnly so client-side code can read the current preference if needed,
    // but the authoritative read always happens server-side via middleware.
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365, // 1 year
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
