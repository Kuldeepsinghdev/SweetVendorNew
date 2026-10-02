import Link from 'next/link';
import { Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { LanguageToggle } from '@/components/LanguageToggle';
import { CustomerLoginForm } from './CustomerLoginForm';
import { getLocale } from '@/lib/locale/server';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

/**
 * Customer / Mitra login page (Server Component).
 *
 * If already signed in, redirects to `next` (same-site) or home.
 * Locale is resolved from the `x-locale` header (set by middleware from cookie).
 */
export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const locale = await getLocale();
  const hi = locale === 'hi';

  const { next } = await searchParams;
  const safeNext = next && next.startsWith('/') ? next : undefined;

  const existing = await getCustomerSession();
  if (existing) redirect(safeNext ?? '/');

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden">
          <div className="bg-amber-50 p-6 border-b border-amber-100 flex justify-between items-start">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-amber-100 text-amber-700 border-amber-300">
                <Users className="w-3.5 h-3.5" />
                <span>{hi ? 'सहकार मित्र लॉगिन' : 'Sahakar Mitra Login'}</span>
              </div>
              <h1 className="mt-3 text-xl font-black text-slate-900">
                {hi ? 'मित्र पोर्टल लॉगिन' : 'Mitra Portal Login'}
              </h1>
              <p className="text-xs text-amber-600/90 mt-0.5">
                {hi ? 'सहकार भारती मित्र एवं ग्राहक' : 'Sahakar Bharati Mitra & Customers'}
              </p>
            </div>
            <LanguageToggle locale={locale} />
          </div>

          <div className="p-6 space-y-4">
            <CustomerLoginForm next={safeNext} locale={locale} />

            <div className="text-center text-xs">
              <Link href="/admin" className="font-bold text-amber-600 hover:text-amber-700 hover:underline">
                {hi ? 'प्रशासनिक लॉगिन →' : 'Admin login →'}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
