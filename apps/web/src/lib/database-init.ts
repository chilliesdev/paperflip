import { setDbStorage } from "@paperflip/core/database";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

// Initialize the database storage for the Web app
setDbStorage(getRxStorageDexie(), import.meta.env.DEV);

export * from "@paperflip/core/database";
