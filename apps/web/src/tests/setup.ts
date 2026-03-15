import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined") {
  // Mock File.prototype.arrayBuffer globally
  Object.defineProperty(File.prototype, "arrayBuffer", {
    writable: true,
    value: vi.fn(() => Promise.resolve(new ArrayBuffer(8))),
  });

  // Mock HTMLMediaElement (video/audio)
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    writable: true,
    value: vi.fn(() => Promise.resolve()),
  });

  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    writable: true,
    value: vi.fn(),
  });

  // Mock constants
  vi.mock("$lib/constants", () => ({
    wordCount: 8,
    CHARS_PER_SECOND: 16.6,
    videoSources: [
      {
        url: "https://www.w3schools.com/tags/mov_bbb.mp4",
        previewUrl: "https://example.com/preview1.jpg",
        name: "Test Video 1",
      },
      {
        url: "https://www.w3schools.com/tags/mov_bbb.mp4#t=5",
        previewUrl: "https://example.com/preview2.jpg",
        name: "Test Video 2",
      },
    ],
  }));

  // Mock Web Animations API
  if (!Element.prototype.animate) {
    Object.defineProperty(Element.prototype, "animate", {
      writable: true,
      value: vi.fn(() => ({
        onfinish: () => {},
        cancel: () => {},
        finished: Promise.resolve(),
        play: () => {},
        pause: () => {},
        reverse: () => {},
      })),
    });
  }
}
