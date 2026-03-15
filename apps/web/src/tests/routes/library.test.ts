import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LibraryPage from "../../routes/library/+page.svelte";
import * as database from "../../lib/database";

// Mock database functions
vi.mock("../../lib/database", () => ({
  getAllDocuments: vi.fn(),
}));

vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

describe("Library Page", () => {
  const mockDocuments = [
    {
      documentId: "doc1.pdf",
      segments: ["seg1", "seg2"],
      currentSegmentIndex: 0,
      timestamp: Date.now(),
      isFavourite: true,
    },
    {
      documentId: "doc2.pdf",
      segments: ["seg1", "seg2", "seg3"],
      currentSegmentIndex: 1,
      timestamp: Date.now() - 1000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (database.getAllDocuments as any).mockResolvedValue(mockDocuments);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the library page title", async () => {
    render(LibraryPage);
    expect(
      await screen.findByRole("heading", { name: /My Library/i }),
    ).toBeInTheDocument();
  });

  it("fetches and displays documents", async () => {
    render(LibraryPage);

    await waitFor(() => {
      expect(database.getAllDocuments).toHaveBeenCalled();
    });

    // Check if documents are rendered
    // Since doc1.pdf appears in both Favourites and All, we use findAllByText
    const doc1 = await screen.findAllByText("doc1.pdf");
    expect(doc1.length).toBeGreaterThan(0);

    const doc2 = await screen.findAllByText("doc2.pdf");
    expect(doc2.length).toBeGreaterThan(0);
  });

  it("shows favourites section", async () => {
    render(LibraryPage);
    expect(await screen.findByText("Favourites")).toBeInTheDocument();
    // Check if favourite cards are there
    expect(await screen.findAllByText("doc1.pdf")).toHaveLength(2); // One in favourites, one in all list
  });

  it("shows all documents section", async () => {
    render(LibraryPage);
    expect(await screen.findByText("All Documents")).toBeInTheDocument();
  });

  it("does not show favourites section when no favourites exist", async () => {
    (database.getAllDocuments as any).mockResolvedValue([
      { ...mockDocuments[0], isFavourite: false },
      { ...mockDocuments[1], isFavourite: false },
    ]);
    render(LibraryPage);
    await waitFor(() => {
      expect(database.getAllDocuments).toHaveBeenCalled();
    });

    // Use queryByText because we expect it NOT to be found
    expect(screen.queryByText("Favourites")).not.toBeInTheDocument();
  });

  it("does not show favourites section when searching", async () => {
    render(LibraryPage);

    // Wait for initial render where it IS shown
    expect(await screen.findByText("Favourites")).toBeInTheDocument();

    // Type into search bar
    const searchInput = screen.getByPlaceholderText("Search your stories...");
    await fireEvent.input(searchInput, { target: { value: "doc" } });

    // Wait for UI to update and Favourites to disappear
    await waitFor(() => {
      expect(screen.queryByText("Favourites")).not.toBeInTheDocument();
    });
  });
});
