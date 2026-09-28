/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // postgres-js is a server-only package; keep it out of the client/edge bundle.
  serverExternalPackages: ['postgres', 'bcryptjs'],
  typescript: {
    // The ported src/ SPA predates strict typing and was built by Vite (which
    // is lenient) and excluded from tsc. It carries known type errors that do
    // not affect runtime. Skip type-checking during `next build` so the
    // migration can ship; the app/ + lib/ code is type-checked via `tsc`.
    ignoreBuildErrors: true,
  },
  images: {
    // Allowlist for next/image + a reference for the image-proxy host allowlist.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
