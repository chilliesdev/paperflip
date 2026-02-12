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
vi.mock("../../lib/audio", () => ({
  initializeTTS: vi.fn(),
  speakText: vi.fn(),
  stopTTS: vi.fn(),
  pauseTTS: vi.fn(),
  resumeTTS: vi.fn(),
  isPaused: vi.fn(() => false),
}));

// Mock database module
vi.mock("../../lib/database", () => ({
  updateDocumentProgress: vi.fn(),
}));

// Mock Swiper Element bundle
vi.mock("swiper/element/bundle", () => ({
  register: vi.fn(),
}));

describe("Feed Component Debouncing", () => {
  const mockSwiperInstance = {
    realIndex: 0,
    activeIndex: 0,
    slideTo: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("should debounce database writes on rapid slide changes", async () => {
    const segments = ["Segment 1", "Segment 2", "Segment 3"];
    render(Feed, { segments, documentId: "doc-1" });

    const swiper = screen.getByTestId("swiper-mock");

    // Simulate rapid slide changes
    for (let i = 0; i < 3; i++) {
      mockSwiperInstance.realIndex = i;
      fireEvent(
        swiper,
        new CustomEvent("swiperslidechange", {
          detail: [mockSwiperInstance],
        }),
      );
    }

    // Should not have been called yet due to debounce
    expect(database.updateDocumentProgress).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    // Should have been called exactly once with the last state
    expect(database.updateDocumentProgress).toHaveBeenCalledTimes(1);
    expect(database.updateDocumentProgress).toHaveBeenCalledWith("doc-1", 2, 0);
  });

  it("should save immediately when paused", async () => {
    const segments = ["Segment 1"];
    render(Feed, { segments, documentId: "doc-1" });

    const swiper = screen.getByTestId("swiper-mock");

    // Simulate init to start speech
    mockSwiperInstance.realIndex = 0;
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    // Get the boundary callback to set progress
    const boundaryCallback = vi.mocked(audio.speakText).mock.calls[0][1];
    boundaryCallback("word", 50);

    // Click to pause
    fireEvent.click(swiper);

    // Should have saved immediately, bypassing debounce
    expect(database.updateDocumentProgress).toHaveBeenCalledWith("doc-1", 0, 50);
    expect(database.updateDocumentProgress).toHaveBeenCalledTimes(1);
  });

  it("should save immediately when segment finishes", async () => {
    const segments = ["Segment 1"];
    render(Feed, { segments, documentId: "doc-1" });

    const swiper = screen.getByTestId("swiper-mock");

    // Simulate init
    fireEvent(
      swiper,
      new CustomEvent("swiperinit", {
        detail: [mockSwiperInstance],
      }),
    );

    // Get the onEnd callback
    const onEndCallback = vi.mocked(audio.speakText).mock.calls[0][2];

    // Trigger onEnd
    onEndCallback();

    // Should have saved immediately
    expect(database.updateDocumentProgress).toHaveBeenCalledWith("doc-1", 0, 9);
    expect(database.updateDocumentProgress).toHaveBeenCalledTimes(1);
  });

  it("should save immediately on destroy and clear pending timeouts", async () => {
    const segments = ["Segment 1", "Segment 2"];
    const { unmount } = render(Feed, { segments, documentId: "doc-1" });

    const swiper = screen.getByTestId("swiper-mock");

    // Trigger a debounced save via slide change
    mockSwiperInstance.realIndex = 1;
    fireEvent(
      swiper,
      new CustomEvent("swiperslidechange", {
        detail: [mockSwiperInstance],
      }),
    );

    expect(database.updateDocumentProgress).not.toHaveBeenCalled();

    // Unmount
    unmount();

    // Should have saved immediately on destroy
    expect(database.updateDocumentProgress).toHaveBeenCalledWith("doc-1", 1, 0);
    expect(database.updateDocumentProgress).toHaveBeenCalledTimes(1);

    // Fast-forward time to ensure no extra calls
    vi.advanceTimersByTime(1000);
    expect(database.updateDocumentProgress).toHaveBeenCalledTimes(1);
  });
});
