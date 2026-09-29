import 'server-only';

/**
 * SSRF protection for the image proxy.
 *
 * The proxy (`/api/image-proxy`) fetches an arbitrary `?url=` on the server, so
 * without a host allowlist it can be abused to reach internal/metadata
 * endpoints (169.254.169.254, localhost, private ranges) or any host on the
 * network. We therefore only proxy known, public image hosts.
 *
 * Keep this in sync with `next.config.js` `images.remotePatterns` and the CSP
 * `img-src` in `middleware.ts`.
 */

/**
 * Allowed hosts. An entry matches the URL host exactly OR as a suffix preceded
 * by a dot (so `supabase.co` matches `xyz.supabase.co` but not `notsupabase.co`).
 */
const ALLOWED_IMAGE_HOSTS: readonly string[] = [
  'supabase.co',
  'supabase.in',
  // Approved catalog / CDN sources referenced by the seed data + fast-path.
  'anandams.com',
  'indiatv.in',
  'bing.com',
  'th.bing.com',
  'googleusercontent.com',
  'gstatic.com',
  'wikimedia.org',
  'cloudinary.com',
  'imagekit.io',
];

function hostAllowed(host: string): boolean {
  const h = host.toLowerCase();
  return ALLOWED_IMAGE_HOSTS.some(
    (allowed) => h === allowed || h.endsWith(`.${allowed}`)
  );
}

/**
 * Validate a candidate proxy URL. Returns the parsed URL when it is a public
 * http(s) address on an allowlisted host, or null when it must be rejected.
 * Rejects non-http(s) schemes, and hosts that resolve to obviously private /
 * loopback / link-local literals (defense-in-depth alongside the allowlist).
 */
export function validateProxyUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.toLowerCase();

  // Block obvious internal targets even if somehow allowlisted.
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '169.254.169.254' || // cloud metadata
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return null;
  }

  if (!hostAllowed(host)) return null;

  return url;
}
