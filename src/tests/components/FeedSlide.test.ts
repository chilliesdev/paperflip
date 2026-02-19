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

    it("renders segment text split into words", () => {
      render(FeedSlide, { ...defaultProps, segment: "Hello world" });
      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(screen.getByText("world")).toBeInTheDocument();
    });

    it("renders only wordCount words if segment is long", () => {
      const longSegment = "one two three four five six seven eight nine ten";
      render(FeedSlide, { ...defaultProps, segment: longSegment });

      // Since wordCount is 8, we expect words 1-8 to be present, and 9-10 to be absent
      expect(screen.getByText("one")).toBeInTheDocument();
      expect(screen.getByText("eight")).toBeInTheDocument();
      expect(screen.queryByText("nine")).not.toBeInTheDocument();
      expect(screen.queryByText("ten")).not.toBeInTheDocument();
    });

    it("shifts the window when currentCharIndex moves to the next set of words", () => {
      const longSegment = "one two three four five six seven eight nine ten";
      // one(0-3), two(4-7), three(8-13), four(14-18), five(19-23), six(24-27), seven(28-33), eight(34-39), nine(40-44)
      render(FeedSlide, {
        ...defaultProps,
        segment: longSegment,
        currentCharIndex: 41, // Index of 'i' in 'nine'
      });

      expect(screen.queryByText("one")).not.toBeInTheDocument();
      expect(screen.getByText("nine")).toBeInTheDocument();
      expect(screen.getByText("ten")).toBeInTheDocument();
    });

    it("shows swipe hint only on first slide when active", () => {
      // Case 1: First slide, active -> Should show
      const { unmount } = render(FeedSlide, {
        ...defaultProps,
        index: 0,
        isActive: true,
      });
      expect(screen.getByText("Swipe up to continue")).toBeInTheDocument();
      unmount();

      // Case 2: First slide, inactive -> Should NOT show
      render(FeedSlide, { ...defaultProps, index: 0, isActive: false });
      expect(
        screen.queryByText("Swipe up to continue"),
      ).not.toBeInTheDocument();
      cleanup();

      // Case 3: Second slide, active -> Should NOT show
      render(FeedSlide, { ...defaultProps, index: 1, isActive: true });
      expect(
        screen.queryByText("Swipe up to continue"),
      ).not.toBeInTheDocument();
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

      expect(hello).toHaveClass("text-brand-primary"); // Active style
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
      expect(world).toHaveClass("text-brand-primary"); // Active style
    });

    it("handles currentCharIndex = -1 (no active words)", () => {
      render(FeedSlide, {
        ...defaultProps,
        segment: "Hello world",
        currentCharIndex: -1,
      });

      const hello = screen.getByText("Hello");
      const world = screen.getByText("world");

      expect(hello).not.toHaveClass("text-brand-primary");
      expect(world).not.toHaveClass("text-brand-primary");
    });

    it("highlights a range of words when highlightEndIndex is provided (Dictation Mode)", () => {
      // "Hello" (0-5), "world" (6-11).
      // "Hello world" length is 11.
      // Range: 0 to 11.
      render(FeedSlide, {
        ...defaultProps,
        segment: "Hello world",
        currentCharIndex: 0,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        highlightEndIndex: 11,
      });

      const hello = screen.getByText("Hello");
      const world = screen.getByText("world");

      expect(hello).toHaveClass("text-brand-primary");
      expect(world).toHaveClass("text-brand-primary");
    });

    it("shows entire long sentence in Dictation Mode regardless of wordCount limit", () => {
      // wordCount is 8.
      // Create a sentence with 10 words.
      const longSentence = "one two three four five six seven eight nine ten";
      // Length calculation: 3+1+3+1+5+1+4+1+4+1+3+1+5+1+5+1+4+1+3 = 48 (approx)

      render(FeedSlide, {
        ...defaultProps,
        segment: longSentence,
        currentCharIndex: 0,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        highlightEndIndex: longSentence.length,
      });

      // All words should be visible
      expect(screen.getByText("one")).toBeInTheDocument();
      expect(screen.getByText("eight")).toBeInTheDocument(); // 8th word
      expect(screen.getByText("nine")).toBeInTheDocument(); // 9th word - usually hidden
      expect(screen.getByText("ten")).toBeInTheDocument(); // 10th word - usually hidden
    });

    it("applies wider margin to active words", () => {
      render(FeedSlide, {
        ...defaultProps,
        segment: "Hello world",
        currentCharIndex: 0,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        highlightEndIndex: 11,
      });

      const hello = screen.getByText("Hello");
      // Active words should have mx-1.5 to compensate for scale-110
      expect(hello).toHaveClass("mx-1.5");
      expect(hello).not.toHaveClass("mx-[2px]");
    });

    it("applies narrow margin to inactive words", () => {
      render(FeedSlide, {
        ...defaultProps,
        segment: "Hello world",
        currentCharIndex: -1,
      });

      const hello = screen.getByText("Hello");
      // Inactive words should have mx-[2px]
      expect(hello).toHaveClass("mx-[2px]");
      expect(hello).not.toHaveClass("mx-1.5");
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

  describe("Progress Bar", () => {
    it("calculates progress based on character index", () => {
      // "Hello world" length is 11.
      // At index 5 (' '), progress should be 5/11 * 100 = 45.4545...%

      render(FeedSlide, {
        ...defaultProps,
        segment: "Hello world",
        currentCharIndex: 5,
      });

      const progressBar = document.querySelector(".bg-gradient-to-r");
      expect(progressBar).not.toBeNull();

      const style = progressBar?.getAttribute("style");
      // Extract the width percentage
      const match = style?.match(/width: ([\d.]+)%/);
      expect(match).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const percentage = parseFloat(match![1]);

      // Expect approximately 45.45%
      expect(percentage).toBeCloseTo(45.45, 1);
    });
  });

  describe("Safety", () => {
    it("handles undefined segment gracefully", () => {
      const defaultProps = {
        segment: "Hello world this is a test",
        index: 0,
        isActive: true,
        isPlaying: true,
        currentCharIndex: -1,
        videoSource: "http://example.com/video.mp4",
      };
      // @ts-ignore
      render(FeedSlide, { ...defaultProps, segment: undefined });
      const video = document.querySelector("video");
      expect(video).toBeInTheDocument();
      // Should not throw and should render empty text container
      const textContainer = document.querySelector(".backdrop-blur-xl");
      expect(textContainer).toBeInTheDocument();
      expect(textContainer?.textContent?.trim()).toBe("");
    });
  });

  describe("Dictation Mode Enhancements", () => {
    it("uses highlightStartIndex to determine visible words range", () => {
      const defaultProps = {
        segment: "Hello world this is a test",
        index: 0,
        isActive: true,
        isPlaying: true,
        currentCharIndex: -1,
        videoSource: "http://example.com/video.mp4",
      };

      // "Hello world" length is 11.
      // range: 0-11.
      // If we provide highlightStartIndex=0 and currentCharIndex=5 (progress mid-way).

      render(FeedSlide, {
        ...defaultProps,
        segment: "Hello world",
        currentCharIndex: 5,
        // @ts-ignore
        highlightEndIndex: 11,
        highlightStartIndex: 0,
      });

      // Both "Hello" (0-5) and "world" (6-11) should be visible because
      // filter uses (w.start >= highlightStartIndex) -> 0 >= 0 (true)
      // If it used currentCharIndex(5), "Hello"(0) would be hidden.

      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(screen.getByText("world")).toBeInTheDocument();

      // Progress calculation uses currentCharIndex(5) -> ~45%
      const progressBar = document.querySelector(".bg-gradient-to-r");
      expect(progressBar).not.toBeNull();
      const style = progressBar?.getAttribute("style");
      const match = style?.match(/width: ([\d.]+)%/);
      const percentage = parseFloat(match![1]);
      expect(percentage).toBeGreaterThan(40);
      expect(percentage).toBeLessThan(50);
    });

    it("defaults to currentCharIndex if highlightStartIndex is missing", () => {
      const defaultProps = {
        segment: "Hello world this is a test",
        index: 0,
        isActive: true,
        isPlaying: true,
        currentCharIndex: -1,
        videoSource: "http://example.com/video.mp4",
      };

      // "Hello world"
      // If highlightStartIndex is undefined, it falls back to currentCharIndex.
      // If currentCharIndex=6 ("world"), "Hello" should be hidden.

      render(FeedSlide, {
        ...defaultProps,
        segment: "Hello world",
        currentCharIndex: 6,
        // @ts-ignore
        highlightEndIndex: 11,
      });

      expect(screen.queryByText("Hello")).not.toBeInTheDocument();
      expect(screen.getByText("world")).toBeInTheDocument();
    });
  });
});
