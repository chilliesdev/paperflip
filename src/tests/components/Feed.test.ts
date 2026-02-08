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
    speakText: vi.fn(() => {
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

// Mock Swiper
vi.mock("swiper/svelte", async () => {
  const MockSwiper = (await import("../mocks/MockSwiper.svelte")).default;
  const MockSwiperSlide = (await import("../mocks/MockSwiperSlide.svelte"))
    .default;
  return { Swiper: MockSwiper, SwiperSlide: MockSwiperSlide };
});

// Mock Swiper modules
vi.mock("swiper", () => ({
  Mousewheel: {},
}));

describe("Feed Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear handlers

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
    expect(slides[0]).toHaveTextContent(/Short 1 \/ 2/);
    expect(slides[0]).toHaveTextContent(/Segment\s*1/);
    expect(slides[1]).toHaveTextContent(/Short 2 \/ 2/);
    expect(slides[1]).toHaveTextContent(/Segment\s*2/);
  });

  it("initializes TTS on mount", async () => {
    render(Feed, { segments: ["Test"] });
    expect(audio.initializeTTS).toHaveBeenCalled();
  });

  it("starts speaking first segment on mount", async () => {
    const segments = ["First Segment"];
    render(Feed, { segments });

    await waitFor(() => {
      expect(audio.speakText).toHaveBeenCalledWith(
        "First Segment",
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

    // Wait for mount and audio to start
    await waitFor(() => expect(audio.speakText).toHaveBeenCalled());

    // Verify play() was called during init (on the video element)
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    // Now speaking is true because speakText was called
    expect(audio.isSpeaking()).toBe(true);

    // Reset mocks to ensure we are testing the toggle
    (HTMLMediaElement.prototype.play as any).mockClear();
    (HTMLMediaElement.prototype.pause as any).mockClear();

    const swiper = screen.getByTestId("swiper-mock");

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

    // Wait for initial speech
    await waitFor(() =>
      expect(audio.speakText).toHaveBeenCalledWith(
        "Segment 1",
        expect.any(Function),
      ),
    );

    const swiper = screen.getByTestId("swiper-mock");

    // Reset mocks to check new calls
    (audio.speakText as any).mockClear();
    (audio.stopTTS as any).mockClear();

    // Simulate slide change to index 1
    const event = new CustomEvent("test-slide-change", {
      detail: { index: 1 },
    });
    fireEvent(swiper, event);

    await waitFor(() => {
      expect(audio.stopTTS).toHaveBeenCalled();
      expect(audio.speakText).toHaveBeenCalledWith(
        "Segment 2",
        expect.any(Function),
      );
    });
  });

  it("highlights the spoken word", async () => {
    const segments = ["Hello world"];
    render(Feed, { segments });

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
});
