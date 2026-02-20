import { writable, type Writable } from "svelte/store";

export const videoLength = writable<number>(15);
export const backgroundUrl = writable<string>("");
export const autoResume = writable<boolean>(true);
export const darkMode = writable<boolean>(true);
export const textScale = writable<number>(110);

export const settingsStores: Record<
  string,
  Writable<string | number | boolean>
> = {
  videoLength,
  backgroundUrl,
  autoResume,
  darkMode,
  textScale,
};
