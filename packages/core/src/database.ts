import { segmentText } from "./segmenter";
import { CHARS_PER_SECOND } from "./constants";
import type { Document, Settings } from "./types";

// --- Types & Schemas (Simplified) ---

export const DEFAULT_SETTINGS: Settings = {
  id: "global",
  playbackSpeed: 1,
  autoScroll: true,
  karaokeMode: true,
  videoLength: 60,
  isMuted: false,
  autoResume: true,
  darkMode: true,
  textScale: 100,
  backgroundUrl: "",
};

// --- Storage Engine Interface ---

export interface StorageEngine {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

// Global storage state
let _storage: StorageEngine | null = null;
const _changeListeners: Set<(key: string, value: any) => void> = new Set();

export function setStorageEngine(engine: StorageEngine) {
  _storage = engine;
}

export function getStorage(): StorageEngine {
  if (!_storage) {
    throw new Error("Storage engine not set. Call setStorageEngine first.");
  }
  return _storage;
}

// --- Reactivity (Simple Event Emitter) ---

export function subscribeToChanges(
  callback: (key: string, value: any) => void,
) {
  _changeListeners.add(callback);
  return () => _changeListeners.delete(callback);
}

function notifyChange(key: string, value: any) {
  _changeListeners.forEach((cb) => cb(key, value));
}

// --- Keys ---

const SETTINGS_KEY = "paperflip:settings";
const DOC_PREFIX = "paperflip:doc:";
const DOC_LIST_KEY = "paperflip:docs";

// --- Core API ---

/**
 * Gets the list of document IDs, sorted by last viewed.
 */
async function getDocList(): Promise<string[]> {
  const storage = getStorage();
  return (await storage.get<string[]>(DOC_LIST_KEY)) || [];
}

/**
 * Internal helper to save the document list.
 */
async function saveDocList(ids: string[]) {
  const storage = getStorage();
  await storage.set(DOC_LIST_KEY, ids);
}

export async function addDocument(
  documentId: string,
  segments: string[],
  fullText: string = "",
  videoLengthAtSegmentation: number = 60,
  currentSegmentIndex: number = 0,
  thumbnailUri: string = "",
): Promise<Document> {
  const storage = getStorage();
  const now = Date.now();
  const currentSegmentLength = segments[currentSegmentIndex]?.length || 0;

  const doc: Document = {
    documentId,
    segments,
    fullText,
    thumbnailUri,
    videoLengthAtSegmentation,
    currentSegmentIndex,
    currentSegmentProgress: 0,
    createdAt: now,
    lastViewedAt: now,
    isFavourite: false,
    totalSegments: segments.length,
    currentSegmentLength,
  };

  await storage.set(`${DOC_PREFIX}${documentId}`, doc);

  // Update doc list (add to front)
  const list = await getDocList();
  const filteredList = list.filter((id) => id !== documentId);
  await saveDocList([documentId, ...filteredList]);

  notifyChange("documents", doc);
  return doc;
}

export async function upsertDocument(
  documentId: string,
  segments: string[],
  fullText: string = "",
  videoLengthAtSegmentation: number = 60,
  currentSegmentIndex: number = 0,
  thumbnailUri: string = "",
) {
  return addDocument(
    documentId,
    segments,
    fullText,
    videoLengthAtSegmentation,
    currentSegmentIndex,
    thumbnailUri,
  );
}

export async function getDocument(
  documentId: string,
): Promise<Document | null> {
  const storage = getStorage();
  const doc = await storage.get<Document>(`${DOC_PREFIX}${documentId}`);
  if (doc) {
    // Update last viewed
    doc.lastViewedAt = Date.now();
    await storage.set(`${DOC_PREFIX}${documentId}`, doc);

    // Re-order in list
    const list = await getDocList();
    const filteredList = list.filter((id) => id !== documentId);
    await saveDocList([documentId, ...filteredList]);

    return doc;
  }
  return null;
}

export async function getAllDocuments(): Promise<Document[]> {
  const ids = await getDocList();
  const docs: Document[] = [];

  for (const id of ids) {
    const doc = await getDocument(id);
    if (doc) {
      // In a real KV store we might want to return metadata only,
      // but for simplicity and type safety we return the whole doc
      // and let the caller decide what to use.
      docs.push(doc);
    }
  }

  return docs;
}

export async function getRecentUploads(
  limit: number = 10,
): Promise<Document[]> {
  const all = await getAllDocuments();
  return all.slice(0, limit);
}

export async function updateDocumentProgress(
  documentId: string,
  index: number,
  progress: number = 0,
) {
  const storage = getStorage();
  const doc = await storage.get<Document>(`${DOC_PREFIX}${documentId}`);
  if (doc) {
    doc.currentSegmentIndex = index;
    doc.currentSegmentProgress = progress;
    doc.currentSegmentLength = doc.segments[index]?.length || 0;
    doc.lastViewedAt = Date.now();

    await storage.set(`${DOC_PREFIX}${documentId}`, doc);
    notifyChange(`document:${documentId}`, doc);
  }
}

export async function toggleFavourite(documentId: string) {
  const storage = getStorage();
  const doc = await storage.get<Document>(`${DOC_PREFIX}${documentId}`);
  if (doc) {
    doc.isFavourite = !doc.isFavourite;
    await storage.set(`${DOC_PREFIX}${documentId}`, doc);
    notifyChange(`document:${documentId}`, doc);
    return doc.isFavourite;
  }
  return false;
}

export async function deleteDocument(documentId: string) {
  const storage = getStorage();
  await storage.del(`${DOC_PREFIX}${documentId}`);

  const list = await getDocList();
  await saveDocList(list.filter((id) => id !== documentId));

  notifyChange("documents", null);
  return true;
}

export async function getSettings(): Promise<Settings> {
  const storage = getStorage();
  const settings = await storage.get<Settings>(SETTINGS_KEY);
  return settings || DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<Settings>) {
  const storage = getStorage();
  const current = await getSettings();
  const updated = { ...current, ...patch };
  await storage.set(SETTINGS_KEY, updated);
  notifyChange("settings", updated);
}

export async function resegmentDocument(
  documentId: string,
  newVideoLength: number,
) {
  const doc = await getDocument(documentId);
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

  doc.segments = newSegments;
  doc.videoLengthAtSegmentation = newVideoLength;
  doc.currentSegmentIndex = newIndex;
  doc.currentSegmentProgress = newProgress;
  doc.totalSegments = newSegments.length;
  doc.currentSegmentLength = newSegments[newIndex]?.length || 0;

  const storage = getStorage();
  await storage.set(`${DOC_PREFIX}${documentId}`, doc);
  notifyChange(`document:${documentId}`, doc);

  return doc;
}

// Mocking some RxDB patterns for compatibility if needed
export function resetDb() {
  _storage = null;
}

// This was used for RxDB observables. In the new "barebones" world,
// components should use subscribeToChanges or platform-specific stores.
export async function getSettingsObservable() {
  return {
    subscribe: (callback: (s: Settings) => void) => {
      getSettings().then(callback);
      return subscribeToChanges((key, value) => {
        if (key === "settings") callback(value);
      });
    },
  };
}

// Deprecated RxDB specific exports (noop/empty)
export function setDbStorage(...args: any[]) {
  console.warn("setDbStorage is deprecated. Use setStorageEngine instead.");
}
export function getDb() {
  return Promise.resolve({
    settings: {
      findOne: () => ({
        $: {
          subscribe: (cb: any) => {
            getSettings().then(cb);
            return subscribeToChanges((k, v) => k === "settings" && cb(v));
          },
        },
        exec: () => getSettings(),
      }),
    },
  });
}
