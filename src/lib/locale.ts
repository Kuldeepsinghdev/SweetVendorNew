/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Single source of truth for URL-based locale routing.
 *
 * The app supports two languages, English (`en`) and Hindi (`hi`), and the
 * active locale is represented explicitly as the first path segment
 * (`/en/...`, `/hi/...`) so both humans and automated agents can determine the
 * rendering language from the URL alone.
 *
 * This module is intentionally dependency-free so it can be imported from the
 * Edge middleware, server components, and client components alike.
 */

export const LOCALES = ['en', 'hi'] as const;

export type Locale = (typeof LOCALES)[number];

/** Default locale used when the URL carries no explicit locale prefix. */
export const DEFAULT_LOCALE: Locale = 'hi';

/**
 * Path prefixes that must NEVER be treated as, or rewritten to, locale routes.
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
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * True when the pathname belongs to a route that should not be localized
 * (API, Next internals, static assets). Callers use this to skip the locale
 * redirect entirely.
 */
export function isNonLocalizedPath(pathname: string): boolean {
  return NON_LOCALIZED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Split a pathname into its leading locale (if any) and the remainder.
 *
 * @example
 * stripLocale('/en')            // { locale: 'en', rest: '/' }
 * stripLocale('/hi/dashboard')  // { locale: 'hi', rest: '/dashboard' }
 * stripLocale('/dashboard')     // { locale: null, rest: '/dashboard' }
 * stripLocale('/')              // { locale: null, rest: '/' }
 */
export function stripLocale(pathname: string): { locale: Locale | null; rest: string } {
  const segments = pathname.split('/');
  // segments[0] is '' for an absolute path; segments[1] is the first segment.
  const first = segments[1];
  if (isLocale(first)) {
    const rest = '/' + segments.slice(2).join('/');
    // Collapse '//' -> '/' and ensure a leading slash.
    return { locale: first, rest: rest === '/' ? '/' : rest.replace(/\/+$/, '') || '/' };
  }
  return { locale: null, rest: pathname || '/' };
}

/**
 * Build a locale-prefixed URL path, preserving an optional query string and
 * hash. `rest` is the non-locale portion of the path (e.g. `/dashboard`); a
 * bare `/` yields just the locale root (`/en`).
 *
 * @example
 * withLocale('en', '/dashboard')                 // '/en/dashboard'
 * withLocale('hi', '/')                           // '/hi'
 * withLocale('en', '/admin', '?next=/x', '#top')  // '/en/admin?next=/x#top'
 */
export function withLocale(
  locale: Locale,
  rest: string,
  search = '',
  hash = ''
): string {
  const cleanRest = rest && rest !== '/' ? `/${rest.replace(/^\/+/, '').replace(/\/+$/, '')}` : '';
  const normalizedSearch = search && !search.startsWith('?') ? `?${search}` : search;
  const normalizedHash = hash && !hash.startsWith('#') ? `#${hash}` : hash;
  return `/${locale}${cleanRest}${normalizedSearch}${normalizedHash}`;
}

/**
 * Replace (or add) the locale prefix on an existing pathname, keeping the rest
 * of the path intact. Used by the language switcher to flip `/hi/x` <-> `/en/x`.
 */
export function switchLocaleInPath(pathname: string, target: Locale): string {
  const { rest } = stripLocale(pathname);
  return withLocale(target, rest);
}
