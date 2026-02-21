import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Page from "../../routes/+page.svelte";
import * as database from "../../lib/database";

import * as navigation from "$app/navigation";

// Mock external modules
vi.mock("../../lib/database", () => ({
  getDb: vi.fn(),
  upsertDocument: vi.fn(),
  getRecentUploads: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../lib/segmenter", () => ({
  segmentText: vi.fn((_text) => ["Segment 1", "Segment 2"]),
}));

vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
}));

vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

// Mock PdfUploader component
vi.mock("../../lib/components/PdfUploader.svelte", async () => {
  const MockPdfUploader = (await import("../mocks/MockPdfUploader.svelte"))
    .default;
  return { default: MockPdfUploader };
});

describe("Root Page (+page.svelte)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No need to mock alert anymore
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders PdfUploader initially", () => {
    render(Page);
    expect(screen.getByTestId("mock-uploader")).toBeInTheDocument();
    expect(screen.queryByText("Processing PDF...")).not.toBeInTheDocument();
  });

  it("handles successful PDF parsing flow", async () => {
    render(Page);

    // Trigger parsing via mock button
    fireEvent.click(screen.getByTestId("trigger-parsed"));

    // Check loading state (might be transient, so waitFor)
    await waitFor(() => {
      expect(screen.getByText("Processing PDF...")).toBeInTheDocument();
    });

    await waitFor(() => {
      // Verify database calls
      expect(database.getDb).toHaveBeenCalled();
      expect(database.upsertDocument).toHaveBeenCalledWith("test.pdf", [
        "Segment 1",
        "Segment 2",
      ]);

      // Verify navigation
      expect(navigation.goto).toHaveBeenCalledWith("/feed?id=test.pdf");
    });
  });

  it("handles PDF parsing error (database failure)", async () => {
    // Mock database failure
    (database.upsertDocument as any).mockRejectedValueOnce(
      new Error("DB Error"),
    );

    render(Page);

    fireEvent.click(screen.getByTestId("trigger-parsed"));

    await waitFor(() => {
      // Expect ErrorMessage component to be visible
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to process PDF: DB Error"),
      ).toBeInTheDocument();
    });

    // Should revert loading state
    expect(screen.queryByText("Processing PDF...")).not.toBeInTheDocument();
  });

  it("handles PDF error reported by Uploader", async () => {
    render(Page);

    fireEvent.click(screen.getByTestId("trigger-error"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Error: Mock Error")).toBeInTheDocument();
    });
  });

  it("handles existing document loading", async () => {
    render(Page);

    fireEvent.click(screen.getByTestId("trigger-load"));

    await waitFor(() => {
      expect(navigation.goto).toHaveBeenCalledWith("/feed?id=existing-doc");
    });
  });
});
