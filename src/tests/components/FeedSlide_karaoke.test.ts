import { render, screen } from "@testing-library/svelte";
import FeedSlide from "$lib/components/FeedSlide.svelte";
import { vi, describe, it, expect } from "vitest";
import { videoAssetUrls } from "$lib/stores/assets";

// Mock dependencies
vi.mock("$lib/stores/assets", () => ({
  videoAssetUrls: {
    subscribe: (fn: (val: Record<string, string>) => void) => {
      fn({});
      return () => {};
    },
  },
}));

vi.mock("$lib/stores/audio", () => ({
  isMuted: {
    subscribe: (fn: (val: boolean) => void) => {
      fn(false);
      return () => {};
    },
  },
}));

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
window.HTMLMediaElement.prototype.pause = vi.fn();

describe("FeedSlide Karaoke Mode", () => {
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
    // note: "world." might be split differently depending on regex but usually punctuation stays
    // The word regex /\S+/g keeps punctuation attached to word if no space.
    // "world." matches /\S+/
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
});
