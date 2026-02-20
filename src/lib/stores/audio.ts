import { writable } from "svelte/store";

export const isMuted = writable<boolean>(false);
export const isDictationMode = writable<boolean>(false);
export const playbackRate = writable<number>(1.0);
export const autoScroll = writable<boolean>(false);
