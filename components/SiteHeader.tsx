/**
 * Public site header (async Server Component).
 *
 * Reads the active locale itself via getLocale() — no locale prop drilling
 * from pages. The LanguageToggle is a client island that posts to /api/set-locale
 * and calls router.refresh(), keeping the URL unchanged.
 */

import Link from 'next/link';
import { Users, Shield, LogOut, User } from 'lucide-react';
import { SahakarLogo } from './SahakarLogo';
import { LanguageToggle } from './LanguageToggle';
import { customerLogoutAction } from '@/lib/actions/customerAuth';
import { getLocale } from '@/lib/locale/server';

export async function SiteHeader({
  customerName,
  showAdminLink = true,
  isMitra = false,
}: {
  /** Name of the signed-in customer/mitra. Required for authenticated pages. */
  customerName?: string;
  showAdminLink?: boolean;
  isMitra?: boolean;
}) {
  const locale = await getLocale();
  const hi = locale === 'hi';

  return (
    <header className="bg-gradient-to-r from-orange-600 via-orange-700 to-amber-700 text-white border-b-4 border-amber-400 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand — links home. */}
        <Link
          href="/"
          className="flex items-center gap-2 group active:scale-95 transition-transform text-left min-w-0"
          title={hi ? 'सहकार भारती — मुख्य पृष्ठ' : 'Sahakar Bharati — Home'}
        >
          <SahakarLogo className="group-hover:scale-105 transition-transform shrink-0 w-8 h-8 sm:w-10 sm:h-10" />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-tight text-white leading-tight truncate drop-shadow-xs group-hover:text-amber-200 transition-colors">
              {hi ? 'सहकार भारती' : 'Sahakar Bharati'}
            </h1>
            <p className="text-[9px] sm:text-xs text-amber-100/90 font-medium truncate hidden md:block">
              {hi
                ? 'उत्सव मिष्ठान वितरण एवं प्री-बुकिंग सेवा'
                : 'Festive Sweets Pre-booking Network'}
            </p>
          </div>
        </Link>

        {/* Portals + language switch. */}
        <nav className="flex items-center gap-1 sm:gap-2 shrink-0 justify-end ml-auto" aria-label={hi ? 'मुख्य नेविगेशन' : 'Main navigation'}>
          <Link
            href="/mitra"
            className="hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition-all shadow-xs bg-amber-950/80 hover:bg-orange-900/90 text-amber-100 hover:text-white border border-amber-400/60"
            title={hi ? 'सहकार मित्र पोर्टल' : 'Sahakar Mitra Portal'}
          >
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>{hi ? 'सहकार मित्र' : 'Mitra'}</span>
          </Link>

          {showAdminLink && !isMitra && (
            <Link
              href="/admin"
              className="hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition-all shadow-xs bg-amber-950/80 hover:bg-orange-900/90 text-amber-100 hover:text-white border border-amber-400/60"
              title={hi ? 'प्रशासनिक पोर्टल' : 'Admin Portal'}
            >
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              <span>{hi ? 'प्रशासन' : 'Admin'}</span>
            </Link>
          )}

          {/* Show user info and logout if authenticated */}
          {customerName && (
            <>
              <span
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 border border-amber-200"
                title={customerName}
              >
                <User className="w-3.5 h-3.5" />
                <span className="truncate max-w-[80px]">{customerName}</span>
              </span>
              {/* Logout is a form posting to a Server Action — no client JS needed. */}
              <form action={customerLogoutAction}>
                <button
                  type="submit"
                  className="p-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-200 hover:text-white rounded-xl border border-rose-500/50 text-xs transition-colors cursor-pointer"
                  title={hi ? 'लॉगआउट करें' : 'Logout'}
                  aria-label={hi ? 'लॉगआउट करें' : 'Logout'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}

          {/* Language toggle — client island, reads locale from its own prop
              so the optimistic state doesn't require another server read. */}
          <LanguageToggle locale={locale} />
        </nav>
      </div>
    </header>
  );
}
