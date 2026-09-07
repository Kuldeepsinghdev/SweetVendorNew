/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// In-memory cache set for tracking preloaded and cached image URLs
const loadedImageCache = new Set<string>();

/**
 * Preload a single image URL into browser cache and memory cache
 */
export const preloadImage = (url: string): Promise<boolean> => {
  if (!url || typeof url !== 'string') return Promise.resolve(false);
  
  // Clean URL string
  const cleanUrl = url.trim();
  if (!cleanUrl) return Promise.resolve(false);

  if (loadedImageCache.has(cleanUrl)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    
    img.onload = () => {
      loadedImageCache.add(cleanUrl);
      resolve(true);
    };

    img.onerror = () => {
      // Even if it fails, mark to prevent endless retry spam
      loadedImageCache.add(cleanUrl);
      resolve(false);
    };

    img.src = cleanUrl;
  });
};

/**
 * Preload multiple image URLs concurrently for fast instantaneous render
 */
export const preloadImages = async (urls: (string | undefined | null)[]): Promise<void> => {
  const validUrls = Array.from(
    new Set(
      urls
        .filter((url): url is string => Boolean(url && typeof url === 'string'))
        .map((u) => u.trim())
    )
  );

  if (validUrls.length === 0) return;

  // Preload all valid images in parallel
  await Promise.allSettled(validUrls.map((url) => preloadImage(url)));
};

/**
 * Check if an image URL has already been preloaded / cached in the current session
 */
export const isImageCached = (url?: string | null): boolean => {
  if (!url) return false;
  return loadedImageCache.has(url.trim());
};
