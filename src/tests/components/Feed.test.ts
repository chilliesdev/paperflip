import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Feed from "../../lib/components/Feed.svelte";
import * as audio from "../../lib/audio";
import * as database from "../../lib/database";

// Mock the audio module
vi.mock("../../lib/audio", () => {
  let speaking = false;
  let paused = false;
  let initialized = false;

  return {
    initializeTTS: vi.fn(() => {
      initialized = true;
    }),
    speakText: vi.fn((text, onBoundary, onEnd) => {
      if (!initialized) {
        console.warn("SpeechSynthesis not initialized.");
        return;
      }
      speaking = true;
      paused = false;
    }),
    stopTTS: vi.fn(() => {
      speaking = false;
      paused = false;
    }),
    pauseTTS: vi.fn(() => {
      // In reality, speaking remains true when paused
      if (speaking) {
        paused = true;
      }
    }),
    resumeTTS: vi.fn(() => {
      if (speaking && paused) {
        paused = false;
      }
    }),
    isSpeaking: vi.fn(() => speaking),
    isPaused: vi.fn(() => paused),
    resetTTS: vi.fn(() => {
      speaking = false;
      paused = false;
      initialized = false;
    }),
    // Helper to manually set state for testing
    __setSpeaking: (val: boolean) => {
      speaking = val;
    },
    __setPaused: (val: boolean) => {
      paused = val;
    },
    __setInitialized: (val: boolean) => {
      initialized = val;
    },
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

describe("Feed Component", () => {
  const mockSwiperInstance = {
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
    mockSwiperInstance.realIndex = 0;
    mockSwiperInstance.activeIndex = 0;

    // Reset video element mocks if necessary
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    HTMLMediaElement.prototype.pause = vi.fn();
    (audio as any).__setSpeaking(false);
    (audio as any).__setPaused(false);
    (audio as any).__setInitialized(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("TC-FEED-001: Initialize with Saved Progress", async () => {
    const segments = ["Segment 0", "Segment 1", "Segment 2"];
    render(Feed, {
      segments,
      initialIndex: 2,
      initialProgress: 50,
      documentId: "doc-1",
    });

    const swiper = screen.getByTestId("swiper-mock");
    // Simulate swiper init with index 2
    mockSwiperInstance.activeIndex = 2;
    mockSwiperInstance.realIndex = 2;
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    await waitFor(() => {
      // Should speak "Segment 2" starting from index 50
      expect(audio.speakText).toHaveBeenCalledWith(
        "Segment 2",
        expect.any(Function),
        expect.any(Function),
        50,
      );
    });
  });

  it("TC-FEED-002: Save on Pause", async () => {
    const segments = ["Segment 1"];
    render(Feed, { segments, documentId: "doc-1" });

    const swiper = screen.getByTestId("swiper-mock");
    mockSwiperInstance.realIndex = 0;
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    await waitFor(() => expect(audio.speakText).toHaveBeenCalled());

    // Get callback to simulate progress
    const mockCalls = (audio.speakText as any).mock.calls;
    const boundaryCallback = mockCalls[mockCalls.length - 1][1];

    // Simulate reaching char index 100
    boundaryCallback("word", 100);

    // Click to pause (toggle)
    fireEvent.click(swiper);

    await waitFor(() => {
      expect(audio.pauseTTS).toHaveBeenCalled();
      expect(database.updateDocumentProgress).toHaveBeenCalledWith(
        "doc-1",
        0,
        100,
      );
    });
  });

  it("TC-FEED-003: Save on Slide Change", async () => {
    vi.useFakeTimers();
    const segments = ["Segment 1", "Segment 2"];
    render(Feed, { segments, documentId: "doc-1" });

    const swiper = screen.getByTestId("swiper-mock");
    mockSwiperInstance.realIndex = 0;
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    await waitFor(() =>
      expect(audio.speakText).toHaveBeenCalledWith(
        "Segment 1",
        expect.any(Function),
        expect.any(Function),
        expect.any(Number),
      ),
    );

    // Reset calls
    (database.updateDocumentProgress as any).mockClear();
    (audio.stopTTS as any).mockClear();

    // Swipe to slide 2 (index 1)
    mockSwiperInstance.realIndex = 1;
    fireEvent(
      swiper,
      new CustomEvent("swiperslidechange", {
        detail: [mockSwiperInstance],
      }),
    );

    // Advance timers to trigger debounce
    vi.advanceTimersByTime(1100);

    await waitFor(() => {
      // 1. Should save progress for new slide (index=1, progress=0)
      // Note: Implementation details show it saves the NEW index with 0 progress.
      expect(database.updateDocumentProgress).toHaveBeenCalledWith(
        "doc-1",
        1,
        0,
      );

      // 2. TTS stops for slide 1 and starts for slide 2 from beginning
      expect(audio.stopTTS).toHaveBeenCalled();
      expect(audio.speakText).toHaveBeenCalledWith(
        "Segment 2",
        expect.any(Function),
        expect.any(Function),
        0, // Starts from 0
      );
    });
  });

  it("TC-FEED-004: Save on Unmount", async () => {
    const segments = ["Segment 1", "Segment 2", "Segment 3"];
    // Starting at slide 3 (index 2)
    const { unmount } = render(Feed, {
      segments,
      initialIndex: 2,
      documentId: "doc-1",
    });

    const swiper = screen.getByTestId("swiper-mock");
    mockSwiperInstance.realIndex = 2;
    mockSwiperInstance.activeIndex = 2;
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    await waitFor(() => expect(audio.speakText).toHaveBeenCalled());

    // Get callback and simulate progress
    const mockCalls = (audio.speakText as any).mock.calls;
    const boundaryCallback = mockCalls[mockCalls.length - 1][1];
    boundaryCallback("word", 25);

    // Unmount
    unmount();

    // Should call updateDocumentProgress with last known index and progress
    expect(database.updateDocumentProgress).toHaveBeenCalledWith(
      "doc-1",
      2,
      25,
    );
  });

  it("TC-FEED-005: Resume Only Once", async () => {
    const segments = ["Segment 0", "Segment 1"];
    render(Feed, {
      segments,
      initialIndex: 0,
      initialProgress: 50,
      documentId: "doc-1",
    });

    const swiper = screen.getByTestId("swiper-mock");
    mockSwiperInstance.realIndex = 0;
    mockSwiperInstance.activeIndex = 0;
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    // 1. First play of slide 0 starts at 50
    await waitFor(() => {
      expect(audio.speakText).toHaveBeenCalledWith(
        "Segment 0",
        expect.any(Function),
        expect.any(Function),
        50,
      );
    });

    // Reset calls
    (audio.speakText as any).mockClear();

    // Swipe to slide 1
    mockSwiperInstance.realIndex = 1;
    fireEvent(
      swiper,
      new CustomEvent("swiperslidechange", {
        detail: [mockSwiperInstance],
      }),
    );

    await waitFor(() => {
      expect(audio.speakText).toHaveBeenCalledWith(
        "Segment 1",
        expect.any(Function),
        expect.any(Function),
        0,
      );
    });

    // Reset calls
    (audio.speakText as any).mockClear();

    // Swipe back to slide 0
    mockSwiperInstance.realIndex = 0;
    fireEvent(
      swiper,
      new CustomEvent("swiperslidechange", {
        detail: [mockSwiperInstance],
      }),
    );

    // 2. Second play of slide 0 starts at 0 (beginning)
    await waitFor(() => {
      expect(audio.speakText).toHaveBeenCalledWith(
        "Segment 0",
        expect.any(Function),
        expect.any(Function),
        0, // Should be 0, not 50
      );
    });
  });

  it("renders 'Upload a PDF' message when segments are empty", () => {
    render(Feed, { segments: [] });
    expect(
      screen.getByText("Upload a PDF to see the feed!"),
    ).toBeInTheDocument();
  });

  it("renders video and swiper when segments are provided", async () => {
    const segments = ["Segment 1", "Segment 2"];
    render(Feed, { segments });

    expect(
      screen.queryByText("Upload a PDF to see the feed!"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("swiper-mock")).toBeInTheDocument();

    // Check video source - now multiple videos
    const videos = document.querySelectorAll("video");
    expect(videos).toHaveLength(2);
    expect(videos[0]).toHaveAttribute(
      "src",
      "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-1.mp4",
    );
    expect(videos[1]).toHaveAttribute(
      "src",
      "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-2.mp4",
    );

    // Check that slides are rendered
    const slides = screen.getAllByTestId("swiper-slide-mock");
    expect(slides).toHaveLength(2);
    expect(slides[0]).toHaveTextContent(/Segment\s*1/);
    expect(slides[1]).toHaveTextContent(/Segment\s*2/);

    // Check fixed page indicator
    expect(screen.getByText(/Short 1 \/ 2/)).toBeInTheDocument();
  });

  it("initializes TTS on mount", async () => {
    render(Feed, { segments: ["Test"] });
    expect(audio.initializeTTS).toHaveBeenCalled();
  });

  it("starts speaking first segment on mount", async () => {
    const segments = ["First Segment"];
    render(Feed, { segments });

    const swiper = screen.getByTestId("swiper-mock");
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    await waitFor(() => {
      expect(audio.speakText).toHaveBeenCalledWith(
        "First Segment",
        expect.any(Function),
        expect.any(Function),
        expect.any(Number),
      );
    });
  });

  it("stops TTS on destroy", () => {
    const { unmount } = render(Feed, { segments: ["Test"] });
    unmount();
    expect(audio.stopTTS).toHaveBeenCalled();
  });

  it("toggles playback on single tap", async () => {
    const segments = ["Test Segment"];
    render(Feed, { segments });

    const swiper = screen.getByTestId("swiper-mock");
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    // Wait for mount and audio to start
    await waitFor(() => expect(audio.speakText).toHaveBeenCalled());

    // Verify play() was called during init (on the video element)
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    // Now speaking is true because speakText was called
    expect(audio.isSpeaking()).toBe(true);

    // Reset mocks to ensure we are testing the toggle
    (HTMLMediaElement.prototype.play as any).mockClear();
    (HTMLMediaElement.prototype.pause as any).mockClear();

    // Click -> Expect Toggle (after delay)
    fireEvent.click(swiper);

    await waitFor(() => {
      expect(audio.pauseTTS).toHaveBeenCalled();
      expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });
    // With new mock logic, speaking remains true, but paused becomes true
    expect(audio.isSpeaking()).toBe(true);
    expect(audio.isPaused()).toBe(true);

    // Click again -> Expect Resume
    fireEvent.click(swiper);

    await waitFor(() => {
      expect(audio.resumeTTS).toHaveBeenCalled();
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });
    expect(audio.isSpeaking()).toBe(true);
    expect(audio.isPaused()).toBe(false);
  });

  it("changes slide and speaks new segment", async () => {
    vi.useFakeTimers();
    const segments = ["Segment 1", "Segment 2"];
    render(Feed, { segments });

    const swiper = screen.getByTestId("swiper-mock");
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    // Wait for initial speech
    await waitFor(() =>
      expect(audio.speakText).toHaveBeenCalledWith(
        "Segment 1",
        expect.any(Function),
        expect.any(Function),
        expect.any(Number),
      ),
    );

    // Reset mocks to check new calls
    (audio.speakText as any).mockClear();
    (audio.stopTTS as any).mockClear();

    // Simulate slide change to index 1
    mockSwiperInstance.realIndex = 1;
    fireEvent(
      swiper,
      new CustomEvent("swiperslidechange", {
        detail: [mockSwiperInstance],
      }),
    );

    // Advance timers
    vi.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(audio.stopTTS).toHaveBeenCalled();
      expect(audio.speakText).toHaveBeenCalledWith(
        "Segment 2",
        expect.any(Function),
        expect.any(Function),
        expect.any(Number),
      );
      // Indicator should update
      expect(screen.getByText(/Short 2 \/ 2/)).toBeInTheDocument();
    });
  });

  it("highlights the spoken word", async () => {
    const segments = ["Hello world"];
    render(Feed, { segments });

    const swiper = screen.getByTestId("swiper-mock");
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    await waitFor(() => expect(audio.speakText).toHaveBeenCalled());

    // Get the callback passed to speakText
    const mockCalls = (audio.speakText as any).mock.calls;
    const lastCall = mockCalls[mockCalls.length - 1];
    const boundaryCallback = lastCall[1];

    expect(boundaryCallback).toBeTypeOf("function");

    // Simulate callback with charIndex. The component uses charIndex to highlight.
    // "Hello" is at index 0
    boundaryCallback("Hello", 0);

    // Wait for update
    await waitFor(() => {
      const helloSpan = screen.getByText("Hello");
      expect(helloSpan.tagName).toBe("SPAN");
      expect(helloSpan).toHaveClass("text-brand-primary");
    });
  });

  it("pauses video when speech ends", async () => {
    const segments = ["Test segment"];
    render(Feed, { segments });

    const swiper = screen.getByTestId("swiper-mock");
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    await waitFor(() => expect(audio.speakText).toHaveBeenCalled());

    // Verify video is playing
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    // Get the onEnd callback
    const mockCalls = (audio.speakText as any).mock.calls;
    const onEndCallback = mockCalls[0][2];
    expect(onEndCallback).toBeTypeOf("function");

    // Reset play/pause mocks
    (HTMLMediaElement.prototype.play as any).mockClear();
    (HTMLMediaElement.prototype.pause as any).mockClear();

    // Trigger onEnd
    onEndCallback();

    // Verify video is paused
    await waitFor(() => {
      expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });
  });

  it("TC-FEED-006: Save 100% progress on segment end", async () => {
    const segments = ["Segment 1"];
    render(Feed, { segments, documentId: "doc-1" });

    const swiper = screen.getByTestId("swiper-mock");
    mockSwiperInstance.realIndex = 0;
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    await waitFor(() => expect(audio.speakText).toHaveBeenCalled());

    // Get the onEnd callback
    const mockCalls = (audio.speakText as any).mock.calls;
    const onEndCallback = mockCalls[0][2];

    // Trigger onEnd
    onEndCallback();

    // Should save 100% progress (length of "Segment 1" is 9)
    await waitFor(() => {
      expect(database.updateDocumentProgress).toHaveBeenCalledWith(
        "doc-1",
        0,
        9,
      );
    });
  });

  it("TC-FEED-007: Debounce Progress Save", async () => {
    vi.useFakeTimers();
    const segments = ["Segment 1", "Segment 2", "Segment 3"];
    render(Feed, { segments, documentId: "doc-1" });

    const swiper = screen.getByTestId("swiper-mock");
    mockSwiperInstance.realIndex = 0;
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    // Initial load triggers speakText
    await waitFor(() => expect(audio.speakText).toHaveBeenCalled());

    // Clear initial calls
    (database.updateDocumentProgress as any).mockClear();

    // Swipe rapidly: 0 -> 1 -> 2
    mockSwiperInstance.realIndex = 1;
    fireEvent(
      swiper,
      new CustomEvent("swiperslidechange", {
        detail: [mockSwiperInstance],
      }),
    );

    mockSwiperInstance.realIndex = 2;
    fireEvent(
      swiper,
      new CustomEvent("swiperslidechange", {
        detail: [mockSwiperInstance],
      }),
    );

    // Should NOT have called updateDocumentProgress yet
    expect(database.updateDocumentProgress).not.toHaveBeenCalled();

    // Fast-forward time by 500ms (less than debounce)
    vi.advanceTimersByTime(500);
    expect(database.updateDocumentProgress).not.toHaveBeenCalled();

    // Fast-forward time by another 600ms (total 1100ms)
    vi.advanceTimersByTime(600);

    // Should have called updateDocumentProgress ONCE with the FINAL state
    expect(database.updateDocumentProgress).toHaveBeenCalledTimes(1);
    expect(database.updateDocumentProgress).toHaveBeenCalledWith(
      "doc-1",
      2, // Final index
      0,
    );
  });

  it("TC-FEED-008: Sets progress to 100% when playback finishes", async () => {
    const segments = ["Hello world"]; // Length 11
    render(Feed, { segments, documentId: "doc-1" });

    const swiper = screen.getByTestId("swiper-mock");
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    // Wait for speakText to be called
    await waitFor(() => expect(audio.speakText).toHaveBeenCalled());

    // Get the onEnd callback
    const mockCalls = (audio.speakText as any).mock.calls;
    const onEndCallback = mockCalls[0][2];
    expect(onEndCallback).toBeTypeOf("function");

    // Trigger onEnd
    onEndCallback();

    // Now check the progress bar width.
    await waitFor(() => {
      const progressBar = document.querySelector(".bg-gradient-to-r");
      expect(progressBar).not.toBeNull();
      const style = progressBar?.getAttribute("style");
      expect(style).toContain("width: 100%");
    });
  });
});
