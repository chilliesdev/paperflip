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

// Mock File.prototype.arrayBuffer because JSDOM doesn't implement it
vi.spyOn(File.prototype, "arrayBuffer").mockResolvedValue(new ArrayBuffer(8));

// Hoist all mock functions so they can be used in vi.mock factories
const { mockAddDocument, mockUpsertDocument, mockGetRecentUploads } =
  vi.hoisted(() => {
    const mockAddDocument = vi.fn().mockResolvedValue({});
    const mockUpsertDocument = vi.fn();
    const mockGetRecentUploads = vi.fn().mockResolvedValue([]);

    return {
      mockAddDocument,
      mockUpsertDocument,
      mockGetRecentUploads,
    };
  });

vi.mock("../../lib/database", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/database")>();
  return {
    ...actual,
    addDocument: mockAddDocument,
    upsertDocument: mockUpsertDocument,
    getRecentUploads: mockGetRecentUploads,
  };
});

describe("PdfUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload button", () => {
    render(PdfUploader);
    const button = screen.getByLabelText(/Open PDF/i);
    expect(button).toBeInTheDocument();
  });

  it("handles file upload successfully", async () => {
    // Mock event dispatch functions
    const onPdfParsed = vi.fn();
    const onPdfError = vi.fn();

    render(PdfUploader, {
      onPdfParsed,
      onPdfError,
    });

    const file = new File(["dummy content"], "test.pdf", {
      type: "application/pdf",
    });
    const input = screen.getByLabelText(/Open PDF/i) as HTMLInputElement;

    // Wait for PDF.js to load (input becomes enabled)
    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });

    Object.defineProperty(input, "files", {
      value: [file],
    });
    await fireEvent.change(input);

    // Expect "Processing..." loader
    await waitFor(() => {
      expect(screen.getByText("Processing...")).toBeInTheDocument();
    });

    // Wait for async operations and event dispatch
    await waitFor(() => {
      expect(screen.queryByText("Processing...")).not.toBeInTheDocument();
      expect(screen.getByText("Open PDF")).toBeInTheDocument();
      expect(onPdfParsed).toHaveBeenCalledWith({
        text: "Test Content",
        filename: "test.pdf",
      });
    });
    expect(File.prototype.arrayBuffer).toHaveBeenCalled();
  });
  it("displays recent uploads", async () => {
    const mockUploads = [
      { documentId: "doc1.pdf", createdAt: 1620000000000 },
      { documentId: "doc2.pdf", createdAt: 1620000001000 },
    ];

    mockGetRecentUploads.mockResolvedValue(mockUploads);

    render(PdfUploader);

    await waitFor(() => {
      expect(screen.getByText("Recent")).toBeInTheDocument();
      expect(screen.getByText("doc1.pdf")).toBeInTheDocument();
      expect(screen.getByText("doc2.pdf")).toBeInTheDocument();
    });
  });

  it("dispatches load-document event when clicking recent upload", async () => {
    const mockUploads = [{ documentId: "doc1.pdf", createdAt: 1620000000000 }];

    mockGetRecentUploads.mockResolvedValue(mockUploads);

    const onLoadDocument = vi.fn();

    render(PdfUploader, {
      onLoadDocument,
    });

    await waitFor(() => {
      expect(screen.getByText("doc1.pdf")).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText("doc1.pdf"));

    await waitFor(() => {
      expect(onLoadDocument).toHaveBeenCalledWith({ documentId: "doc1.pdf" });
    });
  });
});
