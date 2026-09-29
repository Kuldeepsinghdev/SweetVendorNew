import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { isLocale } from '@/src/lib/locale';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { SahakarLogo } from '@/components/SahakarLogo';
import { CustomerLoginForm } from './CustomerLoginForm';

/**
 * Customer / Mitra login page (Server Component).
 *
 * Establishes the storefront customer session. If already signed in, redirect
 * straight to the requested `next` (same-site only) or the storefront home.
 */
export default async function CustomerLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { next } = await searchParams;
  const safeNext = next && next.startsWith('/') ? next : undefined;

  const existing = await getCustomerSession();
  if (existing) redirect(safeNext ?? `/${locale}`);

  const hi = locale === 'hi';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50/40 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-amber-200 space-y-6">
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
          <Link href={`/${locale}/admin`} className="font-bold text-orange-700 hover:underline">
            {hi ? 'प्रशासनिक लॉगिन →' : 'Admin login →'}
          </Link>
        </div>
      </div>
    </div>
  );
}
