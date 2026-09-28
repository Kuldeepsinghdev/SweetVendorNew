import AppClient from './AppClient';

/**
 * Root route — mounts the full Sahakar Mitra SPA (client-rendered).
 *
 * The application UI lives in src/App.tsx and is loaded client-side via
 * AppClient (next/dynamic, ssr:false). The API layer is served by the Next.js
 * route handlers under app/api/.
 */
export default function HomePage() {
  return <AppClient />;
}
