import { render, fireEvent, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import OptionsSheet from "$lib/components/OptionsSheet.svelte";

describe("OptionsSheet", () => {
  const mockDocument = {
    documentId: "doc-123",
    segments: [],
    currentSegmentIndex: 0,
    currentSegmentProgress: 0,
    createdAt: 123456789,
    isFavourite: false,
  };

  it("renders correctly", () => {
    render(OptionsSheet, {
      document: mockDocument,
      onClose: vi.fn(),
      onDelete: vi.fn(),
      onToggleFavourite: vi.fn(),
    });

    expect(screen.getByText("Set as Favourite")).toBeInTheDocument();
    expect(screen.getByText("Delete Document")).toBeInTheDocument();
  });

  it("shows 'Remove from Favourites' when document is favourite", () => {
    render(OptionsSheet, {
      document: { ...mockDocument, isFavourite: true },
      onClose: vi.fn(),
      onDelete: vi.fn(),
      onToggleFavourite: vi.fn(),
    });

    expect(screen.getByText("Remove from Favourites")).toBeInTheDocument();
  });

  it("calls onToggleFavourite when favourite button is clicked", async () => {
    const onToggleFavourite = vi.fn();
    const onClose = vi.fn();
    render(OptionsSheet, {
      document: mockDocument,
      onClose,
      onDelete: vi.fn(),
      onToggleFavourite,
    });

    await fireEvent.click(
      screen.getByText("Set as Favourite").closest("button")!,
    );
    expect(onToggleFavourite).toHaveBeenCalledWith("doc-123");
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(OptionsSheet, {
      document: mockDocument,
      onClose,
      onDelete,
      onToggleFavourite: vi.fn(),
    });

    await fireEvent.click(
      screen.getByText("Delete Document").closest("button")!,
    );
    expect(onDelete).toHaveBeenCalledWith("doc-123");
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(OptionsSheet, {
      document: mockDocument,
      onClose,
      onDelete: vi.fn(),
      onToggleFavourite: vi.fn(),
    });

    await fireEvent.click(
      screen.getByRole("button", { name: /close options/i }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
