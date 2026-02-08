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

    await waitFor(() => {
      expect(audio.stopTTS).toHaveBeenCalled();
      expect(audio.speakText).toHaveBeenCalledWith(
        "Segment 2",
        expect.any(Function),
        expect.any(Function),
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
      expect(helloSpan).toHaveClass("text-[#00ff88]");
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
});
