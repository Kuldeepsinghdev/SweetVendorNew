'use client';

import dynamic from 'next/dynamic';
import type { Locale } from '@/src/lib/locale';

/**
 * Client-only mount of the existing React SPA (src/App.tsx).
 *
 * The SPA relies on browser APIs (localStorage, window.location.hash) and a
 * client React context, so it must not be server-rendered. We load it with
 * ssr:false and show a lightweight loading shell until it hydrates.
 *
 * The active `locale` comes from the URL segment (`/en`, `/hi`) and is passed
 * down so the app initializes in the language the URL asks for — the URL is
 * authoritative over any stored preference when a locale prefix is present.
 */
const App = dynamic(() => import('@/src/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-amber-50/30">
      <div className="text-sm text-slate-500 font-medium animate-pulse">
        सहकार मिठाई लोड हो रहा है… / Loading…
      </div>
    </div>
  ),
});

export default function AppClient({ locale }: { locale: Locale }) {
  return <App initialLocale={locale} />;
}
