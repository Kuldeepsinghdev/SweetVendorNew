import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * GET /api/image-proxy?url=<external image url>
 *
 * Fallback proxy for external images that fail to load directly (used by the
 * CachedImage component). A few known-slow hosts are fast-pathed to local
 * high-res copies bundled in public/images.
 */

// Map of URL fragments -> local file in public/images.
const LOCAL_FASTPATH: { match: (u: string) => boolean; file: string; type: string }[] = [
  {
    match: (u) => u.includes('Moong-Dal-Burfi') || u.includes('anandams.com'),
    file: 'moong_barfi_anandam.jpg',
    type: 'image/jpeg',
  },
  {
    match: (u) => u.includes('mt-1771412570') || u.includes('indiatv.in'),
    file: 'mathri_indiatv.webp',
    type: 'image/webp',
  },
  {
    match: (u) => u.includes('p95T_AH9o') || (u.includes('bing.com') && u.includes('kaju')),
    file: 'kaju_katli_bing.webp',
    type: 'image/webp',
  },
];

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Local fast-path for known-slow hosts.
  const local = LOCAL_FASTPATH.find((f) => f.match(rawUrl));
  if (local) {
    try {
      const filePath = path.join(process.cwd(), 'public', 'images', local.file);
      const buf = await readFile(filePath);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type': local.type,
          // Cache at the browser AND the CDN. Proxied images are keyed by URL and
          // effectively immutable, so cache aggressively at the edge.
          'Cache-Control':
            'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400, immutable',
        },
      });
    } catch {
      // fall through to remote fetch if the local asset is missing
    }
  }

  // Only proxy http(s) URLs.
  if (!/^https?:\/\//i.test(rawUrl)) {
    return new NextResponse('Invalid url', { status: 400 });
  }

  try {
    const response = await fetch(rawUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!response.ok) {
      return new NextResponse('Unable to fetch image', { status: response.status });
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache at the browser AND the CDN. The proxied image is keyed by its
        // source URL and treated as immutable, so cache aggressively at the edge.
        'Cache-Control':
          'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    console.error('Image proxy error:', e?.message);
    return new NextResponse('Image proxy error', { status: 500 });
  }
}
