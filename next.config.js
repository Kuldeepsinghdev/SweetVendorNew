import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  // postgres-js is a server-only package; keep it out of the client/edge bundle.
  serverExternalPackages: ['postgres', 'bcryptjs'],
  typescript: {
    // Type-checking is enforced during `next build`. The whole tree (app/, lib/,
    // and the src/ code still being ported) is checked by tsc via tsconfig.json;
    // only the root drizzle.config.ts is excluded (build-time tooling on an old
    // drizzle-kit version that lacks defineConfig types).
    ignoreBuildErrors: false,
  },
  images: {
    // Allowlist for next/image + a reference for the image-proxy host allowlist.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        // Bundled product/sweet images in public/images are content-stable, so
        // let the browser and CDN cache them long-term (immutable). Update by
        // changing the filename if an asset ever needs to change.
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
