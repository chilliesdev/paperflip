import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Feed from "../../lib/components/Feed.svelte";
import * as audio from "../../lib/audio";
import { isDictationMode } from "../../lib/stores/audio";
import { get } from "svelte/store";

// Mock audio store
vi.mock("../../lib/stores/audio", async (importOriginal) => {
  const actual: any = await importOriginal();
  const { writable } = await import("svelte/store");
  return {
    ...actual,
    isDictationMode: writable(false),
  };
});

// Mock segmenter
vi.mock("../../lib/segmenter", () => ({
  splitSentences: vi.fn((text) => {
    if (text === "Sentence 1. Sentence 2.") {
      return [
        { text: "Sentence 1.", start: 0, end: 11 },
        { text: "Sentence 2.", start: 12, end: 23 },
      ];
    }
    return [{ text, start: 0, end: text.length }];
  }),
}));

// Mock audio
vi.mock("../../lib/audio", () => {
  return {
    initializeTTS: vi.fn(),
    speakText: vi.fn(),
    stopTTS: vi.fn(),
    pauseTTS: vi.fn(),
    resumeTTS: vi.fn(),
    isSpeaking: vi.fn(() => true),
    isPaused: vi.fn(() => false),
    resetTTS: vi.fn(),
  };
});

// Mock database module
vi.mock("../../lib/database", () => ({
  updateDocumentProgress: vi.fn(),
}));

// Mock Swiper Element bundle
vi.mock("swiper/element/bundle", () => ({
  register: vi.fn(),
}));

// Mock Swiper modules
vi.mock("swiper", () => ({
  Mousewheel: {},
}));

describe("Feed Dictation Mode", () => {
  const mockSwiperInstance: any = {
    realIndex: 0,
    activeIndex: 0,
    slides: [],
    previousIndex: null,
    slideTo: vi.fn(),
    slideNext: vi.fn(),
    slidePrev: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockSwiperInstance.realIndex = 0;
    mockSwiperInstance.activeIndex = 0;
    isDictationMode.set(false);
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("Switches to Dictation Mode when boundary events are missing", async () => {
    const segments = ["Test Segment"];
    render(Feed, { segments });

    const swiper = screen.getByTestId("swiper-mock");
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    // Should start with speakText (Karaoke mode)
    expect(audio.speakText).toHaveBeenCalledWith(
      "Test Segment",
      expect.any(Function),
      expect.any(Function),
      0,
    );

    // Verify we are NOT in dictation mode yet
    expect(get(isDictationMode)).toBe(false);

    // Fast forward time to trigger timeout (1500ms)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Check if switched to Dictation Mode
    expect(get(isDictationMode)).toBe(true);
    expect(audio.stopTTS).toHaveBeenCalled();

    // Verify speakText called again (restart in Dictation mode)
    // The previous call was 1. New call should be 2.
    expect(audio.speakText).toHaveBeenCalledTimes(2);
  });

  it("Does NOT switch to Dictation Mode if boundary events fire", async () => {
    const segments = ["Test Segment"];
    render(Feed, { segments });

    const swiper = screen.getByTestId("swiper-mock");
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    expect(audio.speakText).toHaveBeenCalledTimes(1);

    // Get the boundary callback
    const boundaryCallback = (audio.speakText as any).mock.calls[0][1];

    // Fire a boundary event before timeout
    await act(async () => {
      boundaryCallback("Test", 0);
    });

    // Fast forward time past timeout
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Should still be false
    expect(get(isDictationMode)).toBe(false);
    // Should NOT have called speakText again
    expect(audio.speakText).toHaveBeenCalledTimes(1);
  });

  it("Plays sentences sequentially in Dictation Mode", async () => {
    isDictationMode.set(true); // Force dictation mode
    const segments = ["Sentence 1. Sentence 2."];
    render(Feed, { segments });

    const swiper = screen.getByTestId("swiper-mock");
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    // 1. Should call speakText for first sentence
    expect(audio.speakText).toHaveBeenCalledWith(
      "Sentence 1.",
      expect.any(Function), // Boundary callback added
      expect.any(Function), // OnEnd
      0, // Offset
    );

    // Get the onEnd callback for the first sentence
    const onEnd1 = (audio.speakText as any).mock.calls[0][2];

    // Trigger end of first sentence
    await act(async () => {
      onEnd1();
    });

    // 2. Should call speakText for second sentence
    expect(audio.speakText).toHaveBeenCalledTimes(2);
    expect(audio.speakText).toHaveBeenLastCalledWith(
      "Sentence 2.",
      expect.any(Function),
      expect.any(Function),
      0,
    );
  });
});
