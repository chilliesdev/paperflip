import { describe, it, expect } from "vitest";
import { get } from "svelte/store";
import { videoAssetUrls } from "../../lib/stores/assets";

describe("Assets Store", () => {
  it("initializes with an empty object", () => {
    const value = get(videoAssetUrls);
    expect(value).toEqual({});
  });

  it("can update the store", () => {
    videoAssetUrls.update((n) => ({ ...n, key: "value" }));
    const value = get(videoAssetUrls);
    expect(value).toEqual({ key: "value" });
  });

  it("can set the store", () => {
    videoAssetUrls.set({ new: "data" });
    const value = get(videoAssetUrls);
    expect(value).toEqual({ new: "data" });
  });
});
