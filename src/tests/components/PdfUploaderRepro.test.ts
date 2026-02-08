// @vitest-environment jsdom

import { render, fireEvent, waitFor, screen } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PdfUploader from "../../lib/components/PdfUploader.svelte";
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

describe("PdfUploader Repro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reproduces bug: component calls addDocument directly", async () => {
    render(PdfUploader);

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

    // Wait for async operations
    await waitFor(() => {
      expect(screen.queryByText("Processing...")).not.toBeInTheDocument();
    });

    // The FIX: Component should NOT call addDocument
    expect(mockAddDocument).not.toHaveBeenCalled();
  });
});
