import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import BottomNavigation from "../../lib/components/BottomNavigation.svelte";

vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

describe("BottomNavigation", () => {
  it("renders all navigation items", () => {
    render(BottomNavigation, { activeTab: "home" });
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("highlights the active tab correctly (home)", () => {
    render(BottomNavigation, { activeTab: "home" });
    const homeIcon = screen.getByText("home");
    expect(homeIcon).toHaveClass("text-brand-primary");
  });

  it("highlights the active tab correctly (library)", () => {
    render(BottomNavigation, { activeTab: "library" });
    const libIcon = screen.getByText("auto_stories");
    expect(libIcon).toHaveClass("text-brand-primary");
  });

  it("highlights the active tab correctly (settings)", () => {
    render(BottomNavigation, { activeTab: "settings" });
    const settingsIcon = screen.getByText("settings");
    expect(settingsIcon).toHaveClass("text-brand-primary");
  });
});
