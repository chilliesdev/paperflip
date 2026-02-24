import { describe, it, expect } from "vitest";
import { get } from "svelte/store";
import {
  videoLength,
  backgroundUrl,
  autoResume,
  darkMode,
  textScale,
} from "../../lib/stores/settings";

describe("Settings Store", () => {
  it("should have correct default values", () => {
    expect(get(videoLength)).toBe(15);
    expect(get(backgroundUrl)).toBe(
      "https://www.w3schools.com/tags/mov_bbb.mp4",
    );
    expect(get(autoResume)).toBe(true);
    expect(get(darkMode)).toBe(true);
    expect(get(textScale)).toBe(110);
  });

  it("should update values correctly", () => {
    videoLength.set(30);
    expect(get(videoLength)).toBe(30);

    backgroundUrl.set("new-url");
    expect(get(backgroundUrl)).toBe("new-url");

    autoResume.set(false);
    expect(get(autoResume)).toBe(false);

    darkMode.set(false);
    expect(get(darkMode)).toBe(false);

    textScale.set(120);
    expect(get(textScale)).toBe(120);
  });
});
