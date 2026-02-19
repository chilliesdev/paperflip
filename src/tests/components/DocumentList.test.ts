import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import DocumentList from "../../lib/components/DocumentList.svelte";

// Mock paths
vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

describe("DocumentList", () => {
  const mockDocuments = [
    {
      documentId: "Doc1",
      segments: ["A"],
      currentSegmentIndex: 0,
      timestamp: 1,
    },
  ];

  it("renders with title", () => {
    render(DocumentList, { documents: mockDocuments });
    expect(screen.getByText("All Documents")).toBeInTheDocument();
  });

  it("shows empty state when no documents", () => {
    render(DocumentList, { documents: [] });
    expect(screen.getByText("No documents found.")).toBeInTheDocument();
  });

  it("defaults to list view", () => {
    render(DocumentList, { documents: mockDocuments });
    const listBtn = screen.getByLabelText("List view");
    expect(listBtn.className).toContain("text-brand-primary");
    const gridBtn = screen.getByLabelText("Grid view");
    expect(gridBtn.className).toContain("text-brand-text-muted");

    // Check for list container class
    // "flex flex-col gap-4"
    // We can't easily select by class without test-id or querySelector on container.
    // However, we know List items render " • PDF" (DocumentListItem)
    // Grid items render " Segments • PDF" (DocumentGridItem) ?
    // Wait, let's check exact text in components.

    // DocumentListItem: `{document.segments?.length || 0} segments • PDF`
    // DocumentGridItem: `{document.segments?.length || 0} Segments • PDF` (Capital S)

    expect(screen.getByText(/segments • PDF/)).toBeInTheDocument(); // lowercase s
  });

  it("toggles to grid view", async () => {
    render(DocumentList, { documents: mockDocuments });
    const gridBtn = screen.getByLabelText("Grid view");

    await fireEvent.click(gridBtn);

    expect(gridBtn.className).toContain("text-brand-primary");
    expect(screen.getByLabelText("List view").className).toContain("text-brand-text-muted");

    // Check for Grid item specific text (Capital S)
    expect(screen.getByText(/Segments • PDF/)).toBeInTheDocument();
  });
});
