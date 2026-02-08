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

  describe("Progress Display", () => {
    it("TC-LIST-001: Display Granular Progress", async () => {
      // Document A: 10 segments. Current index 4. Progress within segment 5 (halfway).
      // Logic: currentIndex (4) + (currentProgress (5) / segmentLength (10)) = 4.5
      // Total Progress: (4.5 / 10) * 100 = 45%
      const mockUploads = [
        {
          documentId: "doc-granular.pdf",
          segments: new Array(10).fill("1234567890"), // 10 chars each
          currentSegmentIndex: 4,
          currentSegmentProgress: 5,
          createdAt: 1000,
        },
      ];
      mockGetRecentUploads.mockResolvedValue(mockUploads);

      render(PdfUploader);

      await waitFor(() => {
        expect(screen.getByText("doc-granular.pdf")).toBeInTheDocument();
        // Check for "45% watched"
        expect(screen.getByText("45% watched")).toBeInTheDocument();
        // Check progress bar width (approximate check via style)
        const progressBar =
          screen.getByText("45% watched").parentElement?.nextElementSibling
            ?.firstElementChild;
        expect(progressBar).toHaveStyle("width: 45%");
      });
    });

    it("TC-LIST-002: Zero Progress", async () => {
      const mockUploads = [
        {
          documentId: "doc-zero.pdf",
          segments: ["seg1", "seg2"],
          currentSegmentIndex: 0,
          currentSegmentProgress: 0,
          createdAt: 1000,
        },
      ];
      mockGetRecentUploads.mockResolvedValue(mockUploads);

      render(PdfUploader);

      await waitFor(() => {
        expect(screen.getByText("doc-zero.pdf")).toBeInTheDocument();
        expect(screen.getByText("0% watched")).toBeInTheDocument();
        expect(screen.getByText("Part 1 of 2")).toBeInTheDocument();
      });
    });

    it("TC-LIST-003: Completed Document", async () => {
      const mockUploads = [
        {
          documentId: "doc-complete.pdf",
          segments: ["seg1"],
          currentSegmentIndex: 0,
          currentSegmentProgress: 4, // "seg1" is length 4
          createdAt: 1000,
        },
      ];
      mockGetRecentUploads.mockResolvedValue(mockUploads);

      render(PdfUploader);

      await waitFor(() => {
        expect(screen.getByText("doc-complete.pdf")).toBeInTheDocument();
        // 0 + 4/4 = 1. 1/1 * 100 = 100%
        expect(screen.getByText("100% watched")).toBeInTheDocument();
      });
    });
  });
});
