import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import TextScaleSlider from "$lib/components/settings/TextScaleSlider.svelte";

describe("TextScaleSlider", () => {
  it("renders with default value", () => {
    const { getByText } = render(TextScaleSlider, { scale: 110 });
    expect(getByText("110%")).toBeInTheDocument();
  });

  it("changes value on input", async () => {
    const { getByText, getByRole } = render(TextScaleSlider, { scale: 110 });

    const slider = getByRole("slider") as HTMLInputElement;
    await fireEvent.input(slider, { target: { value: "120" } });

    expect(getByText("120%")).toBeInTheDocument();
  });

  it("respects min/max bounds in input element", () => {
    const { getByRole } = render(TextScaleSlider, { scale: 110 });
    const slider = getByRole("slider") as HTMLInputElement;

    expect(slider.min).toBe("80");
    expect(slider.max).toBe("150");
  });
});
