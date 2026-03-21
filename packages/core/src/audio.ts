import { writable, type Writable } from "svelte/store";

// Moved from apps/web/src/lib/stores/audio.ts
export const isMuted = writable<boolean>(false);
export const isDictationMode = writable<boolean>(false);
export const playbackRate = writable<number>(1.0);
export const autoScroll = writable<boolean>(false);

export const audioStores: Record<string, Writable<boolean | number>> = {
  isMuted,
  isDictationMode,
  playbackRate,
  autoScroll,
};
