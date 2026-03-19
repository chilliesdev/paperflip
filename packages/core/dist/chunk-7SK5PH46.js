import {
  CHARS_PER_SECOND
} from "./chunk-XSDFQXBB.js";
import {
  segmentText
} from "./chunk-L3CEXXOQ.js";

// src/database.ts
import { createRxDatabase, addRxPlugin } from "rxdb";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
var _global = typeof window !== "undefined" ? window : globalThis;
if (!_global.__rxdb_plugins_added) {
  try {
    addRxPlugin(RxDBMigrationSchemaPlugin);
    addRxPlugin(RxDBUpdatePlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
    _global.__rxdb_plugins_added = true;
  } catch (e) {
    console.warn("Plugins might already be added", e);
  }
}
var documentSchema = {
  version: 8,
  primaryKey: "documentId",
  type: "object",
  properties: {
    documentId: { type: "string", maxLength: 100 },
    segments: { type: "array", items: { type: "string" } },
    fullText: { type: "string" },
    videoLengthAtSegmentation: { type: "number" },
    currentSegmentIndex: { type: "number" },
    currentSegmentProgress: { type: "number" },
    createdAt: { type: "number", multipleOf: 1, minimum: 0, maximum: 1e14, maxLength: 100 },
    lastViewedAt: { type: "number", multipleOf: 1, minimum: 0, maximum: 1e14, maxLength: 100 },
    isFavourite: { type: "boolean" },
    totalSegments: { type: "number" },
    currentSegmentLength: { type: "number" }
  },
  required: [
    "documentId",
    "segments",
    "createdAt",
    "lastViewedAt",
    "isFavourite"
  ]
};
var settingsSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    playbackSpeed: { type: "number" },
    autoScroll: { type: "boolean" },
    karaokeMode: { type: "boolean" },
    videoLength: { type: "number" },
    isMuted: { type: "boolean" }
  },
  required: [
    "id",
    "playbackSpeed",
    "autoScroll",
    "karaokeMode",
    "videoLength",
    "isMuted"
  ]
};
var DEFAULT_SETTINGS = {
  id: "global",
  playbackSpeed: 1,
  autoScroll: true,
  karaokeMode: true,
  videoLength: 15,
  isMuted: false
};
var currentStorage = null;
var isDev = false;
var dbPromise = null;
function setDbStorage(storage, devMode = false) {
  currentStorage = storage;
  isDev = devMode;
}
function getDb() {
  if (typeof globalThis !== "undefined" && globalThis.__mockDb) {
    return Promise.resolve(globalThis.__mockDb);
  }
  if (!currentStorage) {
    return Promise.reject(new Error("Storage adapter not set. Call setDbStorage first."));
  }
  if (!dbPromise) {
    dbPromise = _createDb();
  }
  return dbPromise;
}
async function _createDb() {
  var _a, _b, _c, _d;
  let storage = currentStorage;
  if (isDev) {
    if (!_global.__rxdb_devmode_added) {
      try {
        const { RxDBDevModePlugin } = await import("rxdb/plugins/dev-mode");
        addRxPlugin(RxDBDevModePlugin);
        _global.__rxdb_devmode_added = true;
      } catch (e) {
        const err = e;
        const isDev1 = (err == null ? void 0 : err.code) === "DEV1" || String(e).includes("DEV1") || ((_b = (_a = err == null ? void 0 : err.message) == null ? void 0 : _a.includes) == null ? void 0 : _b.call(_a, "DEV1")) || ((_d = (_c = err == null ? void 0 : err.name) == null ? void 0 : _c.includes) == null ? void 0 : _d.call(_c, "DEV1"));
        if (isDev1) {
          _global.__rxdb_devmode_added = true;
        } else {
          console.warn("Failed to load RxDB Dev Mode Plugin", e);
        }
      }
    }
    try {
      const { wrappedValidateAjvStorage } = await import("rxdb/plugins/validate-ajv");
      storage = wrappedValidateAjvStorage({ storage });
    } catch (e) {
      console.warn("Failed to load RxDB AJV Validation Storage Wrapper", e);
    }
  }
  try {
    const db = await createRxDatabase({
      name: "paperflipdb_" + Math.random().toString(36).substring(7) + "_" + Date.now(),
      storage,
      ignoreDuplicate: true
    });
    await db.addCollections({
      documents: {
        schema: documentSchema,
        migrationStrategies: {
          1: (oldDoc) => {
            oldDoc.createdAt = oldDoc.createdAt || Date.now();
            oldDoc.lastViewedAt = oldDoc.lastViewedAt || oldDoc.createdAt;
            oldDoc.isFavourite = oldDoc.isFavourite || false;
            return oldDoc;
          },
          2: (oldDoc) => {
            oldDoc.createdAt = oldDoc.createdAt || Date.now();
            oldDoc.lastViewedAt = oldDoc.lastViewedAt || oldDoc.createdAt;
            return oldDoc;
          },
          3: (oldDoc) => {
            oldDoc.createdAt = oldDoc.createdAt || Date.now();
            oldDoc.lastViewedAt = oldDoc.lastViewedAt || oldDoc.createdAt;
            return oldDoc;
          },
          4: (oldDoc) => {
            oldDoc.createdAt = oldDoc.createdAt || Date.now();
            oldDoc.lastViewedAt = oldDoc.lastViewedAt || oldDoc.createdAt;
            return oldDoc;
          },
          5: (oldDoc) => {
            oldDoc.createdAt = oldDoc.createdAt || Date.now();
            oldDoc.lastViewedAt = oldDoc.lastViewedAt || oldDoc.createdAt;
            return oldDoc;
          },
          6: (oldDoc) => {
            oldDoc.createdAt = oldDoc.createdAt || Date.now();
            oldDoc.lastViewedAt = oldDoc.lastViewedAt || oldDoc.createdAt;
            return oldDoc;
          },
          7: (oldDoc) => {
            oldDoc.fullText = oldDoc.fullText || oldDoc.segments.join("\n\n");
            oldDoc.videoLengthAtSegmentation = oldDoc.videoLengthAtSegmentation || 15;
            return oldDoc;
          },
          8: (oldDoc) => {
            var _a2;
            oldDoc.totalSegments = ((_a2 = oldDoc.segments) == null ? void 0 : _a2.length) || 0;
            oldDoc.currentSegmentLength = oldDoc.segments && oldDoc.currentSegmentIndex !== void 0 && oldDoc.segments[oldDoc.currentSegmentIndex] ? oldDoc.segments[oldDoc.currentSegmentIndex].length : 0;
            return oldDoc;
          }
        }
      },
      settings: {
        schema: settingsSchema
      }
    });
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
async function addDocument(documentId, segments, fullText = "", videoLengthAtSegmentation = 15, currentSegmentIndex = 0) {
  var _a;
  try {
    const db = await getDb();
    const now = Date.now();
    const currentSegmentLength = ((_a = segments[currentSegmentIndex]) == null ? void 0 : _a.length) || 0;
    const doc = await db.documents.insert({
      documentId,
      segments,
      fullText,
      videoLengthAtSegmentation,
      currentSegmentIndex,
      currentSegmentProgress: 0,
      createdAt: now,
      lastViewedAt: now,
      isFavourite: false,
      totalSegments: segments.length,
      currentSegmentLength
    });
    return doc.toJSON();
  } catch (error) {
    console.error(`Failed to add document ${documentId}:`, error);
    throw error;
  }
}
async function upsertDocument(documentId, segments, fullText = "", videoLengthAtSegmentation = 15, currentSegmentIndex = 0) {
  var _a;
  try {
    const db = await getDb();
    const now = Date.now();
    const currentSegmentLength = ((_a = segments[currentSegmentIndex]) == null ? void 0 : _a.length) || 0;
    const doc = await db.documents.upsert({
      documentId,
      segments,
      fullText,
      videoLengthAtSegmentation,
      currentSegmentIndex,
      currentSegmentProgress: 0,
      createdAt: now,
      lastViewedAt: now,
      isFavourite: false,
      totalSegments: segments.length,
      currentSegmentLength
    });
    return doc.toJSON();
  } catch (error) {
    console.error(`Failed to upsert document ${documentId}:`, error);
    throw error;
  }
}
async function getRecentUploads(limit = 10) {
  const db = await getDb();
  const docs = await db.documents.find().sort({ lastViewedAt: "desc" }).limit(limit).exec();
  return docs.map((doc) => {
    const json = doc.toJSON();
    delete json.segments;
    return json;
  });
}
async function getDocument(documentId) {
  const db = await getDb();
  const doc = await db.documents.findOne(documentId).exec();
  if (doc) {
    await doc.incrementalPatch({ lastViewedAt: Date.now() });
    return doc.toJSON();
  }
  return null;
}
async function updateDocumentProgress(documentId, index, progress = 0) {
  var _a;
  try {
    const db = await getDb();
    const doc = await db.documents.findOne(documentId).exec();
    if (doc) {
      const segments = doc.segments || [];
      const currentSegmentLength = ((_a = segments[index]) == null ? void 0 : _a.length) || 0;
      await doc.incrementalPatch({
        currentSegmentIndex: index,
        currentSegmentProgress: progress,
        currentSegmentLength,
        lastViewedAt: Date.now()
      });
    }
  } catch (error) {
    console.error(`Failed to update progress for ${documentId}:`, error);
  }
}
async function toggleFavourite(documentId) {
  try {
    const db = await getDb();
    const doc = await db.documents.findOne(documentId).exec();
    if (doc) {
      const newStatus = !doc.isFavourite;
      await doc.incrementalPatch({ isFavourite: newStatus });
      return newStatus;
    }
  } catch (error) {
    console.error(`Failed to toggle favourite for ${documentId}:`, error);
  }
  return false;
}
async function deleteDocument(documentId) {
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
function resetDb() {
  dbPromise = null;
}
async function getAllDocuments() {
  const db = await getDb();
  const docs = await db.documents.find().sort({ lastViewedAt: "desc" }).exec();
  return docs.map((doc) => {
    const json = doc.toJSON();
    delete json.segments;
    return json;
  });
}
async function getSettings() {
  const db = await getDb();
  const doc = await db.settings.findOne("global").exec();
  return doc ? doc.toJSON() : DEFAULT_SETTINGS;
}
async function updateSettings(patch) {
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
async function getSettingsObservable() {
  const db = await getDb();
  return db.settings.findOne("global").$;
}
async function resegmentDocument(documentId, newVideoLength) {
  var _a;
  try {
    const db = await getDb();
    const doc = await db.documents.findOne(documentId).exec();
    if (!doc || !doc.fullText) return null;
    const oldSegments = doc.segments || [];
    const oldIndex = doc.currentSegmentIndex || 0;
    const oldProgress = doc.currentSegmentProgress || 0;
    let globalOffset = oldProgress;
    const len = Math.min(oldIndex, oldSegments.length);
    for (let i = 0; i < len; i++) {
      globalOffset += oldSegments[i].length;
    }
    const maxChars = Math.max(1, Math.round(newVideoLength * CHARS_PER_SECOND));
    const newSegments = segmentText(doc.fullText, maxChars);
    let newIndex = 0;
    let accumulatedLength = 0;
    let newProgress = 0;
    for (let i = 0; i < newSegments.length; i++) {
      const segmentLength = newSegments[i].length;
      if (accumulatedLength + segmentLength > globalOffset) {
        newIndex = i;
        newProgress = globalOffset - accumulatedLength;
        break;
      }
      accumulatedLength += segmentLength;
      if (i === newSegments.length - 1) {
        newIndex = i;
        newProgress = segmentLength;
      }
    }
    const currentSegmentLength = ((_a = newSegments[newIndex]) == null ? void 0 : _a.length) || 0;
    await doc.incrementalPatch({
      segments: newSegments,
      videoLengthAtSegmentation: newVideoLength,
      currentSegmentIndex: newIndex,
      currentSegmentProgress: newProgress,
      totalSegments: newSegments.length,
      currentSegmentLength
    });
    return doc.toJSON();
  } catch (error) {
    console.error(`Failed to resegment document ${documentId}:`, error);
    throw error;
  }
}

export {
  documentSchema,
  settingsSchema,
  DEFAULT_SETTINGS,
  setDbStorage,
  getDb,
  addDocument,
  upsertDocument,
  getRecentUploads,
  getDocument,
  updateDocumentProgress,
  toggleFavourite,
  deleteDocument,
  resetDb,
  getAllDocuments,
  getSettings,
  updateSettings,
  getSettingsObservable,
  resegmentDocument
};
//# sourceMappingURL=chunk-7SK5PH46.js.map