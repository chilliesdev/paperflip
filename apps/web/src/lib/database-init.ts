import { setStorageEngine, type StorageEngine } from "@paperflip/core";
import * as idb from "idb-keyval";

// Barebones IndexedDB storage engine for Web
const webStorage: StorageEngine = {
  get: async (key) => {
    const val = await idb.get(key);
    return val === undefined ? null : val;
  },
  set: (key, value) => idb.set(key, value),
  del: (key) => idb.del(key),
  keys: () => idb.keys() as Promise<string[]>,
};

// Initialize the storage engine for the Web app
setStorageEngine(webStorage);

export * from "@paperflip/core";
