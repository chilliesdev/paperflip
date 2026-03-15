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

  // Track the last value sent to the DB for each field to avoid reverts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastSentValues: Record<string, any> = {};

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

        if (dbValue !== undefined) {
          if (lastSentValues[fieldName] === dbValue) {
            // DB has caught up to our last sent value, clear the tracker
            delete lastSentValues[fieldName];
          } else if (lastSentValues[fieldName] === undefined) {
            // No pending local change, update store if it differs
            if (get(store) !== dbValue) {
              store.set(dbValue);
            }
          }
          // else: there is a pending local change that doesn't match this DB value yet.
          // We keep our local value (optimistic) and wait for the next emission.
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
        lastSentValues[fieldName] = value;
        updateSettings({ [fieldName]: value });
      }
    });
  }

  return hydrationPromise;
}
