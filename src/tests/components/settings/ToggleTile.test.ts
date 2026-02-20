import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import ToggleTile from "$lib/components/settings/ToggleTile.svelte";

describe("ToggleTile", () => {
  it("renders with default props", () => {
    const { getByText } = render(ToggleTile, {
      title: "Test Toggle",
      description: "Test Description",
    });

    expect(getByText("Test Toggle")).toBeInTheDocument();
    expect(getByText("Test Description")).toBeInTheDocument();
  });

  it("toggles state on click", async () => {
    const { getByRole } = render(ToggleTile, {
      title: "Test Toggle",
      checked: false,
    });

    const checkbox = getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it("sets disabled attribute correctly", async () => {
    const { getByRole } = render(ToggleTile, {
      title: "Test Toggle",
      checked: false,
      disabled: true,
    });

    const checkbox = getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
    expect(checkbox).toHaveAttribute("disabled");
  });
});
