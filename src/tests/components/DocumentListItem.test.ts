import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import DocumentListItem from "../../lib/components/DocumentListItem.svelte";

vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

describe("DocumentListItem", () => {
  const mockDocument = {
    documentId: "Test Document.pdf",
    segments: ["A", "B", "C", "D"],
    currentSegmentIndex: 1, // 25% progress
    timestamp: Date.now(),
  };

  it("renders document title and info", () => {
    render(DocumentListItem, { document: mockDocument });
    expect(screen.getByText("Test Document.pdf")).toBeInTheDocument();
    expect(screen.getByText("4 segments • PDF")).toBeInTheDocument();
  });

  it("calculates progress correctly", () => {
    // 1 / 4 = 25%
    render(DocumentListItem, { document: mockDocument });
    // Since progress is visual (width %), we can check the style or ensure no errors
    const progressBar = screen
      .getByText("Test Document.pdf")
      .parentElement?.parentElement?.nextElementSibling?.querySelector(
        "[style]"
      );
    expect(progressBar).toHaveStyle("width: 25%");
  });

  it("renders with 0 segments gracefully", () => {
    const emptyDoc = { ...mockDocument, segments: [] };
    render(DocumentListItem, { document: emptyDoc });
    expect(screen.getByText("0 segments • PDF")).toBeInTheDocument();
  });
});
