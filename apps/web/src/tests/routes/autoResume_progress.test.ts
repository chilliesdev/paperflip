import { render, waitFor, cleanup } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock external modules FIRST
vi.mock("../../lib/database", () => ({
  getDb: vi.fn(),
  getDocument: vi.fn(),
}));

vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
}));

vi.mock("$app/paths", () => ({
  resolve: (path: string) => path,
}));

vi.mock("$app/stores", () => ({
  page: {
    subscribe: (fn: any) => {
      fn({
        url: new URL("http://localhost/feed?id=test-doc.pdf"),
      });
      return () => {};
    },
  },
}));

// Mock Feed component
vi.mock("../../lib/components/Feed.svelte", async () => {
  return { default: (await import("../mocks/MockFeed.svelte")).default };
});

import Page from "../../routes/feed/+page.svelte";
import * as database from "../../lib/database";
import { autoResume } from "../../lib/stores/settings";
import { isHydrated } from "../../lib/stores/sync";

describe("Feed Page Auto-Resume Progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autoResume.set(true);
    isHydrated.set(true); // Default to hydrated for these tests
  });

  afterEach(() => {
    cleanup();
  });

  it("uses saved progress if autoResume is enabled", async () => {
    autoResume.set(true);
    const mockDoc = {
      documentId: "test-doc.pdf",
      segments: ["Seg 1", "Seg 2", "Seg 3"],
      currentSegmentIndex: 2,
      currentSegmentProgress: 50,
    };
    (database.getDocument as any).mockResolvedValueOnce(mockDoc);

    const { getByTestId } = render(Page);

    await waitFor(() => {
      const feed = getByTestId("mock-feed");
      expect(feed.getAttribute("data-initial-index")).toBe("2");
      expect(feed.getAttribute("data-initial-progress")).toBe("50");
    });
  });

  it("waits for hydration before loading document", async () => {
    isHydrated.set(false);
    const mockDoc = {
      documentId: "test-doc.pdf",
      segments: ["Seg 1", "Seg 2", "Seg 3"],
      currentSegmentIndex: 2,
      currentSegmentProgress: 50,
    };
    (database.getDocument as any).mockResolvedValueOnce(mockDoc);

    const { getByTestId, queryByTestId } = render(Page);

    // Should still be loading (waiting for hydration)
    expect(queryByTestId("mock-feed")).toBeNull();

    // Hydrate
    isHydrated.set(true);

    await waitFor(() => {
      const feed = getByTestId("mock-feed");
      expect(feed.getAttribute("data-initial-index")).toBe("2");
    });
  });

  it("resets progress to 0 if autoResume is disabled", async () => {
    autoResume.set(false);
    const mockDoc = {
      documentId: "test-doc.pdf",
      segments: ["Seg 1", "Seg 2", "Seg 3"],
      currentSegmentIndex: 2,
      currentSegmentProgress: 50,
    };
    (database.getDocument as any).mockResolvedValueOnce(mockDoc);

    const { getByTestId } = render(Page);

    await waitFor(() => {
      const feed = getByTestId("mock-feed");
      expect(feed.getAttribute("data-initial-index")).toBe("0");
      expect(feed.getAttribute("data-initial-progress")).toBe("0");
    });
  });
});
