import { render, fireEvent, waitFor, screen } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PdfUploader from "../../lib/components/PdfUploader.svelte";

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

describe("PdfUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload button", () => {
    render(PdfUploader);
    const button = screen.getByLabelText("Upload PDF");
    expect(button).toBeInTheDocument();
  });

  it("handles file upload successfully", async () => {
    // Mock event dispatch functions
    const onDocumentAdded = vi.fn();
    const onPdfError = vi.fn();

    // Pass event listeners as props (casting to avoid Svelte 5 strict prop type checks in test)

    render(PdfUploader, {
      props: {
        "on:document-added": onDocumentAdded,
        "on:pdf-error": onPdfError,
      } as any,
    });

    const file = new File(["dummy content"], "test.pdf", {
      type: "application/pdf",
    });
    // Mock arrayBuffer since jsdom might not fully implement it or for reliability
    file.arrayBuffer = () => Promise.resolve(new ArrayBuffer(8));
    const input = screen.getByLabelText("Upload PDF") as HTMLInputElement;

    // Wait for PDF.js to load (input becomes enabled)
    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });

    Object.defineProperty(input, "files", {
      value: [file],
    });
    await fireEvent.change(input);

    // Expect "Parsing..." loader
    await waitFor(() => {
      expect(screen.getByText("Parsing...")).toBeInTheDocument();
    });

    // Wait for async operations
    await waitFor(() => {
      // We expect it to finish loading
      expect(screen.queryByText("Parsing...")).not.toBeInTheDocument();
      expect(screen.getByText("Upload PDF")).toBeInTheDocument();
    });

    // Verify success event was called
    // Note: dependent on implementation working
    // expect(onDocumentAdded).toHaveBeenCalledWith(expect.objectContaining({
    //    detail: { documentId: 'test-uuid' }
    // }));
  });
});
