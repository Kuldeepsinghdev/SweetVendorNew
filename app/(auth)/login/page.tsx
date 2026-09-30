import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { SahakarLogo } from '@/components/SahakarLogo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { CustomerLoginForm } from './CustomerLoginForm';
import { getLocale } from '@/lib/locale/server';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50/40 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-amber-200 space-y-6">
        {/* Language toggle in top-right corner */}
        <div className="flex justify-end">
          <LanguageToggle locale={locale} />
        </div>

        <div className="flex flex-col items-center text-center gap-2">
          <SahakarLogo size="lg" />
          <h1 className="text-xl font-black text-slate-900">
            {hi ? 'सहकार भारती — लॉगिन' : 'Sahakar Bharati — Sign In'}
          </h1>
          <p className="text-xs text-slate-500">
            {hi
              ? 'ग्राहक एवं सहकार मित्र लॉगिन। प्रशासनिक उपयोगकर्ता कृपया एडमिन पोर्टल का उपयोग करें।'
              : 'Customer & Sahakar Mitra sign-in. Admin users please use the admin portal.'}
          </p>
        </div>

        <CustomerLoginForm next={safeNext} locale={locale} />

        <div className="text-center text-xs text-slate-500">
          <Link href="/admin" className="font-bold text-orange-700 hover:underline">
            {hi ? 'प्रशासनिक लॉगिन →' : 'Admin login →'}
          </Link>
        </div>
      </div>
    </div>
  );
}
