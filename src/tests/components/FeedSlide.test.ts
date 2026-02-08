import { render, screen, cleanup } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FeedSlide from "../../lib/components/FeedSlide.svelte";
import { videoAssetUrls } from "../../lib/stores/assets";
import { get } from "svelte/store";

// Mock the assets store
vi.mock("../../lib/stores/assets", async () => {
  const { writable } = await import("svelte/store");
  return {
    videoAssetUrls: writable({}),
  };
});

describe("FeedSlide Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store
    videoAssetUrls.set({});

    // Mock HTMLMediaElement methods
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    segment: "Hello world this is a test",
    index: 0,
    total: 5,
    isActive: true,
    isPlaying: true,
    currentCharIndex: -1,
    videoSource: "http://example.com/video.mp4",
  };

  describe("Rendering", () => {
    it("renders video element with correct fallback source", () => {
      render(FeedSlide, { ...defaultProps });
      const video = document.querySelector("video");
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute("src", defaultProps.videoSource);
    });

    it("renders page indicator correctly", () => {
      render(FeedSlide, { ...defaultProps, index: 2, total: 10 });
      expect(screen.getByText("Short 3 / 10")).toBeInTheDocument();
    });

    it("renders segment text split into words", () => {
      render(FeedSlide, { ...defaultProps, segment: "Hello world" });
      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(screen.getByText("world")).toBeInTheDocument();
    });

    it("shows swipe hint only on first slide when inactive", () => {
      // Case 1: First slide, inactive -> Should show
      const { unmount } = render(FeedSlide, {
        ...defaultProps,
        index: 0,
        isActive: false,
      });
      expect(screen.getByText("Swipe up")).toBeInTheDocument();
      unmount();

      // Case 2: Second slide, inactive -> Should NOT show
      render(FeedSlide, { ...defaultProps, index: 1, isActive: false });
      expect(screen.queryByText("Swipe up")).not.toBeInTheDocument();
    });
  });

  describe("Logic & Interactions", () => {
    it("highlights the active word based on currentCharIndex", () => {
      // "Hello" is 5 chars. Index 0-4 should highlight "Hello".
      // "world" starts at index 6 (space at 5).
      render(FeedSlide, {
        ...defaultProps,
        segment: "Hello world",
        currentCharIndex: 2,
      });

      const hello = screen.getByText("Hello");
      const world = screen.getByText("world");

      expect(hello).toHaveClass("text-[#00ff88]"); // Active style
      expect(world).toHaveClass("text-white/50"); // Future style
    });

    it("marks past words correctly", () => {
      // "Hello" (0-5), "world" (6-11).
      // Index 7 is inside "world".
      render(FeedSlide, {
        ...defaultProps,
        segment: "Hello world",
        currentCharIndex: 7,
      });

      const hello = screen.getByText("Hello");
      const world = screen.getByText("world");

      expect(hello).toHaveClass("text-white/80"); // Past style
      expect(world).toHaveClass("text-[#00ff88]"); // Active style
    });

    it("handles currentCharIndex = -1 (no active words)", () => {
      render(FeedSlide, {
        ...defaultProps,
        segment: "Hello world",
        currentCharIndex: -1,
      });

      const hello = screen.getByText("Hello");
      const world = screen.getByText("world");

      expect(hello).not.toHaveClass("text-[#00ff88]");
      expect(world).not.toHaveClass("text-[#00ff88]");
    });
  });

  describe("Video Playback", () => {
    it("plays video when active and playing", async () => {
      render(FeedSlide, { ...defaultProps, isActive: true, isPlaying: true });
      // Svelte reactive statements run after render.
      // We need to wait or verify calls.
      // Since we mock play, we can check if it was called.
      // Note: The component calls play() in a reactive statement.
      await new Promise((resolve) => setTimeout(resolve, 0)); // Tick
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });

    it("pauses video when inactive", async () => {
      render(FeedSlide, { ...defaultProps, isActive: false, isPlaying: true });
      await new Promise((resolve) => setTimeout(resolve, 0)); // Tick
      expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });

    it("pauses video when not playing (global pause)", async () => {
      render(FeedSlide, { ...defaultProps, isActive: true, isPlaying: false });
      await new Promise((resolve) => setTimeout(resolve, 0)); // Tick
      expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });

    it("uses cached video source if available", async () => {
      const cachedUrl = "blob:http://example.com/uuid";
      videoAssetUrls.set({ [defaultProps.videoSource]: cachedUrl });

      render(FeedSlide, { ...defaultProps });
      const video = document.querySelector("video");
      expect(video).toHaveAttribute("src", cachedUrl);
    });
  });
});
