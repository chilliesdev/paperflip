import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import DocumentGridItem from "../../lib/components/DocumentGridItem.svelte";

vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

describe("DocumentGridItem", () => {
  const mockDocument = {
    documentId: "Grid Doc.pdf",
    segments: ["A", "B", "C", "D", "E"],
    currentSegmentIndex: 2, // 3/5 = 60%
    timestamp: Date.now(),
  };

  it("renders document title and info", () => {
    render(DocumentGridItem, { document: mockDocument });
    expect(screen.getByText("Grid Doc.pdf")).toBeInTheDocument();
    expect(screen.getByText("5 Segments • PDF")).toBeInTheDocument();
  });

  it("calculates progress correctly", () => {
    // 2 / 5 = 40%
    // Wait, let's verify logic in component.
    // Component says: (currentSegmentIndex / segments.length) * 100
    // 2 / 5 = 0.4 = 40%
    render(DocumentGridItem, { document: mockDocument });
    const progressBar = screen
      .getByText("Grid Doc.pdf")
      .parentElement?.nextElementSibling?.querySelector("[style]");
    expect(progressBar).toHaveStyle("width: 40%");
  });

  it("renders with 0 segments gracefully", () => {
    const emptyDoc = { ...mockDocument, segments: [] };
    render(DocumentGridItem, { document: emptyDoc });
    expect(screen.getByText("0 Segments • PDF")).toBeInTheDocument();
  });
});
