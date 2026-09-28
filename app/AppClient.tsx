'use client';

import dynamic from 'next/dynamic';

/**
 * Client-only mount of the existing React SPA (src/App.tsx).
 *
 * The SPA relies on browser APIs (localStorage, window.location.hash) and a
 * client React context, so it must not be server-rendered. We load it with
 * ssr:false and show a lightweight loading shell until it hydrates.
 */
const App = dynamic(() => import('@/src/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-amber-50/30">
      <div className="text-sm text-slate-500 font-medium animate-pulse">
        सहकार मिठाई लोड हो रहा है…
      </div>
    </div>
  ),
});

export default function AppClient() {
  return <App />;
}
