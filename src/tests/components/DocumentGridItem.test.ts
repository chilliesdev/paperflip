import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import DocumentGridItem from "../../lib/components/DocumentGridItem.svelte";

vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

describe("DocumentGridItem", () => {
  const mockDocument = {
    documentId: "Test Document.pdf",
    segments: ["A", "B", "C", "D"],
    currentSegmentIndex: 1, // 25% progress
    currentSegmentProgress: 0,
    timestamp: Date.now(),
  };

  it("renders document title and info", () => {
    render(DocumentGridItem, { document: mockDocument });
    expect(screen.getByText("Test Document.pdf")).toBeInTheDocument();
    expect(screen.getByText("4 Segments • PDF")).toBeInTheDocument();
  });

  it("calculates progress correctly", () => {
    const { container } = render(DocumentGridItem, { document: mockDocument });
    const progressBar = container.querySelector('[style*="width: 25%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("renders options button and calls handler on click", async () => {
    const onShowOptions = vi.fn();
    render(DocumentGridItem, { document: mockDocument, onShowOptions });

    const button = screen.getByLabelText("More options");
    expect(button).toBeInTheDocument();

    await fireEvent.click(button);
    expect(onShowOptions).toHaveBeenCalledWith(mockDocument);
  });
});
