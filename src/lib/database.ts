import { createRxDatabase, addRxPlugin, type RxStorage } from "rxdb";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
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
    addRxPlugin(RxDBUpdatePlugin);
    window.__rxdb_plugins_added = true;
  } catch {
    // Silently ignore DEV1 errors during HMR
  }
}

const documentSchema = {
  title: "paperflip_document",
  version: 6,
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
    totalSegments: {
      type: "number",
    },
    currentSegmentLength: {
      type: "number",
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
    lastViewedAt: {
      type: "number",
      multipleOf: 1,
      minimum: 0,
      maximum: 10000000000000,
    },
    isFavourite: {
      type: "boolean",
    },
  },
  required: [
    "documentId",
    "segments",
    "currentSegmentIndex",
    "createdAt",
    "lastViewedAt",
  ],
  indexes: ["createdAt", "lastViewedAt"],
};

const settingsSchema = {
  title: "paperflip_settings",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 20,
    },
    videoLength: { type: "number" },
    backgroundUrl: { type: "string" },
    autoResume: { type: "boolean" },
    darkMode: { type: "boolean" },
    textScale: { type: "number" },
    isMuted: { type: "boolean" },
    isDictationMode: { type: "boolean" },
    playbackRate: { type: "number" },
    autoScroll: { type: "boolean" },
  },
  required: ["id"],
};

export const DEFAULT_SETTINGS = {
  id: "global",
  videoLength: 15,
  backgroundUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBxDgF10K7pouD7MG0K5YctMikezJ5XfImNw9DYPsUR7RFZ-5RFY3q9CI6mP4_DJC8F_Z48Nl-fqAgGUGUnBGKQ8GyDJ8S30tkqqdiACXwlpD6bnlXILCxggTZX3yHKKuhnVD9PKwN7TARWIcKFeca5gJw-FO1gE_6VPnWaw79EOoxNbmR2M9hXtOmr6xzBYy6Qe4H_1dsHo3Dc0cJyOEvJdcK79wFWOfyQs-ajw50B9e_1xviY_Z7Q88v2o-EvbWN_lWcwDUJ57Bfn",
  autoResume: true,
  darkMode: true,
  textScale: 110,
  isMuted: false,
  isDictationMode: false,
  playbackRate: 1.0,
  autoScroll: false,
};

export type Settings = typeof DEFAULT_SETTINGS;

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
      documents_v2: {
        schema: {
          ...documentSchema,
          version: 6,
        },
        migrationStrategies: {
          // New collection, no migrations needed yet
          1: (oldDoc) => oldDoc,
          2: (oldDoc) => oldDoc,
          3: (oldDoc) => oldDoc,
          4: (oldDoc) => oldDoc,
          5: (oldDoc) => oldDoc,
          6: (oldDoc) => {
            oldDoc.totalSegments = oldDoc.segments ? oldDoc.segments.length : 0;
            const idx = oldDoc.currentSegmentIndex || 0;
            oldDoc.currentSegmentLength =
              oldDoc.segments && oldDoc.segments[idx]
                ? oldDoc.segments[idx].length
                : 0;
            return oldDoc;
          },
        },
      },
      settings: {
        schema: settingsSchema,
      },
    });

    // Ensure default settings exist
    const settingsDoc = await db.settings.findOne("global").exec();
    if (!settingsDoc) {
      await db.settings.insert(DEFAULT_SETTINGS);
    }

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
    const now = Date.now();
    const totalSegments = segments.length;
    const currentSegmentLength = segments[currentSegmentIndex]?.length || 0;

    const doc = await db.documents_v2.insert({
      documentId,
      segments,
      totalSegments,
      currentSegmentLength,
      currentSegmentIndex,
      currentSegmentProgress: 0,
      createdAt: now,
      lastViewedAt: now,
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
    const now = Date.now();
    const totalSegments = segments.length;
    const currentSegmentLength = segments[currentSegmentIndex]?.length || 0;

    const doc = await db.documents_v2.upsert({
      documentId,
      segments,
      totalSegments,
      currentSegmentLength,
      currentSegmentIndex,
      currentSegmentProgress: 0,
      createdAt: now,
      lastViewedAt: now,
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
  const docs = await db.documents_v2
    .find()
    .sort({ lastViewedAt: "desc" })
    .limit(limit)
    .exec();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return docs.map((doc: any) => {
    const json = doc.toJSON();
    delete json.segments;
    return json;
  });
}

export async function getDocument(documentId: string) {
  const db = await getDb();
  const doc = await db.documents_v2.findOne(documentId).exec();
  if (doc) {
    await doc.incrementalPatch({ lastViewedAt: Date.now() });
    return doc.toJSON();
  }
  return null;
}

export async function updateDocumentProgress(
  documentId: string,
  index: number,
  progress: number = 0,
) {
  try {
    const db = await getDb();
    const doc = await db.documents_v2.findOne(documentId).exec();
    if (doc) {
      const currentSegmentLength = doc.segments
        ? doc.segments[index]?.length || 0
        : 0;

      await doc.incrementalPatch({
        currentSegmentIndex: index,
        currentSegmentProgress: progress,
        currentSegmentLength,
        lastViewedAt: Date.now(),
      });
    }
  } catch (error) {
    console.error(`Failed to update progress for ${documentId}:`, error);
  }
}

export async function toggleFavourite(documentId: string) {
  try {
    const db = await getDb();
    const doc = await db.documents_v2.findOne(documentId).exec();
    if (doc) {
      const newStatus = !doc.isFavourite;
      await doc.incrementalPatch({
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
    const doc = await db.documents_v2.findOne(documentId).exec();
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
  const docs = await db.documents_v2
    .find()
    .sort({ lastViewedAt: "desc" })
    .exec();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return docs.map((doc: any) => {
    const json = doc.toJSON();
    delete json.segments;
    return json;
  });
}

export async function getSettings() {
  const db = await getDb();
  const doc = await db.settings.findOne("global").exec();
  return doc ? doc.toJSON() : DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<typeof DEFAULT_SETTINGS>) {
  try {
    const db = await getDb();
    const doc = await db.settings.findOne("global").exec();
    if (doc) {
      await doc.incrementalPatch(patch);
    } else {
      await db.settings.insert({ ...DEFAULT_SETTINGS, ...patch });
    }
  } catch (error) {
    console.error("Failed to update settings:", error);
  }
}

export async function getSettingsObservable() {
  const db = await getDb();
  return db.settings.findOne("global").$;
}
