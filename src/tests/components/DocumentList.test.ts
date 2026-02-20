import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import DocumentList from "../../lib/components/DocumentList.svelte";

vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

describe("DocumentList", () => {
  const mockDocuments = [
    {
      documentId: "Doc 1.pdf",
      segments: ["A", "B"],
      currentSegmentIndex: 0,
    },
    {
      documentId: "Doc 2.pdf",
      segments: ["X", "Y"],
      currentSegmentIndex: 0,
    },
  ];

  it("renders list items by default", () => {
    render(DocumentList, { documents: mockDocuments });
    expect(screen.getByText("Doc 1.pdf")).toBeInTheDocument();
    expect(screen.getByText("Doc 2.pdf")).toBeInTheDocument();
    // Assuming list view renders titles differently or we check the container class?
    // Let's check for the view toggle buttons active state
    const listBtn = screen.getByLabelText("List view");
    expect(listBtn.className).toContain("text-brand-primary");
  });

  it("toggles to grid view", async () => {
    render(DocumentList, { documents: mockDocuments });
    const gridBtn = screen.getByLabelText("Grid view");

    await fireEvent.click(gridBtn);

    // Grid view button should be active
    expect(gridBtn.className).toContain("text-brand-primary");
    // List view button should be inactive (muted)
    const listBtn = screen.getByLabelText("List view");
    expect(listBtn.className).toContain("text-brand-text-muted");
  });

  it("displays empty state", () => {
    render(DocumentList, { documents: [] });
    expect(screen.getByText("No documents found.")).toBeInTheDocument();
  });

  it("passes onShowOptions to list items", async () => {
    const onShowOptions = vi.fn();
    render(DocumentList, { documents: mockDocuments, onShowOptions });

    // In list view
    const optionButtons = screen.getAllByLabelText("More options");
    expect(optionButtons.length).toBe(2);

    await fireEvent.click(optionButtons[0]);
    expect(onShowOptions).toHaveBeenCalledWith(mockDocuments[0]);
  });

  it("passes onShowOptions to grid items", async () => {
    const onShowOptions = vi.fn();
    render(DocumentList, { documents: mockDocuments, viewMode: "grid", onShowOptions });

    // In grid view
    const optionButtons = screen.getAllByLabelText("More options");
    expect(optionButtons.length).toBe(2);

    await fireEvent.click(optionButtons[1]);
    expect(onShowOptions).toHaveBeenCalledWith(mockDocuments[1]);
  });
});
