import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Feed from "../../lib/components/Feed.svelte";

// Mock the audio module
vi.mock("../../lib/audio", () => {
  return {
    initializeTTS: vi.fn(),
    speakText: vi.fn(),
    stopTTS: vi.fn(),
    pauseTTS: vi.fn(),
    resumeTTS: vi.fn(),
    isSpeaking: vi.fn(),
    isPaused: vi.fn(),
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

describe("Feed Performance", () => {
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
  });

  afterEach(() => {
    cleanup();
  });

  it("only renders video elements for segments near the active index", async () => {
    // Generate 10 segments
    const segments = Array.from({ length: 10 }, (_, i) => `Segment ${i}`);

    render(Feed, {
      segments,
      initialIndex: 0,
      documentId: "doc-perf",
    });

    const swiper = screen.getByTestId("swiper-mock");
    mockSwiperInstance.realIndex = 0;
    mockSwiperInstance.activeIndex = 0;

    // Simulate swiper init
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    await waitFor(() => {
      // Initially, we expect index 0, 1, 2 to be rendered.
      // 0 is active. +/- 2 range means 0, 1, 2. (Indices -2, -1 don't exist).
      // So 3 video elements should be present.
      const videos = document.querySelectorAll("video");
      // Current behavior (before fix): 10 videos.
      // Expected behavior (after fix): 3 videos.
      expect(videos.length).toBeLessThanOrEqual(3);
    });

    // Move to index 5
    mockSwiperInstance.realIndex = 5;
    mockSwiperInstance.activeIndex = 5;

    fireEvent(
      swiper,
      new CustomEvent("swiperslidechange", {
        detail: [mockSwiperInstance],
      }),
    );

    await waitFor(() => {
      // Now index 5 is active. Range +/- 2 means 3, 4, 5, 6, 7.
      // So 5 video elements should be present.
      const videos = document.querySelectorAll("video");
      expect(videos.length, `Expected <= 5 videos but found ${videos.length}`).toBeLessThanOrEqual(5);

      // Verify specific segments are present/absent
      // Segment 5 should be present
      expect(document.body.textContent).toMatch(/Segment\s*5/);

      // Segment 0 should be absent (unmounted)
      expect(document.body.textContent).not.toMatch(/Segment\s*0/);
    });
  });
});
