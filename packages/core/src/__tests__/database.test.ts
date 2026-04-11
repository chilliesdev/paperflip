// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  setStorageEngine,
  addDocument,
  getDocument,
  getAllDocuments,
  updateDocumentProgress,
  toggleFavourite,
  deleteDocument,
  getSettings,
  updateSettings,
  DEFAULT_SETTINGS,
  type StorageEngine,
} from "../database";

// Simple in-memory storage for testing
class MemoryStorage implements StorageEngine {
  private data = new Map<string, any>();

  async get<T>(key: string): Promise<T | null> {
    return this.data.get(key) ?? null;
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }
  async del(key: string): Promise<void> {
    this.data.delete(key);
  }
  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }
}

describe("database.ts (Barebones Storage)", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    setStorageEngine(storage);
  });

  describe("Documents API", () => {
    const docId = "test-doc";
    const segments = ["Seg 1", "Seg 2"];

    it("should add and retrieve a document", async () => {
      await addDocument(docId, segments, "Full text");
      const doc = await getDocument(docId);

      expect(doc).not.toBeNull();
      expect(doc?.documentId).toBe(docId);
      expect(doc?.segments).toEqual(segments);
      expect(doc?.fullText).toBe("Full text");
    });

    it("should return metadata only in getAllDocuments", async () => {
      await addDocument("doc1", ["s1"], "full1");
      await addDocument("doc2", ["s2"], "full2");

      const all = await getAllDocuments();
      expect(all).toHaveLength(2);
      expect(all[0]).not.toHaveProperty("segments");
      expect(all[0]).not.toHaveProperty("fullText");
      expect(all[0]).toHaveProperty("documentId");
    });

    it("should update progress", async () => {
      await addDocument(docId, segments);
      await updateDocumentProgress(docId, 1, 50);

      const doc = await getDocument(docId);
      expect(doc?.currentSegmentIndex).toBe(1);
      expect(doc?.currentSegmentProgress).toBe(50);
    });

    it("should toggle favourite", async () => {
      await addDocument(docId, segments);

      const status1 = await toggleFavourite(docId);
      expect(status1).toBe(true);

      const status2 = await toggleFavourite(docId);
      expect(status2).toBe(false);
    });

    it("should delete a document", async () => {
      await addDocument(docId, segments);
      await deleteDocument(docId);

      const doc = await getDocument(docId);
      expect(doc).toBeNull();

      const all = await getAllDocuments();
      expect(all).toHaveLength(0);
    });
  });

  describe("Settings API", () => {
    it("should return default settings if none stored", async () => {
      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it("should update and persist settings", async () => {
      await updateSettings({ darkMode: false, textScale: 150 });
      const settings = await getSettings();

      expect(settings.darkMode).toBe(false);
      expect(settings.textScale).toBe(150);
      expect(settings.videoLength).toBe(DEFAULT_SETTINGS.videoLength); // preserved
    });
  });
});
