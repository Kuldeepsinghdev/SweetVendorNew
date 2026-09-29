/**
 * Public site header (Server Component).
 *
 * A lean, server-rendered replacement for the SPA's context-coupled Header.
 * It renders the brand, tagline, and locale-aware navigation to the Mitra and
 * admin portals plus the language switch (a small client island).
 *
 * MIGRATION NOTE (Task 7): the interactive cart, customer login, and profile
 * controls from the old SPA header are intentionally NOT here yet — they depend
 * on the customer session (Task 6) and the ported cart/checkout (Task 7) and
 * will be layered in as client islands then. Keeping the header a Server
 * Component until then means the public shell renders with zero client JS.
 */

import Link from 'next/link';
import { Users, Shield, LogOut, User } from 'lucide-react';
import { SahakarLogo } from './SahakarLogo';
import { LanguageToggle } from './LanguageToggle';
import { customerLogoutAction } from '@/lib/actions/customerAuth';
import type { Locale } from '@/src/lib/locale';

export function SiteHeader({
  locale,
  customerName = null,
}: {
  locale: Locale;
  /** Name of the signed-in customer/mitra, or null when anonymous. */
  customerName?: string | null;
}) {
  const hi = locale === 'hi';

  return (
    <header className="bg-gradient-to-r from-orange-600 via-orange-700 to-amber-700 text-white border-b-4 border-amber-400 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Identity & branding — links home for the active locale. */}
        <Link
          href={`/${locale}`}
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
        <nav className="flex items-center gap-1 sm:gap-2 shrink-0 justify-end ml-auto">
          <Link
            href={`/${locale}/mitra`}
            className="hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition-all shadow-xs bg-amber-950/80 hover:bg-orange-900/90 text-amber-100 hover:text-white border border-amber-400/60"
            title={hi ? 'सहकार मित्र पोर्टल' : 'Sahakar Mitra Portal'}
          >
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>{hi ? 'सहकार मित्र' : 'Mitra'}</span>
          </Link>

          <Link
            href={`/${locale}/admin`}
            className="hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition-all shadow-xs bg-amber-950/80 hover:bg-orange-900/90 text-amber-100 hover:text-white border border-amber-400/60"
            title={hi ? 'प्रशासनिक पोर्टल' : 'Admin Portal'}
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>{hi ? 'प्रशासन' : 'Admin'}</span>
          </Link>

          {customerName ? (
            <>
              <span
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 border border-amber-200"
                title={customerName}
              >
                <User className="w-3.5 h-3.5" />
                <span className="truncate max-w-[80px]">{customerName}</span>
              </span>
              {/* Logout is a form posting to a Server Action — no client JS. */}
              <form action={customerLogoutAction}>
                <input type="hidden" name="locale" value={locale} />
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
          ) : (
            <Link
              href={`/${locale}/login`}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-200"
              title={hi ? 'लॉगिन' : 'Sign in'}
            >
              <User className="w-3.5 h-3.5" />
              <span>{hi ? 'लॉगिन' : 'Sign in'}</span>
            </Link>
          )}

          <LanguageToggle locale={locale} />
        </nav>
      </div>
    </header>
  );
}
