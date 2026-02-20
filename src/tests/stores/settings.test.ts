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
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBxDgF10K7pouD7MG0K5YctMikezJ5XfImNw9DYPsUR7RFZ-5RFY3q9CI6mP4_DJC8F_Z48Nl-fqAgGUGUnBGKQ8GyDJ8S30tkqqdiACXwlpD6bnlXILCxggTZX3yHKKuhnVD9PKwN7TARWIcKFeca5gJw-FO1gE_6VPnWaw79EOoxNbmR2M9hXtOmr6xzBYy6Qe4H_1dsHo3Dc0cJyOEvJdcK79wFWOfyQs-ajw50B9e_1xviY_Z7Q88v2o-EvbWN_lWcwDUJ57Bfn",
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
