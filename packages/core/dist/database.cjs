"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/database.ts
var database_exports = {};
__export(database_exports, {
  DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
  addDocument: () => addDocument,
  deleteDocument: () => deleteDocument,
  documentSchema: () => documentSchema,
  getAllDocuments: () => getAllDocuments,
  getDb: () => getDb,
  getDocument: () => getDocument,
  getRecentUploads: () => getRecentUploads,
  getSettings: () => getSettings,
  getSettingsObservable: () => getSettingsObservable,
  resegmentDocument: () => resegmentDocument,
  resetDb: () => resetDb,
  setDbStorage: () => setDbStorage,
  settingsSchema: () => settingsSchema,
  toggleFavourite: () => toggleFavourite,
  updateDocumentProgress: () => updateDocumentProgress,
  updateSettings: () => updateSettings,
  upsertDocument: () => upsertDocument
});
module.exports = __toCommonJS(database_exports);
var import_rxdb = require("rxdb");
var import_migration_schema = require("rxdb/plugins/migration-schema");
var import_update = require("rxdb/plugins/update");
var import_query_builder = require("rxdb/plugins/query-builder");

// src/segmenter.ts
var cachedSentenceSegmenter = null;
var DEFAULT_MAX_SEGMENT_LENGTH = 1e3;
function segmentText(text, maxChars = DEFAULT_MAX_SEGMENT_LENGTH) {
  maxChars = Math.max(1, maxChars);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const segments = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChars) {
      segments.push(paragraph.trim());
      continue;
    }
    const sentences = splitSentences(paragraph);
    let currentChunkParts = [];
    let currentChunkLength = 0;
    for (const { text: sentence } of sentences) {
      if (sentence.length > maxChars) {
        if (currentChunkParts.length > 0) {
          segments.push(currentChunkParts.join("").trim());
          currentChunkParts = [];
          currentChunkLength = 0;
        }
        segments.push(...chunkText(sentence, maxChars));
      } else if (currentChunkLength + sentence.length > maxChars) {
        if (currentChunkParts.length > 0) {
          segments.push(currentChunkParts.join("").trim());
        }
        currentChunkParts = [sentence];
        currentChunkLength = sentence.length;
      } else {
        currentChunkParts.push(sentence);
        currentChunkLength += sentence.length;
      }
    }
    if (currentChunkParts.length > 0) {
      segments.push(currentChunkParts.join("").trim());
    }
  }
  return segments.filter((s) => s.length > 0);
}
function chunkText(text, maxLength) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLength, text.length);
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > start) {
        end = lastSpace;
      }
    }
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    start = end;
    while (start < text.length && text[start] === " ") {
      start++;
    }
  }
  return chunks;
}
function splitSentences(text) {
  const sentences = [];
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    if (!cachedSentenceSegmenter) {
      cachedSentenceSegmenter = new Intl.Segmenter(void 0, {
        granularity: "sentence"
      });
    }
    const segmenter = cachedSentenceSegmenter;
    for (const { segment, index } of segmenter.segment(text)) {
      if (segment.trim().length > 0) {
        sentences.push({
          text: segment,
          start: index,
          end: index + segment.length
        });
      }
    }
  } else {
    const regex = /[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[0].trim().length > 0) {
        sentences.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }
  }
  return sentences;
}

// src/constants.ts
var CHARS_PER_SECOND = 16.6;

// src/database.ts
var _global = typeof window !== "undefined" ? window : globalThis;
if (!_global.__rxdb_plugins_added) {
  try {
    (0, import_rxdb.addRxPlugin)(import_migration_schema.RxDBMigrationSchemaPlugin);
    (0, import_rxdb.addRxPlugin)(import_update.RxDBUpdatePlugin);
    (0, import_rxdb.addRxPlugin)(import_query_builder.RxDBQueryBuilderPlugin);
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
        (0, import_rxdb.addRxPlugin)(RxDBDevModePlugin);
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
    const db = await (0, import_rxdb.createRxDatabase)({
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_SETTINGS,
  addDocument,
  deleteDocument,
  documentSchema,
  getAllDocuments,
  getDb,
  getDocument,
  getRecentUploads,
  getSettings,
  getSettingsObservable,
  resegmentDocument,
  resetDb,
  setDbStorage,
  settingsSchema,
  toggleFavourite,
  updateDocumentProgress,
  updateSettings,
  upsertDocument
});
//# sourceMappingURL=database.cjs.map