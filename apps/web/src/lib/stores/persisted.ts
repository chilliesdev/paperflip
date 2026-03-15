import { writable, type Writable } from "svelte/store";
import { browser } from "$app/environment";

export function persisted<T>(key: string, initialValue: T): Writable<T> {
  const storedValue = browser ? localStorage.getItem(key) : null;
  let value = initialValue;
  if (storedValue !== null) {
    try {
      value = JSON.parse(storedValue);
    } catch (e) {
      console.warn(`Failed to parse stored value for key "${key}":`, e);
    }
  }

  const store = writable<T>(value);

  store.subscribe((val) => {
    if (browser) {
      localStorage.setItem(key, JSON.stringify(val));
    }
  });

  return store;
}
