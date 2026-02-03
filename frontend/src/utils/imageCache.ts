/**
 * Image cache utility for caching vehicle images in localStorage
 * Reduces network requests for Tesla vehicle images
 */

const CACHE_PREFIX = 'car_img_cache_';
const CACHE_EXPIRY_DAYS = 30; // Cache images for 30 days

interface CachedImage {
  dataUrl: string;
  timestamp: number;
  url: string;
}

/**
 * Generate a cache key from URL
 */
function getCacheKey(url: string): string {
  // Create a simple hash from URL
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${CACHE_PREFIX}${Math.abs(hash)}`;
}

/**
 * Check if cache entry is expired
 */
function isExpired(timestamp: number): boolean {
  const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - timestamp > expiryMs;
}

/**
 * Get cached image from localStorage
 */
export function getCachedImage(url: string): string | null {
  if (!url) return null;

  try {
    const cacheKey = getCacheKey(url);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const data: CachedImage = JSON.parse(cached);
      
      // Check if cache is still valid and URL matches
      if (!isExpired(data.timestamp) && data.url === url) {
        return data.dataUrl;
      } else {
        // Remove expired cache
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn('Failed to get cached image:', error);
  }
  
  return null;
}

/**
 * Cache image to localStorage
 */
export function setCachedImage(url: string, dataUrl: string): void {
  if (!url || !dataUrl) return;

  try {
    const cacheKey = getCacheKey(url);
    const data: CachedImage = {
      dataUrl,
      timestamp: Date.now(),
      url,
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    // localStorage might be full or disabled
    console.warn('Failed to cache image:', error);
    
    // Try to clear old cache entries
    clearOldImageCache();
  }
}

/**
 * Clear old cache entries to free up space
 */
export function clearOldImageCache(): void {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const data: CachedImage = JSON.parse(cached);
            if (isExpired(data.timestamp)) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear old image cache:', error);
  }
}

/**
 * Load and cache image, returns a promise with cached or fetched image URL
 */
export function loadCachedImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No URL provided'));
      return;
    }

    // Check cache first
    const cached = getCachedImage(url);
    if (cached) {
      resolve(cached);
      return;
    }

    // Fetch and cache the image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Convert to data URL
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          
          // Cache the image
          setCachedImage(url, dataUrl);
          
          resolve(dataUrl);
        } else {
          // Fallback to original URL
          resolve(url);
        }
      } catch (error) {
        // CORS or other error, use original URL
        console.warn('Failed to convert image to data URL:', error);
        resolve(url);
      }
    };
    
    img.onerror = () => {
      // Return original URL on error
      resolve(url);
    };
    
    img.src = url;
  });
}
