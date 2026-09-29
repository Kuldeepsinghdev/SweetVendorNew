import 'server-only';
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/src/lib/locale';

/**
 * Server-only helper: resolve the active locale for the current request.
 *
 * The Edge middleware reads the `lang` cookie and forwards it as the
 * `x-locale` request header on every page request.  This function reads that
 * header, making the locale available to any async Server Component or Server
 * Action without any props being passed down.
 *
 * Falls back to `DEFAULT_LOCALE` ('hi') when:
 *  - the header is absent (e.g. direct RSC fetch without middleware)
 *  - the header value is not a recognised locale
 *
 * Usage:
 *   const locale = await getLocale();   // 'hi' | 'en'
 *   const hi = locale === 'hi';
 */
export async function getLocale(): Promise<Locale> {
  try {
    const h = await headers();
    const loc = h.get('x-locale');
    return isLocale(loc) ? loc : DEFAULT_LOCALE;
  } catch {
    // headers() throws outside of a request context (e.g. during static
    // generation). Return the default so pages degrade gracefully.
    return DEFAULT_LOCALE;
  }
}
