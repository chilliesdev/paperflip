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
  currentUrl: string
): Promise<void> {
  if (typeof caches === "undefined") return;
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  for (const request of keys) {
    if (request.url !== currentUrl) {
      await cache.delete(request);
    }
  }
}
