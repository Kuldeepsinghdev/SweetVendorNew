/**
 * Single source of truth for locale / language handling.
 *
 * The app supports two languages — Hindi (`hi`, default) and English (`en`).
 * Locale is no longer encoded in the URL; it is stored in a cookie (`lang`)
 * and forwarded as an `x-locale` request header by the Edge middleware so
 * Server Components, layouts, and actions can read it without touching the URL.
 *
 * This module is intentionally dependency-free so it can be imported from the
 * Edge middleware, Server Components, and Client Components alike.
 */

export const LOCALES = ['en', 'hi'] as const;

export type Locale = (typeof LOCALES)[number];

/** Default locale when the user has no saved preference. */
export const DEFAULT_LOCALE: Locale = 'hi';

/** Cookie name that stores the user's language preference. */
export const LOCALE_COOKIE_NAME = 'lang';

/**
 * Path prefixes that must NEVER be intercepted by locale logic.
 * These are API handlers, Next internals, and static assets.
 */
const NON_LOCALIZED_PREFIXES = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/images',
  '/assets',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
];

/** Narrow an arbitrary value to a supported `Locale`. */
export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' &&
    (LOCALES as readonly string[]).includes(value)
  );
}

/**
 * True when the pathname belongs to a route that should not be touched by
 * locale logic (API, Next internals, static assets).
 */
export function isNonLocalizedPath(pathname: string): boolean {
  return NON_LOCALIZED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Parse the locale from a raw `Cookie` header string (e.g. the value of
 * `req.headers.get('cookie')`).  Returns the stored locale if it is a valid
 * supported locale, otherwise returns the default locale.
 *
 * This is safe to call from the Edge runtime (no Node.js APIs used).
 *
 * @example
 * getLocaleFromCookieHeader('lang=en; other=x')   // 'en'
 * getLocaleFromCookieHeader('lang=hi; other=x')   // 'hi'
 * getLocaleFromCookieHeader('lang=xx')             // 'hi'  (invalid → default)
 * getLocaleFromCookieHeader(null)                  // 'hi'  (no cookie)
 */
export function getLocaleFromCookieHeader(
  cookieHeader: string | null | undefined
): Locale {
  if (!cookieHeader) return DEFAULT_LOCALE;

  for (const pair of cookieHeader.split(';')) {
    const [rawKey, ...rest] = pair.split('=');
    const key = rawKey?.trim();
    const value = rest.join('=').trim();
    if (key === LOCALE_COOKIE_NAME) {
      return isLocale(value) ? value : DEFAULT_LOCALE;
    }
  }
  return DEFAULT_LOCALE;
}

/**
 * If `pathname` starts with a legacy locale prefix (`/hi/…` or `/en/…`),
 * return the locale and the stripped path.  Returns `null` if no legacy prefix
 * is present.
 *
 * Used by the middleware to handle backward-compat redirects so that old
 * bookmarks like `/hi/products` transparently redirect to `/products` (with
 * the language cookie set).
 *
 * @example
 * stripLegacyLocale('/hi/products')   // { locale: 'hi', rest: '/products' }
 * stripLegacyLocale('/en')            // { locale: 'en', rest: '/' }
 * stripLegacyLocale('/products')      // null
 */
export function stripLegacyLocale(
  pathname: string
): { locale: Locale; rest: string } | null {
  const segments = pathname.split('/');
  // segments[0] is '' for an absolute path; segments[1] is the first segment.
  const first = segments[1];
  if (!isLocale(first)) return null;

  const rest =
    '/' + segments.slice(2).join('/');
  // Normalise: collapse trailing slash, ensure leading slash.
  const cleanRest =
    rest === '/' ? '/' : rest.replace(/\/+$/, '') || '/';
  return { locale: first, rest: cleanRest };
}
