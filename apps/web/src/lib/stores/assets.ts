import { writable } from "svelte/store";

export const videoAssetUrls = writable<Record<string, string>>({});

const CACHE_NAME = "paperflip-videos";

/**
 * Retrieves a video blob from the cache if it exists.
 */
export async function getCachedVideoBlob(url: string): Promise<Blob | null> {
  if (typeof caches === "undefined") return null;
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(url);
  if (response) {
    return await response.blob();
  }
  return null;
}

/**
 * Stores a video blob in the cache.
 */
export async function saveVideoToCache(url: string, blob: Blob): Promise<void> {
  if (typeof caches === "undefined") return;
  const cache = await caches.open(CACHE_NAME);
  const response = new Response(blob);
  await cache.put(url, response);
}

/**
 * Clears other videos from the cache to ensure only the currently selected background is stored.
 */
export async function deleteOtherVideosFromCache(
  currentUrl: string,
): Promise<void> {
  if (typeof caches === "undefined") return;
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  // ⚡ Bolt: Performance optimization
  // Replaced sequential await in for-loop with Promise.all
  // This allows the browser to process cache deletions concurrently,
  // reducing blocking time during background asset synchronization.
  const deletions = [];
  for (let i = 0; i < keys.length; i++) {
    const request = keys[i];
    if (request.url !== currentUrl) {
      deletions.push(cache.delete(request));
    }
  }

  if (deletions.length > 0) {
    await Promise.all(deletions);
  }
}
