import { render, screen, cleanup } from "@testing-library/svelte";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { tick } from "svelte";
import LoadingScreen from "../../lib/components/LoadingScreen.svelte";
import { loadingStatus } from "../../lib/stores/loading";

describe("LoadingScreen component", () => {
  beforeEach(() => {
    loadingStatus.set("Initializing...");
  });

  afterEach(() => {
    cleanup();
  });

  it("should render the loading status", () => {
    render(LoadingScreen);
    expect(screen.getByText("Initializing...")).toBeInTheDocument();
  });

  it("should update the displayed text when the store changes", async () => {
    render(LoadingScreen);
    expect(screen.getByText("Initializing...")).toBeInTheDocument();

    loadingStatus.set("Loading papers...");
    await tick();

    expect(screen.getByText("Loading papers...")).toBeInTheDocument();
    expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
  });
});
