import { render, screen, cleanup } from "@testing-library/svelte";
import FeedSlide from "../../lib/components/FeedSlide.svelte";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { videoAssetUrls } from "../../lib/stores/assets";

// Mock dependencies
vi.mock("../../lib/stores/assets", async () => {
  const { writable } = await import("svelte/store");
  return {
    videoAssetUrls: writable({}),
  };
});

vi.mock("../../lib/stores/audio", async () => {
  const { writable } = await import("svelte/store");
  return {
    isMuted: writable(false),
  };
});

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
window.HTMLMediaElement.prototype.pause = vi.fn();

describe("FeedSlide Karaoke Mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    videoAssetUrls.set({});
  });

  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    segment: "Hello world. This is a second sentence.",
    isActive: true,
    isPlaying: true,
    currentCharIndex: -1,
    videoSource: "http://example.com/video.mp4",
  };

  it("shows the first sentence initially (when index is -1)", () => {
    render(FeedSlide, { ...defaultProps });

    // "Hello world."
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("world.")).toBeInTheDocument();

    // "This is a second sentence." should NOT be visible
    expect(screen.queryByText("This")).not.toBeInTheDocument();
  });

  it("shows the first sentence when playing within its range", () => {
    // "Hello" (0-5), "world." (6-12). Sentence 1 ends around 13 (with space).
    render(FeedSlide, { ...defaultProps, currentCharIndex: 5 }); // End of "Hello"

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("world.")).toBeInTheDocument();
    expect(screen.queryByText("This")).not.toBeInTheDocument();
  });

  it("switches to the second sentence when index crosses boundary", () => {
    // "This" starts at 13.
    render(FeedSlide, { ...defaultProps, currentCharIndex: 15 });

    expect(screen.queryByText("Hello")).not.toBeInTheDocument();
    expect(screen.getByText("This")).toBeInTheDocument();
    expect(screen.getByText("sentence.")).toBeInTheDocument();
  });

  it("highlights the current word correctly", () => {
    // "Hello" is 0-5. Index 2 is inside "Hello".
    render(FeedSlide, { ...defaultProps, currentCharIndex: 2 });

    const hello = screen.getByText("Hello");
    // active class has 'text-brand-primary'
    expect(hello).toHaveClass("text-brand-primary");

    const world = screen.getByText("world.");
    expect(world).not.toHaveClass("text-brand-primary");
  });

  describe("Edge Cases", () => {
    it("handles index beyond the end of text by showing the last sentence", () => {
      // Segment length is roughly 40 chars. Index 100 is way past end.
      render(FeedSlide, { ...defaultProps, currentCharIndex: 100 });

      // Should show last sentence: "This is a second sentence."
      expect(screen.getByText("This")).toBeInTheDocument();
      expect(screen.getByText("sentence.")).toBeInTheDocument();

      // Should NOT show first sentence
      expect(screen.queryByText("Hello")).not.toBeInTheDocument();
    });

    it("handles single word segment correctly", () => {
      render(FeedSlide, {
        ...defaultProps,
        segment: "SingleWordOnly",
        currentCharIndex: 5,
      });

      expect(screen.getByText("SingleWordOnly")).toBeInTheDocument();
    });

    it("handles segment with just punctuation", () => {
      render(FeedSlide, {
        ...defaultProps,
        segment: "...",
        currentCharIndex: 1,
      });

      expect(screen.getByText("...")).toBeInTheDocument();
    });

    it("handles empty segment gracefully", () => {
      render(FeedSlide, { ...defaultProps, segment: "", currentCharIndex: 0 });

      // Should render nothing inside the text container
      const container = document.querySelector(".backdrop-blur-xl");
      expect(container).toBeInTheDocument();
      expect(container?.textContent?.trim()).toBe("");
    });

    it("handles trailing spaces correctly (part of previous sentence)", () => {
      // "First.   Second."
      // "First.   " is usually sentence 1.
      const segment = "First.   Second.";
      // Index in the spaces. "First." length 6. Spaces at 6,7,8.
      render(FeedSlide, { ...defaultProps, segment, currentCharIndex: 7 });

      expect(screen.getByText("First.")).toBeInTheDocument();
      expect(screen.queryByText("Second.")).not.toBeInTheDocument();
    });
  });
});
