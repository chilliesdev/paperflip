import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import FavouriteCard from "../../lib/components/FavouriteCard.svelte";

vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

describe("FavouriteCard", () => {
  const mockDocument = {
    documentId: "Recent Doc.pdf",
    segments: ["A", "B", "C", "D"],
    currentSegmentIndex: 1, // Part 2/4 (50% done?)
    // Wait, component progress logic:
    // min(100, round( (currentSegmentIndex / segments.length) * 100 ))
    // 1 / 4 = 0.25 = 25%
    // Part logic: (currentSegmentIndex || 0) + 1 => Part 2
    // Total parts: segments.length => 4
    timestamp: Date.now(),
  };

  it("renders document title and progress info", () => {
    render(FavouriteCard, { document: mockDocument });
    expect(screen.getByText("Recent Doc.pdf")).toBeInTheDocument();
    expect(screen.getByText("Part 2/4")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("renders progress bar", () => {
    render(FavouriteCard, { document: mockDocument });
    const progressBar = screen
      .getByText("Recent Doc.pdf")
      .parentElement?.querySelector("[style]");
    expect(progressBar).toHaveStyle("width: 25%");
  });

  it("renders with 0 segments gracefully", () => {
    const emptyDoc = { ...mockDocument, segments: [], currentSegmentIndex: 0 };
    render(FavouriteCard, { document: emptyDoc });
    expect(screen.getByText("Part 1/0")).toBeInTheDocument(); // Logic: (0)+1 / 0
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
