'use client';

/**
 * Language switcher.
 *
 * The active locale is URL-authoritative (`/hi/...` ↔ `/en/...`), so switching
 * language is just a client-side navigation that swaps the locale segment of
 * the current path. No context or stored preference is consulted — the URL is
 * the single source of truth. Replaces the SPA's context-driven switchLanguage.
 */

import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { switchLocaleInPath, type Locale } from '@/src/lib/locale';

export function LanguageToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const target: Locale = locale === 'hi' ? 'en' : 'hi';

  return (
    <button
      type="button"
      onClick={() => router.push(switchLocaleInPath(pathname, target))}
      className="px-2 sm:px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-400/80 rounded-xl text-amber-200 hover:text-white flex items-center gap-1 text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
      title={locale === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
      aria-label={locale === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
    >
      <Languages className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="font-mono">{locale === 'hi' ? 'EN' : 'हिन्दी'}</span>
    </button>
  );
}
