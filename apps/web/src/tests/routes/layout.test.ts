import { render, screen, waitFor, cleanup } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LayoutTestWrapper from "../mocks/LayoutTestWrapper.svelte";
import { isLoading } from "../../lib/stores/loading";
import { videoAssetUrls } from "../../lib/stores/assets";
import * as assets from "../../lib/stores/assets";
import * as audio from "../../lib/audio";
import * as navigation from "$app/navigation";
import * as database from "../../lib/database";
import { autoResume, backgroundUrl } from "../../lib/stores/settings";

// Mock stores
vi.mock("../../lib/stores/loading", async () => {
  const { writable } = await import("svelte/store");
  return {
    isLoading: writable(true),
    loadingStatus: writable(""),
  };
});

vi.mock("../../lib/stores/assets", async () => {
  const { writable } = await import("svelte/store");
  return {
    videoAssetUrls: writable({}),
    getCachedVideoBlob: vi.fn().mockResolvedValue(null),
    saveVideoToCache: vi.fn().mockResolvedValue(undefined),
    deleteOtherVideosFromCache: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock sync utility
vi.mock("../../lib/stores/sync", () => ({
  syncStoresWithDb: vi.fn().mockResolvedValue(undefined),
}));

// Mock navigation
vi.mock("$app/navigation", () => ({
  goto: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

// Mock database
vi.mock("../../lib/database", () => ({
  getRecentUploads: vi.fn().mockResolvedValue([]),
}));

// Mock settings stores
vi.mock("../../lib/stores/settings", async () => {
  const { writable } = await import("svelte/store");
  return {
    autoResume: writable(true),
    darkMode: writable(true),
    backgroundUrl: writable("http://example.com/video1.mp4"),
    settingsStores: {},
  };
});

// Mock audio stores
vi.mock("../../lib/stores/audio", async () => {
  return {
    audioStores: {},
  };
});

// Mock audio
vi.mock("../../lib/audio", () => ({
  waitForVoices: vi.fn().mockResolvedValue(undefined),
}));

// Mock constants
vi.mock("../../lib/constants", () => ({
  videoSources: [{ url: "http://example.com/video1.mp4" }],
}));

// Mock LoadingScreen
vi.mock("../../lib/components/LoadingScreen.svelte", () => {
  return { default: null };
});
vi.unmock("../../lib/components/LoadingScreen.svelte");

describe("Layout Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isLoading.set(true);
    videoAssetUrls.set({});
    autoResume.set(true);
    backgroundUrl.set("http://example.com/video1.mp4");
    sessionStorage.clear();

    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["video data"])),
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn((_blob) => "blob:video");
    global.URL.revokeObjectURL = vi.fn();

    // Mock window.location
    vi.stubGlobal("location", { pathname: "/" });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("initializes resources on first load and fetches active video", async () => {
    render(LayoutTestWrapper);

    // Should start loading
    await waitFor(() => {
      expect(audio.waitForVoices).toHaveBeenCalled();
    });

    // Should fetch the CURRENT background video
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://example.com/video1.mp4",
      );
    });

    // Should save to cache
    await waitFor(() => {
      expect(assets.saveVideoToCache).toHaveBeenCalled();
    });

    // Eventually loading finishes and content appears
    await waitFor(
      () => {
        expect(screen.getByTestId("layout-content")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("retrieves from cache if available", async () => {
    (assets.getCachedVideoBlob as any).mockResolvedValueOnce(
      new Blob(["cached data"]),
    );

    render(LayoutTestWrapper);

    await waitFor(() => {
      expect(assets.getCachedVideoBlob).toHaveBeenCalledWith(
        "http://example.com/video1.mp4",
      );
    });

    // Should NOT fetch if in cache
    expect(global.fetch).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByTestId("layout-content")).toBeInTheDocument();
    });
  });

  it("revokes old object URLs when background changes", async () => {
    // Start with a blob URL already set
    videoAssetUrls.set({ "http://example.com/old.mp4": "blob:old" });
    backgroundUrl.set("http://example.com/video1.mp4");

    render(LayoutTestWrapper);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://example.com/video1.mp4",
      );
    });

    await waitFor(() => {
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:old");
    });
  });

  it("skips initialization if assets already cached in store", async () => {
    videoAssetUrls.set({ "http://example.com/video1.mp4": "blob:video" });

    render(LayoutTestWrapper);

    await waitFor(() => {
      expect(screen.getByTestId("layout-content")).toBeInTheDocument();
    });

    expect(audio.waitForVoices).toHaveBeenCalled();
    // But it should NOT fetch again because videoAssetUrls already has it
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("handles fetch failure gracefully", async () => {
    // Mock fetch failure
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    // Mock console.error to suppress noise
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(LayoutTestWrapper);

    await waitFor(() => {
      expect(screen.getByTestId("layout-content")).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
  });

  it("auto-resumes to most recent document on startup", async () => {
    const mockDoc = { documentId: "recent-doc.pdf" };
    (database.getRecentUploads as any).mockResolvedValueOnce([mockDoc]);

    render(LayoutTestWrapper);

    await waitFor(() => {
      expect(navigation.goto).toHaveBeenCalledWith("/feed?id=recent-doc.pdf");
    });

    expect(sessionStorage.getItem("hasAutoResumed")).toBe("true");
  });

  it("does NOT auto-resume if feature disabled", async () => {
    autoResume.set(false);
    const mockDoc = { documentId: "recent-doc.pdf" };
    (database.getRecentUploads as any).mockResolvedValueOnce([mockDoc]);

    render(LayoutTestWrapper);

    // Redirection should not happen
    await new Promise((r) => setTimeout(r, 100));
    expect(navigation.goto).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("hasAutoResumed")).toBe("true");
  });
});
