import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import VideoLengthDial from "$lib/components/settings/VideoLengthDial.svelte";

describe("VideoLengthDial", () => {
  it("renders with default value", () => {
    const { getByText } = render(VideoLengthDial, { value: 15 });
    expect(getByText("15")).toBeInTheDocument();
    expect(getByText("s")).toBeInTheDocument();
  });

  it("changes value when an option is clicked", async () => {
    const { getByText } = render(VideoLengthDial, { value: 15 });

    const option30 = getByText("30s");
    await fireEvent.click(option30);

    expect(getByText("30")).toBeInTheDocument();
  });

  it("renders custom value correctly", () => {
    const { getByText } = render(VideoLengthDial, { value: 60 });
    expect(getByText("60")).toBeInTheDocument();
  });

  it("handles non-standard value gracefully", () => {
    // If value is not 5, 15, 30, 60, it should still display the number
    // Rotation logic has a default fallback.
    const { getByText } = render(VideoLengthDial, { value: 10 });
    expect(getByText("10")).toBeInTheDocument();
  });
});
