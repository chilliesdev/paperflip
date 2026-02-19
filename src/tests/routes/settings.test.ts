import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import SettingsPage from "../../routes/settings/+page.svelte";

vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

describe("Settings Page", () => {
  it("renders the settings title", () => {
    render(SettingsPage);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });

  it("renders the bottom navigation", () => {
    render(SettingsPage);
    // Since we are not mocking BottomNavigation, it renders real links
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    // Settings text is also in title, but BottomNavigation has it too.
    // The link text is "Settings".
  });
});
