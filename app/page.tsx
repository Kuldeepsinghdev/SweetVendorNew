import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE } from '@/src/lib/locale';

/**
 * Root route — no explicit locale. The Edge middleware already redirects
 * prefix-less paths to the default locale, so this is a safety net for any
 * request that reaches the root page directly (e.g. if middleware is skipped).
 *
 * The actual SPA is mounted under the locale segment at app/[locale]/page.tsx.
 */
export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}`);
}
