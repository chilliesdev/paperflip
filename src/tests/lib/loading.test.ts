// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { get } from "svelte/store";
import { isLoading, loadingStatus } from "../../lib/stores/loading";

describe("loading store", () => {
  beforeEach(() => {
    isLoading.set(true);
    loadingStatus.set("Initializing...");
  });

  it("should have initial values", () => {
    expect(get(isLoading)).toBe(true);
    expect(get(loadingStatus)).toBe("Initializing...");
  });

  it("should update isLoading", () => {
    isLoading.set(false);
    expect(get(isLoading)).toBe(false);
  });

  it("should update loadingStatus", () => {
    loadingStatus.set("Loading data...");
    expect(get(loadingStatus)).toBe("Loading data...");
  });
});
