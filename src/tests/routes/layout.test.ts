import { render, screen, waitFor, cleanup } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LayoutTestWrapper from "../mocks/LayoutTestWrapper.svelte";
import { isLoading } from "../../lib/stores/loading";
import { videoAssetUrls } from "../../lib/stores/assets";
import * as audio from "../../lib/audio";
import * as navigation from "$app/navigation";
import * as database from "../../lib/database";
import { autoResume } from "../../lib/stores/settings";

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
    sessionStorage.clear();

    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["video data"])),
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn((_blob) => "blob:video");

    // Mock window.location
    vi.stubGlobal("location", { pathname: "/" });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("initializes resources on first load", async () => {
    render(LayoutTestWrapper);

    // Should start loading
    await waitFor(() => {
      expect(audio.waitForVoices).toHaveBeenCalled();
    });

    // Should fetch videos
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://example.com/video1.mp4",
      );
    });

    // Eventually loading finishes and content appears
    await waitFor(
      () => {
        expect(screen.getByTestId("layout-content")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("skips initialization if assets already cached", async () => {
    videoAssetUrls.set({ "http://example.com/video1.mp4": "blob:video" });

    render(LayoutTestWrapper);

    // Should NOT fetch or wait for voices
    await waitFor(() => {
      expect(screen.getByTestId("layout-content")).toBeInTheDocument();
    });

    expect(audio.waitForVoices).not.toHaveBeenCalled();
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
