// @vitest-environment jsdom

import { render, fireEvent, waitFor, screen } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PdfUploader from "../../lib/components/PdfUploader.svelte";
import { addDocument } from "../../lib/database";

// Mock dependencies

vi.mock("uuid", () => ({
  v4: vi.fn(() => "test-uuid"),
}));

vi.mock("../../lib/segmenter", () => ({
  segmentText: vi.fn((_text) => ["segment1"]),
}));

vi.mock("../../lib/database", () => ({
  addDocument: vi.fn(),
}));

describe("PdfUploader Repro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reproduces bug: component calls addDocument directly", async () => {
    render(PdfUploader);

    const file = new File(["dummy content"], "test.pdf", {
      type: "application/pdf",
    });
    const input = screen.getByLabelText("Upload PDF") as HTMLInputElement;

    // Wait for PDF.js to load (input becomes enabled)
    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });

    Object.defineProperty(input, "files", {
      value: [file],
    });
    await fireEvent.change(input);

    // Wait for async operations
    await waitFor(() => {
      expect(screen.queryByText("Parsing...")).not.toBeInTheDocument();
    });

    // The FIX: Component should NOT call addDocument
    expect(addDocument).not.toHaveBeenCalled();
  });
});
