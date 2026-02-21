import { get, writable, type Writable } from "svelte/store";
import {
  updateSettings,
  getSettingsObservable,
  type Settings,
} from "$lib/database";

export const isHydrated = writable<boolean>(false);

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
  let hasHydratedFlag = false;

  // Create a promise that resolves when hydration is complete
  const hydrationPromise = new Promise<void>((resolve) => {
    // 1. DB -> Stores (Initial load and multi-tab sync)
    observable.subscribe((doc: Settings | null) => {
      if (!doc) {
        // If no document exists yet, we are "hydrated" with defaults
        if (!hasHydratedFlag) {
          hasHydratedFlag = true;
          isHydrated.set(true);
          resolve();
        }
        return;
      }

      isUpdatingFromDb = true;
      for (const [fieldName, store] of Object.entries(storesMap)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbValue = (doc as any)[fieldName];
        if (dbValue !== undefined && get(store) !== dbValue) {
          store.set(dbValue);
        }
      }
      isUpdatingFromDb = false;

      if (!hasHydratedFlag) {
        hasHydratedFlag = true;
        isHydrated.set(true);
        resolve();
      }
    });
  });

  // 2. Stores -> DB (Persistence)
  for (const [fieldName, store] of Object.entries(storesMap)) {
    store.subscribe((value) => {
      if (!isUpdatingFromDb && hasHydratedFlag) {
        updateSettings({ [fieldName]: value });
      }
    });
  }

  return hydrationPromise;
}
