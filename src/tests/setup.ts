import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock File.prototype.arrayBuffer globally
Object.defineProperty(File.prototype, "arrayBuffer", {
  writable: true,
  value: vi.fn(() => Promise.resolve(new ArrayBuffer(8))),
});
