/**
 * Mitra Portal Header
 *
 * Minimal top header for the main content area of the 2-column layout.
 * Shows page title and udhar outstanding badge.
 */

import type { Locale } from '@/src/lib/locale';

interface MitraPortalHeaderProps {
  locale: Locale;
  title: string;
  titleHi: string;
  udharOutstanding: number;
}

export function MitraPortalHeader({
  locale,
  title,
  titleHi,
  udharOutstanding,
}: MitraPortalHeaderProps) {
  const hi = locale === 'hi';
  const displayTitle = hi ? titleHi : title;
  const isOutstanding = udharOutstanding > 0;

  return (
    <header className="bg-white border-b border-amber-200 h-14 px-6 flex items-center justify-between gap-4 sticky top-0 z-10">
      <h1 className="border-l-2 border-orange-600 pl-3 text-base font-bold text-slate-900">{displayTitle}</h1>

      {/* Udhar outstanding badge */}
      <div
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono whitespace-nowrap
          ${
            isOutstanding
              ? 'bg-rose-100 text-rose-900 border border-rose-300'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
          }
        `}
      >
        <span className={`text-[10px] uppercase tracking-wider font-medium ${isOutstanding ? 'text-rose-700' : 'text-emerald-700'}`}>
          {hi ? 'उधार बकाया' : 'Udhar Due'}
        </span>
        <span className="font-black">
          ₹{udharOutstanding.toLocaleString('en-IN')}
        </span>
      </div>
    </header>
  );
}
