import { render, screen, fireEvent } from "@testing-library/svelte";
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
    currentSegmentProgress: 0,
    timestamp: Date.now(),
  };

  it("renders document title and info", () => {
    render(DocumentListItem, { document: mockDocument });
    expect(screen.getByText("Test Document.pdf")).toBeInTheDocument();
    expect(screen.getByText("4 segments • PDF")).toBeInTheDocument();
  });

  it("calculates progress correctly", () => {
    const { container } = render(DocumentListItem, { document: mockDocument });
    const progressBar = container.querySelector('[style*="width: 25%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("renders with 0 segments gracefully", () => {
    const emptyDoc = { ...mockDocument, segments: [] };
    render(DocumentListItem, { document: emptyDoc });
    expect(screen.getByText("0 segments • PDF")).toBeInTheDocument();
  });

  it("renders options button and calls handler on click", async () => {
    const onShowOptions = vi.fn();
    render(DocumentListItem, { document: mockDocument, onShowOptions });

    const button = screen.getByLabelText("More options");
    expect(button).toBeInTheDocument();

    await fireEvent.click(button);
    expect(onShowOptions).toHaveBeenCalledWith(mockDocument);
  });
});
