import { writable } from "svelte/store";

export const isMuted = writable<boolean>(false);
export const isDictationMode = writable<boolean>(false);
