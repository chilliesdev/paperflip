import { writable } from "svelte/store";

export const isMuted = writable<boolean>(false);
