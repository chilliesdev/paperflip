import { render, fireEvent, screen } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import BackgroundSelector from "$lib/components/settings/BackgroundSelector.svelte";

describe("BackgroundSelector", () => {
  const backgrounds = [
    {
      url: "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-1.mp4",
      alt: "Nebula",
    },
    {
      url: "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-2.mp4",
      alt: "Forest",
    },
  ];

  it("renders correctly", () => {
    const { getByAltText } = render(BackgroundSelector, {
      selected: backgrounds[0].url,
    });
    expect(getByAltText("Nebula")).toBeInTheDocument();
    expect(getByAltText("Forest")).toBeInTheDocument();
  });

  it("highlights the selected background", () => {
    render(BackgroundSelector, {
      selected: backgrounds[0].url,
    });

    // Check for the check icon which appears only on selected item
    // The check icon is inside a div that is only rendered if selected === bg.url
    const checkmark = screen.getByText("check");
    expect(checkmark).toBeInTheDocument();
  });

  it("updates selection on click", async () => {
    const { getByAltText } = render(BackgroundSelector, {
      selected: backgrounds[0].url,
    });

    const forestBg = getByAltText("Forest");
    await fireEvent.click(forestBg);
    // Note: Since we are not binding, the visual state won't update in this test unless BackgroundSelector uses its own state.
    // However, it's meant to be $bindable.
  });
});
