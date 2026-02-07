import { createRxDatabase, addRxPlugin } from "rxdb";
// import { getRxStoragePouch, addPouchPlugin } from 'rxdb/plugins/pouchdb';
import { browser } from "$app/environment";

// Use window globals to track plugin registration across Vite HMR reloads
declare global {
  interface Window {
    __rxdb_devmode_added?: boolean;
    __rxdb_idb_added?: boolean;
  }
}

const documentSchema = {
  title: "paperflip_document",
  version: 0,
  type: "object",
  properties: {
    documentId: {
      type: "string",
      primary: true,
    },
    segments: {
      type: "array",
      items: {
        type: "string",
      },
    },
    currentSegmentIndex: {
      type: "number",
    },
  },
  required: ["documentId", "segments", "currentSegmentIndex"],
};

async function _createDb() {
  if (!browser) {
    throw new Error("RxDB can only be initialized in the browser");
  }

  // Dynamic import to avoid SSR issues with pouchdb-adapter-idb
  if (!window.__rxdb_idb_added) {
    const { default: idb } = await import("pouchdb-adapter-idb");
    addRxPlugin(idb);
    window.__rxdb_idb_added = true;
  }

  // Only load dev-mode plugin in development
  // Use try-catch to gracefully handle the DEV1 "already added" error
  if (import.meta.env.DEV && !window.__rxdb_devmode_added) {
    try {
      const { RxDBDevModePlugin } = await import("rxdb/plugins/dev-mode");
      addRxPlugin(RxDBDevModePlugin);
      window.__rxdb_devmode_added = true;
    } catch (e: unknown) {
      // Suppress DEV1 error (dev-mode added multiple times) - this is non-breaking
      const err = e as { code?: string; message?: string; name?: string };
      const isDev1 =
        err?.code === "DEV1" ||
        String(e).includes("DEV1") ||
        err?.message?.includes?.("DEV1") ||
        err?.name?.includes?.("DEV1");

      if (isDev1) {
        window.__rxdb_devmode_added = true; // Mark as added to prevent future attempts
        // Silently ignore - plugin is already registered
      } else {
        console.warn("Failed to load RxDB Dev Mode Plugin", e);
      }
    }
  }

  const db = await createRxDatabase({
    name: "paperflipdb",
    adapter: "idb", // RxDB v9 usage with PouchDB adapter
    // storage: getRxStoragePouch('idb'), // RxDB v10+ usage
  });

  await db.addCollections({
    documents: {
      schema: documentSchema,
    },
  });

  return db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbPromise: Promise<any> | null = null;

export function getDb() {
  if (!browser) {
    return Promise.reject(new Error("RxDB is not available on the server"));
  }
  if (!dbPromise) {
    dbPromise = _createDb();
  }
  return dbPromise;
}

export async function addDocument(
  documentId: string,
  segments: string[],
  currentSegmentIndex: number = 0,
) {
  const db = await getDb();
  const doc = await db.documents.insert({
    documentId,
    segments,
    currentSegmentIndex,
  });
  return doc.toJSON();
}

// For testing purposes only - resets the database singleton
export function resetDb() {
  dbPromise = null;
}
