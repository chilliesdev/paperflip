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
  return {
    initializeTTS: vi.fn(),
    speakText: vi.fn(() => {
      speaking = true;
    }),
    stopTTS: vi.fn(() => {
      speaking = false;
    }),
    pauseTTS: vi.fn(() => {
      speaking = false;
    }),
    resumeTTS: vi.fn(() => {
      speaking = true;
    }),
    isSpeaking: vi.fn(() => speaking),
    resetTTS: vi.fn(() => {
      speaking = false;
    }),
    // Helper to manually set state for testing
    __setSpeaking: (val: boolean) => {
      speaking = val;
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

// Mock HammerJS (dynamic import)
const hammerHandlers: Record<string, (...args: any[]) => void> = {};
const hammerMockInstance = {
  on: vi.fn((event, handler) => {
    hammerHandlers[event] = handler;
  }),
  off: vi.fn(),
  destroy: vi.fn(),
  add: vi.fn(),
  get: vi.fn(() => ({
    recognizeWith: vi.fn(),
    requireFailure: vi.fn(),
  })),
  // Helper to trigger events
  __trigger: (event: string) => {
    if (hammerHandlers[event]) {
      hammerHandlers[event]();
    }
  },
};

// Use a class for the default export to support 'new Hammer()'
class HammerMock {
  constructor() {
    return hammerMockInstance;
  }
  static Tap = vi.fn();
}

vi.mock("hammerjs", () => ({
  default: HammerMock,
}));

describe("Feed Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear handlers
    for (const key in hammerHandlers) delete hammerHandlers[key];

    // Reset video element mocks if necessary
    HTMLMediaElement.prototype.play = vi.fn();
    HTMLMediaElement.prototype.pause = vi.fn();
    (audio as any).__setSpeaking(false);
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

    // Check video source
    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute(
      "src",
      "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-1.mp4",
    );

    // Check that slides are rendered
    const slides = screen.getAllByTestId("swiper-slide-mock");
    expect(slides).toHaveLength(2);
    expect(slides[0]).toHaveTextContent("Segment 1");
    expect(slides[1]).toHaveTextContent("Segment 2");
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

    // Verify play() was called during init
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    // Wait for Hammer to be initialized
    await waitFor(() => {
      expect(hammerMockInstance.on).toHaveBeenCalledWith(
        "singletap",
        expect.any(Function),
      );
    });

    // Now speaking is true because speakText was called
    expect(audio.isSpeaking()).toBe(true);

    // Reset mocks to ensure we are testing the toggle
    (HTMLMediaElement.prototype.play as any).mockClear();
    (HTMLMediaElement.prototype.pause as any).mockClear();

    // Trigger single tap -> Pause
    hammerMockInstance.__trigger("singletap");

    await waitFor(() => {
      expect(audio.pauseTTS).toHaveBeenCalled();
      expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });
    expect(audio.isSpeaking()).toBe(false);

    // Trigger single tap -> Resume
    hammerMockInstance.__trigger("singletap");

    await waitFor(() => {
      expect(audio.resumeTTS).toHaveBeenCalled();
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });
    expect(audio.isSpeaking()).toBe(true);
  });

  it("cycles video on double tap", async () => {
    const segments = ["Test Segment"];
    render(Feed, { segments });

    // Wait for mount
    await waitFor(() => expect(audio.speakText).toHaveBeenCalled());

    // Wait for Hammer to be initialized
    await waitFor(() => {
      expect(hammerMockInstance.on).toHaveBeenCalledWith(
        "doubletap",
        expect.any(Function),
      );
    });

    const video = document.querySelector("video");
    expect(video).toHaveAttribute(
      "src",
      "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-1.mp4",
    );

    // Trigger double tap -> Next video
    hammerMockInstance.__trigger("doubletap");

    // Re-query or wait for update
    await waitFor(() => {
      expect(video).toHaveAttribute(
        "src",
        "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-2.mp4",
      );
    });

    // Trigger double tap -> Back to first video (since only 2 in array)
    hammerMockInstance.__trigger("doubletap");

    await waitFor(() => {
      expect(video).toHaveAttribute(
        "src",
        "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-1.mp4",
      );
    });
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

    // Simulate word boundary for "Hello"
    boundaryCallback("Hello");

    // Wait for update
    await waitFor(() => {
      const helloSpan = screen.getByText("Hello");
      expect(helloSpan.tagName).toBe("SPAN");
      expect(helloSpan).toHaveClass("bg-[yellow]");
    });
  });
});
