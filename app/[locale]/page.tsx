import { notFound } from 'next/navigation';
import AppClient from '../AppClient';
import { isLocale } from '@/src/lib/locale';

/**
 * Locale-scoped entry for the client-rendered SPA.
 *
 * `/en` and `/hi` both mount the same application (src/App.tsx via AppClient),
 * with the URL locale driving the app's language. Any other first segment that
 * reached this dynamic route is not a supported locale → 404.
 */
export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <AppClient locale={locale} />;
}
