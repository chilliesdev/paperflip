import { render, screen, cleanup, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FeedSlide from "../../lib/components/FeedSlide.svelte";
import { videoAssetUrls } from "../../lib/stores/assets";

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
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    segment: "Hello world",
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

    it("renders entire sentence in Karaoke mode even if it is long", () => {
      const longSegment = "one two three four five six seven eight nine ten";
      render(FeedSlide, { ...defaultProps, segment: longSegment });

      // Previously (wordCount=8), "nine" and "ten" would be hidden.
      // Now, all words in the sentence should be visible.
      expect(screen.getByText("one")).toBeInTheDocument();
      expect(screen.getByText("eight")).toBeInTheDocument();
      expect(screen.getByText("nine")).toBeInTheDocument();
      expect(screen.getByText("ten")).toBeInTheDocument();
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
        // @ts-expect-error - highlightEndIndex is used in dictation mode but not in props
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
        // @ts-expect-error - highlightEndIndex is used in dictation mode but not in props
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
        // @ts-expect-error - highlightEndIndex is used in dictation mode but not in props
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
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });

    it("pauses video when inactive", async () => {
      render(FeedSlide, { ...defaultProps, isActive: false, isPlaying: true });
      await new Promise((resolve) => setTimeout(resolve, 0)); // Tick
      expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });

    it("pauses video when not playing (global pause)", async () => {
      render(FeedSlide, { ...defaultProps, isActive: true, isPlaying: false });
      await new Promise((resolve) => setTimeout(resolve, 0)); // Tick
      expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
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
      const percentage = parseFloat(match![1]);

      // Expect approximately 45.45%
      expect(percentage).toBeCloseTo(45.45, 1);
    });
  });

  describe("Safety", () => {
    it("handles undefined segment gracefully", () => {
      const defaultProps = {
        segment: "Hello world",
        isActive: true,
        isPlaying: true,
        currentCharIndex: -1,
        videoSource: "http://example.com/video.mp4",
      };
      // @ts-expect-error - testing invalid segment prop
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
        segment: "Hello world",
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
        // @ts-expect-error - highlightEndIndex is used in dictation mode but not in props
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
        segment: "Hello world",
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
        // @ts-expect-error - highlightEndIndex is used in dictation mode but not in props
        highlightEndIndex: 11,
      });

      expect(screen.queryByText("Hello")).not.toBeInTheDocument();
      expect(screen.getByText("world")).toBeInTheDocument();
    });
  });
});

  describe("Scrubbing Interaction", () => {
    const defaultProps = {
      segment: "Hello world",
      isActive: true,
      isPlaying: true,
      currentCharIndex: -1,
      videoSource: "http://example.com/video.mp4",
    };

    let mockSetPointerCapture: ReturnType<typeof vi.fn>;
    let mockReleasePointerCapture: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockSetPointerCapture = vi.fn();
      mockReleasePointerCapture = vi.fn();
      HTMLElement.prototype.setPointerCapture = mockSetPointerCapture;
      HTMLElement.prototype.releasePointerCapture = mockReleasePointerCapture;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("triggers onScrubStart and onScrub on pointerdown", () => {
      const onScrubStart = vi.fn();
      const onScrub = vi.fn();
      render(FeedSlide, {
        ...defaultProps,
        onScrubStart,
        onScrub,
      });

      const slider = screen.getByRole("slider");

      // Mock getBoundingClientRect
      vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
        width: 100,
        left: 0,
        top: 0,
        right: 100,
        bottom: 10,
        height: 10,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Click at 50px (50% of 100px width). Segment length is 11 ("Hello world").
      // Expected index: floor(0.5 * 11) = 5
      fireEvent.pointerDown(slider, {
        clientX: 50,
        pointerId: 1,
      });

      expect(mockSetPointerCapture).toHaveBeenCalledWith(1);
      expect(onScrubStart).toHaveBeenCalled();
      expect(onScrub).toHaveBeenCalledWith(5);
    });

    it("triggers onScrub on pointermove while dragging", () => {
      const onScrub = vi.fn();
      render(FeedSlide, {
        ...defaultProps,
        onScrub,
      });

      const slider = screen.getByRole("slider");
      vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
        width: 100,
        left: 0,
        top: 0,
        right: 100,
        bottom: 10,
        height: 10,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Start dragging
      fireEvent.pointerDown(slider, { clientX: 0, pointerId: 1 });
      onScrub.mockClear();

      // Move to 80px (80%). Expected index: floor(0.8 * 11) = 8
      fireEvent.pointerMove(slider, { clientX: 80, pointerId: 1 });

      expect(onScrub).toHaveBeenCalledWith(8);
    });

    it("does not trigger onScrub on pointermove if not dragging", () => {
      const onScrub = vi.fn();
      render(FeedSlide, {
        ...defaultProps,
        onScrub,
      });

      const slider = screen.getByRole("slider");
      fireEvent.pointerMove(slider, { clientX: 50 });

      expect(onScrub).not.toHaveBeenCalled();
    });

    it("triggers onScrubEnd and releases capture on pointerup", () => {
      const onScrubEnd = vi.fn();
      render(FeedSlide, {
        ...defaultProps,
        onScrubEnd,
      });

      const slider = screen.getByRole("slider");
      vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
        width: 100,
        left: 0,
        top: 0,
        right: 100,
        bottom: 10,
        height: 10,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Start dragging
      fireEvent.pointerDown(slider, { clientX: 0, pointerId: 1 });

      // End dragging at 20px (20%). Expected index: floor(0.2 * 11) = 2
      fireEvent.pointerUp(slider, { clientX: 20, pointerId: 1 });

      expect(mockReleasePointerCapture).toHaveBeenCalledWith(1);
      expect(onScrubEnd).toHaveBeenCalledWith(2);
    });

    it("stops event propagation to prevent Swiper interference", () => {
      render(FeedSlide, {
        ...defaultProps,
      });

      const slider = screen.getByRole("slider");
      const event = new PointerEvent("pointerdown", { bubbles: true, cancelable: true });
      const stopPropagationSpy = vi.spyOn(event, "stopPropagation");

      slider.dispatchEvent(event);
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });
