import { createRxDatabase, addRxPlugin, type RxStorage } from "rxdb";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { browser } from "$app/environment";

// Use window globals to track plugin registration across Vite HMR reloads
declare global {
  interface Window {
    __rxdb_plugins_added?: boolean;
    __rxdb_devmode_added?: boolean;
  }
}

// Add essential plugins - only once
if (browser && typeof window !== "undefined" && !window.__rxdb_plugins_added) {
  try {
    addRxPlugin(RxDBMigrationSchemaPlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
    window.__rxdb_plugins_added = true;
  } catch (_e) {
    // Silently ignore DEV1 errors during HMR
  }
}

const documentSchema = {
  title: "paperflip_document",
  version: 3,
  primaryKey: "documentId",
  type: "object",
  properties: {
    documentId: {
      type: "string",
      maxLength: 100, // primaryKey and indexes need maxLength in some storages
    },
    segments: {
      type: "array",
      items: {
        type: "string",
      },
    },
    currentSegmentIndex: {
      type: "number",
      multipleOf: 1,
      minimum: 0,
      maximum: 1000000,
    },
    currentSegmentProgress: {
      type: "number",
      multipleOf: 1,
      minimum: 0,
      maximum: 10000000, // Large enough for char index
    },
    createdAt: {
      type: "number",
      multipleOf: 1,
      minimum: 0,
      maximum: 10000000000000,
    },
    isFavourite: {
      type: "boolean",
    },
  },
  required: ["documentId", "segments", "currentSegmentIndex", "createdAt"],
  indexes: ["createdAt"],
};

async function _createDb() {
  if (!browser) {
    throw new Error("RxDB can only be initialized in the browser");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storage: RxStorage<any, any> = getRxStorageDexie();

  // Only load dev-mode plugin in development
  if (import.meta.env.DEV) {
    if (typeof window !== "undefined" && !window.__rxdb_devmode_added) {
      try {
        const { RxDBDevModePlugin } = await import("rxdb/plugins/dev-mode");
        addRxPlugin(RxDBDevModePlugin);
        window.__rxdb_devmode_added = true;
      } catch (e: unknown) {
        // Suppress DEV1 error (dev-mode added multiple times)
        const err = e as { code?: string; message?: string; name?: string };
        const isDev1 =
          err?.code === "DEV1" ||
          String(e).includes("DEV1") ||
          err?.message?.includes?.("DEV1") ||
          err?.name?.includes?.("DEV1");

        if (isDev1) {
          window.__rxdb_devmode_added = true;
        } else {
          console.warn("Failed to load RxDB Dev Mode Plugin", e);
        }
      }
    }

    // In dev-mode, we MUST use a schema validator
    try {
      const { wrappedValidateAjvStorage } =
        await import("rxdb/plugins/validate-ajv");
      storage = wrappedValidateAjvStorage({ storage });
    } catch (e) {
      console.warn("Failed to load RxDB AJV Validation Storage Wrapper", e);
    }
  }

  try {
    const db = await createRxDatabase({
      name: "paperflipdb",
      storage,
    });

    await db.addCollections({
      documents: {
        schema: documentSchema,
        migrationStrategies: {
          // Migration from 0 to 1
          1: function (oldDoc) {
            return {
              documentId: oldDoc.documentId,
              segments: oldDoc.segments || [],
              currentSegmentIndex: oldDoc.currentSegmentIndex || 0,
              createdAt: oldDoc.createdAt || Date.now(),
            };
          },
          // Migration from 1 to 2
          2: function (oldDoc) {
            return {
              ...oldDoc,
              currentSegmentProgress: 0,
            };
          },
          // Migration from 2 to 3
          3: function (oldDoc) {
            return {
              ...oldDoc,
              isFavourite: false,
            };
          },
        },
      },
    });

    return db;
  } catch (error) {
    console.error("Failed to initialize RxDB:", error);
    throw error;
  }
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
  try {
    const db = await getDb();
    const doc = await db.documents.insert({
      documentId,
      segments,
      currentSegmentIndex,
      currentSegmentProgress: 0,
      createdAt: Date.now(),
      isFavourite: false,
    });
    return doc.toJSON();
  } catch (error) {
    console.error(`Failed to add document ${documentId}:`, error);
    throw error;
  }
}

export async function upsertDocument(
  documentId: string,
  segments: string[],
  currentSegmentIndex: number = 0,
) {
  try {
    const db = await getDb();
    const doc = await db.documents.upsert({
      documentId,
      segments,
      currentSegmentIndex,
      currentSegmentProgress: 0,
      createdAt: Date.now(),
      isFavourite: false, // Default to false if new
    });
    return doc.toJSON();
  } catch (error) {
    console.error(`Failed to upsert document ${documentId}:`, error);
    throw error;
  }
}

export async function getRecentUploads(limit: number = 10) {
  const db = await getDb();
  const docs = await db.documents
    .find()
    .sort({ createdAt: "desc" })
    .limit(limit)
    .exec();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return docs.map((doc: any) => doc.toJSON());
}

export async function getDocument(documentId: string) {
  const db = await getDb();
  const doc = await db.documents.findOne(documentId).exec();
  return doc ? doc.toJSON() : null;
}

export async function updateDocumentProgress(
  documentId: string,
  index: number,
  progress: number = 0,
) {
  try {
    const db = await getDb();
    const doc = await db.documents.findOne(documentId).exec();
    if (doc) {
      await doc.patch({
        currentSegmentIndex: index,
        currentSegmentProgress: progress,
      });
    }
  } catch (error) {
    console.error(`Failed to update progress for ${documentId}:`, error);
  }
}

export async function toggleFavourite(documentId: string) {
  try {
    const db = await getDb();
    const doc = await db.documents.findOne(documentId).exec();
    if (doc) {
      const newStatus = !doc.isFavourite;
      await doc.patch({
        isFavourite: newStatus,
      });
      return newStatus;
    }
  } catch (error) {
    console.error(`Failed to toggle favourite for ${documentId}:`, error);
  }
  return false;
}

export async function deleteDocument(documentId: string) {
  try {
    const db = await getDb();
    const doc = await db.documents.findOne(documentId).exec();
    if (doc) {
      await doc.remove();
      return true;
    }
  } catch (error) {
    console.error(`Failed to delete document ${documentId}:`, error);
  }
  return false;
}

// For testing purposes only - resets the database singleton
export function resetDb() {
  dbPromise = null;
}

export async function getAllDocuments() {
  const db = await getDb();
  const docs = await db.documents
    .find()
    .sort({ createdAt: "desc" })
    .exec();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return docs.map((doc: any) => doc.toJSON());
}
