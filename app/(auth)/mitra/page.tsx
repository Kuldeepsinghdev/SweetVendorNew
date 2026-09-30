import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Store, ArrowRight } from 'lucide-react';
import { getCustomerSession } from '@/lib/auth/customerSession';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getLocale } from '@/lib/locale/server';

/**
 * Mitra portal landing page (Server Component).
 *
 * - Signed in as mitra → redirect to /mitra/portal
 * - Signed in as non-mitra → redirect to /
 * - Not signed in → public page with Apply / Login cards
 */
export default async function MitraLandingPage() {
  const locale = await getLocale();
  const hi = locale === 'hi';

  const session = await getCustomerSession();
  if (session) {
    if (session.role === 'mitra') {
      redirect('/mitra/portal');
    } else {
      redirect('/');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-14 sm:py-20">
        {/* Hero */}
        <div className="text-center mb-10 space-y-3 max-w-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 shadow-lg mb-2">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-amber-900 leading-tight">
            {hi ? 'सहकार मित्र पोर्टल' : 'Sahakar Mitra Portal'}
          </h1>
          <p className="text-base text-amber-800/80 leading-relaxed">
            {hi
              ? 'सहकार मित्र बनें और अपने क्षेत्र में उत्सव मिष्ठान वितरण का हिस्सा बनें।'
              : 'Join the cooperative sweet distribution network as a Sahakar Mitra in your city.'}
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Apply Card */}
          <Link
            href="/mitra/apply"
            className="group flex flex-col items-center text-center gap-4 rounded-3xl border-2 border-amber-300 bg-white p-8 shadow-md hover:shadow-xl hover:border-amber-500 hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-md group-hover:scale-110 transition-transform">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">
                {hi ? 'सहकार मित्र बनें' : 'Apply as Mitra'}
              </h2>
              <p className="text-sm text-slate-500 leading-snug">
                {hi
                  ? 'नया आवेदन दें और हमारे वितरण नेटवर्क से जुड़ें।'
                  : 'Submit a new application and join our distribution network.'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 mt-auto text-sm font-bold text-orange-600 group-hover:text-orange-700">
              {hi ? 'आवेदन करें' : 'Apply Now'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          {/* Login Card */}
          <Link
            href="/login?next=/mitra/portal"
            className="group flex flex-col items-center text-center gap-4 rounded-3xl border-2 border-amber-300 bg-white p-8 shadow-md hover:shadow-xl hover:border-amber-500 hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-900 to-orange-950 shadow-md group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-amber-300" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">
                {hi ? 'मित्र लॉगिन' : 'Mitra Login'}
              </h2>
              <p className="text-sm text-slate-500 leading-snug">
                {hi
                  ? 'पहले से पंजीकृत हैं? अपने खाते में लॉगिन करें।'
                  : 'Already registered? Sign in to your Mitra account.'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 mt-auto text-sm font-bold text-amber-900 group-hover:text-amber-800">
              {hi ? 'लॉगिन करें' : 'Sign In'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>

        {/* Info blurb */}
        <p className="mt-10 text-xs text-amber-700/70 max-w-md text-center leading-relaxed">
          {hi
            ? 'सहकार मित्र बनकर आप अपने शहर में मिठाई की प्री-बुकिंग और वितरण का काम करते हैं। उधार खाता (₹25,000 क्रेडिट) और OTP आधारित डिलीवरी सुविधा उपलब्ध है।'
            : 'As a Sahakar Mitra you manage local sweet pre-booking and distribution. A credit account (₹25,000) and OTP-based delivery system are provided.'}
        </p>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
