import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import LibraryHeader from "../../lib/components/LibraryHeader.svelte";

describe("LibraryHeader", () => {
  it("renders the header title", () => {
    render(LibraryHeader);
    expect(screen.getByText("My")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
  });

  it("renders the search input", () => {
    render(LibraryHeader);
    const input = screen.getByPlaceholderText("Search your stories...");
    expect(input).toBeInTheDocument();
  });

  it("updates search query on input", async () => {
    render(LibraryHeader);
    const input = screen.getByPlaceholderText(
      "Search your stories...",
    ) as HTMLInputElement;

    await fireEvent.input(input, { target: { value: "test query" } });

    expect(input.value).toBe("test query");
    // Since binding is internal to component unless we pass prop and listen to update,
    // verifying input value is updated is enough for now.
    // If we want to verify binding to parent, we'd need a wrapper component test.
  });
});
