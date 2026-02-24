import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCachedVideoBlob,
  saveVideoToCache,
  deleteOtherVideosFromCache,
} from "../../lib/stores/assets";

describe("Assets Store Cache Helpers", () => {
  const mockUrl = "https://example.com/video.mp4";
  const mockBlob = new Blob(["video data"], { type: "video/mp4" });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Cache API
    const mockCache = {
      match: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      keys: vi.fn().mockResolvedValue([]),
    };

    const mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
    };

    vi.stubGlobal("caches", mockCaches);
    vi.stubGlobal(
      "Response",
      class {
        constructor(public blobData: any) {}
        async blob() {
          return this.blobData;
        }
      },
    );
  });

  it("getCachedVideoBlob returns blob if found in cache", async () => {
    const mockCache = await caches.open("paperflip-videos");
    (mockCache.match as any).mockResolvedValue({
      blob: () => Promise.resolve(mockBlob),
    });

    const result = await getCachedVideoBlob(mockUrl);
    expect(result).toBe(mockBlob);
    expect(mockCache.match).toHaveBeenCalledWith(mockUrl);
  });

  it("getCachedVideoBlob returns null if not in cache", async () => {
    const mockCache = await caches.open("paperflip-videos");
    (mockCache.match as any).mockResolvedValue(null);

    const result = await getCachedVideoBlob(mockUrl);
    expect(result).toBeNull();
  });

  it("saveVideoToCache puts blob into cache", async () => {
    const mockCache = await caches.open("paperflip-videos");
    await saveVideoToCache(mockUrl, mockBlob);

    expect(mockCache.put).toHaveBeenCalledWith(mockUrl, expect.any(Object));
  });

  it("deleteOtherVideosFromCache removes non-matching keys", async () => {
    const mockCache = await caches.open("paperflip-videos");
    const key1 = { url: "https://example.com/video1.mp4" };
    const key2 = { url: "https://example.com/video2.mp4" };
    (mockCache.keys as any).mockResolvedValue([key1, key2]);

    await deleteOtherVideosFromCache("https://example.com/video1.mp4");

    expect(mockCache.delete).toHaveBeenCalledWith(key2);
    expect(mockCache.delete).not.toHaveBeenCalledWith(key1);
  });
});
