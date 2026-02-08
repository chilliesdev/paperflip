import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

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
