'use client';

/**
 * Resilient product image with graceful fallbacks.
 *
 * Client Component: it tracks load/error state and, when a direct external
 * fetch fails, retries once through the same-origin `/api/image-proxy` (now
 * host-allowlisted, see lib/security/imageHosts.ts) before falling back to a
 * bundled local asset. Ported from the SPA's CachedImage; the normalize map is
 * preserved so previously-cached URLs still resolve to local high-res copies.
 */

import { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  showSkeleton?: boolean;
}

const DEFAULT_FALLBACK = '/images/kaju_katli_local.jpg';

export function normalizeUrl(url: string): string {
  if (!url) return DEFAULT_FALLBACK;
  if (url.startsWith('/src/assets/images/')) {
    const filename = url.replace(/^\/src\/assets\/images\//, '');
    return `/images/${filename}`;
  }
  // Resolve known external sweet image URLs to bundled local assets to guarantee
  // instant loading without CORS/hotlinking issues.
  const lower = url.toLowerCase();
  if (
    url.includes('Moong-Dal-Burfi') ||
    url.includes('anandams.com') ||
    lower.includes('moong') ||
    lower.includes('mong')
  ) {
    return '/images/moong_barfi_anandam.jpg';
  }
  if (url.includes('mt-1771412570') || url.includes('indiatv.in') || lower.includes('mathri')) {
    return '/images/mathri_indiatv.webp';
  }
  if (
    url.includes('p95T_AH9o') ||
    (url.includes('bing.com') && (lower.includes('kaju') || lower.includes('kalu'))) ||
    lower.includes('kaju') ||
    lower.includes('kalu')
  ) {
    return '/images/kaju_katli_bing.webp';
  }
  return url;
}

export function CachedImage({
  src,
  alt,
  className = '',
  fallbackSrc,
  showSkeleton = true,
  style,
  ...props
}: CachedImageProps) {
  const resolvedFallback =
    fallbackSrc ||
    (alt?.includes('मूंग') || alt?.toLowerCase().includes('moong') || alt?.toLowerCase().includes('mong')
      ? '/images/moong_barfi_anandam.jpg'
      : alt?.includes('मठरी') || alt?.toLowerCase().includes('mathri')
        ? '/images/mathri_indiatv.webp'
        : alt?.includes('काजू') || alt?.toLowerCase().includes('kaju') || alt?.toLowerCase().includes('kalu')
          ? '/images/kaju_katli_bing.webp'
          : DEFAULT_FALLBACK);

  const targetSrc = normalizeUrl(src);
  const [currentSrc, setCurrentSrc] = useState<string>(targetSrc);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [triedProxy, setTriedProxy] = useState(false);

  useEffect(() => {
    setCurrentSrc(normalizeUrl(src));
    setHasError(false);
    setLoaded(false);
    setTriedProxy(false);
  }, [src]);

  const handleImageLoad = () => {
    setLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    // External URL failed directly and hasn't tried the backend proxy yet.
    if (!triedProxy && currentSrc.startsWith('http')) {
      setTriedProxy(true);
      setCurrentSrc(`/api/image-proxy?url=${encodeURIComponent(currentSrc)}`);
      return;
    }
    if (currentSrc !== resolvedFallback) {
      setCurrentSrc(resolvedFallback);
    } else {
      setHasError(true);
      setLoaded(true);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-amber-50/50 ${className}`}>
      {showSkeleton && !loaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/70 via-orange-100/60 to-amber-100/70 animate-pulse flex items-center justify-center z-10">
          <ImageIcon className="w-5 h-5 text-amber-500/50" />
        </div>
      )}

      {hasError ? (
        <div className="w-full h-full min-h-[140px] bg-gradient-to-br from-amber-100 to-orange-100 flex flex-col items-center justify-center text-amber-900 p-3 text-center">
          <span className="text-2xl mb-1">🪔</span>
          <span className="text-xs font-bold font-mono">{alt}</span>
          <span className="text-[10px] text-amber-700 font-medium">शुद्ध देशी घी मिष्ठान</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- external, dynamically-recovered sources; next/image cannot proxy the fallback chain.
        <img
          {...props}
          src={currentSrc}
          alt={alt}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ ...style, opacity: loaded ? 1 : 0.85, transition: 'opacity 0.25s ease-in-out' }}
          className={`w-full h-full object-cover ${className || ''}`}
        />
      )}
    </div>
  );
}
