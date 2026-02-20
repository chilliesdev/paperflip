import { get, type Writable } from "svelte/store";
import {
  updateSettings,
  getSettingsObservable,
  type Settings,
} from "$lib/database";

/**
 * Synchronizes multiple Svelte stores with fields in the RxDB settings document.
 * Handles both initial loading, multi-tab sync (DB -> Store), and persistence (Store -> DB).
 *
 * @param storesMap A map of field names to Svelte writable stores.
 */
export async function syncStoresWithDb(
  storesMap: Record<string, Writable<string | number | boolean>>,
) {
  const observable = await getSettingsObservable();
  let isUpdatingFromDb = false;
  let hasHydrated = false;

  // 1. DB -> Stores (Initial load and multi-tab sync)
  observable.subscribe((doc: Settings | null) => {
    if (!doc) return;

    isUpdatingFromDb = true;
    for (const [fieldName, store] of Object.entries(storesMap)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbValue = (doc as any)[fieldName];
      if (dbValue !== undefined && get(store) !== dbValue) {
        store.set(dbValue);
      }
    }
    isUpdatingFromDb = false;
    hasHydrated = true;
  });

  // 2. Stores -> DB (Persistence)
  for (const [fieldName, store] of Object.entries(storesMap)) {
    store.subscribe((value) => {
      if (!isUpdatingFromDb && hasHydrated) {
        // We use a small delay or ensure we don't spam updates if needed,
        // but RxDB patch is generally efficient.
        updateSettings({ [fieldName]: value });
      }
    });
  }
}
