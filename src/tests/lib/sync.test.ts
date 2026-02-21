import { describe, it, expect, vi, beforeEach } from "vitest";
import { get, writable } from "svelte/store";
import { syncStoresWithDb } from "$lib/stores/sync";
import * as db from "$lib/database";

vi.mock("$lib/database", () => ({
  getSettingsObservable: vi.fn(),
  updateSettings: vi.fn(),
  DEFAULT_SETTINGS: {
    videoLength: 15,
    darkMode: true,
  },
}));

describe("syncStoresWithDb", () => {
  let mockObservable: any;
  let subscribers: any[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    subscribers = [];
    mockObservable = {
      subscribe: vi.fn((cb) => {
        subscribers.push(cb);
        return { unsubscribe: vi.fn() };
      }),
    };
    (db.getSettingsObservable as vi.Mock).mockResolvedValue(mockObservable);
  });

  it("should hydrate stores from DB and not immediately overwrite DB with defaults", async () => {
    const videoLengthStore = writable(15);
    const darkModeStore = writable(true);

    // Simulate DB having different values
    const dbValue = { videoLength: 30, darkMode: false };

    // Start sync - do NOT await yet because it waits for first DB pulse
    const syncPromise = syncStoresWithDb({
      videoLength: videoLengthStore,
      darkMode: darkModeStore,
    });

    // Wait a tick for the observable to be subscribed
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Now trigger the DB hydration (Part 1 callback fires)
    subscribers[0](dbValue);

    // Now we can await the syncPromise
    await syncPromise;

    // Verify persistence didn't overwrite DB with defaults during setup
    expect(db.updateSettings).not.toHaveBeenCalled();

    // Stores should be updated to DB values
    expect(get(videoLengthStore)).toBe(30);
    expect(get(darkModeStore)).toBe(false);

    // updateSettings should still NOT have been called (isUpdatingFromDb was true during set)
    expect(db.updateSettings).not.toHaveBeenCalled();

    // Now manually change a store - this should finally trigger persistence
    videoLengthStore.set(60);

    // updateSettings SHOULD be called now with the new value
    expect(db.updateSettings).toHaveBeenCalledWith({ videoLength: 60 });
  });

  it("should handle multi-tab sync (subsequent DB updates)", async () => {
    const videoLengthStore = writable(15);
    const syncPromise = syncStoresWithDb({ videoLength: videoLengthStore });

    // Wait a tick for subscription
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Initial hydration to resolve the promise
    subscribers[0]({ videoLength: 30 });
    await syncPromise;

    expect(get(videoLengthStore)).toBe(30);
    expect(db.updateSettings).not.toHaveBeenCalled();

    // 2. Another update from DB (e.g. from another tab)
    subscribers[0]({ videoLength: 45 });
    expect(get(videoLengthStore)).toBe(45);
    // Still shouldn't call updateSettings back to DB
    expect(db.updateSettings).not.toHaveBeenCalled();
  });
});
