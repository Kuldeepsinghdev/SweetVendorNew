'use client';

/**
 * Language switcher (cookie-based, URL stays unchanged).
 *
 * POSTs to /api/set-locale with the target locale and the current pathname,
 * then calls router.refresh() so Server Components re-render with the new
 * x-locale header — without triggering a full navigation or URL change.
 *
 * Replaces the old URL-swap approach (router.push(switchLocaleInPath(...))).
 */

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import type { Locale } from '@/src/lib/locale';

export function LanguageToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticLocale, setOptimisticLocale] = useState<Locale>(locale);

  const target: Locale = optimisticLocale === 'hi' ? 'en' : 'hi';

  async function handleSwitch() {
    // Optimistically update the button label immediately so the UI feels snappy.
    setOptimisticLocale(target);

    try {
      await fetch('/api/set-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: target, returnTo: pathname }),
      });
    } catch {
      // Network error: revert optimistic update.
      setOptimisticLocale(optimisticLocale);
      return;
    }

    // Revalidate Server Components so they re-render with the new x-locale header.
    startTransition(() => {
      router.refresh();
    });
  }

  const isHindi = optimisticLocale === 'hi';

  return (
    <button
      type="button"
      onClick={handleSwitch}
      disabled={isPending}
      className="px-2 sm:px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-400/80 rounded-xl text-amber-200 hover:text-white flex items-center gap-1 text-[11px] sm:text-xs font-bold transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-xs"
      title={isHindi ? 'Switch to English' : 'हिन्दी में बदलें'}
      aria-label={isHindi ? 'Switch to English' : 'हिन्दी में बदलें'}
      aria-pressed={!isHindi}
    >
      <Languages className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      {/* Show the label for the OTHER language (what you'll switch TO) */}
      <span className="font-mono">{isHindi ? 'EN' : 'हिन्दी'}</span>
    </button>
  );
}
