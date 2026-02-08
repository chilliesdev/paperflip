import { writable } from "svelte/store";

export const videoAssetUrls = writable<Record<string, string>>({});
