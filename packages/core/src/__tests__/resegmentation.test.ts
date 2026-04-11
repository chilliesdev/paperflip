// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  setStorageEngine,
  addDocument,
  resegmentDocument,
  getDocument,
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

describe("resegmentDocument", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    setStorageEngine(storage);
  });

  it("should re-segment a document and maintain progress", async () => {
    const fullText =
      "This is a long sentence that will be split. This is another sentence.";
    const oldSegments = [
      "This is a long sentence that will be split.",
      "This is another sentence.",
    ];
    const documentId = "test-doc";

    // Create initial document
    await addDocument(documentId, oldSegments, fullText, 10);

    // Simulate progress: 30 chars into first segment
    const storageObj = getStorageEngine();
    const doc = await getDocument(documentId);
    if (doc) {
      doc.currentSegmentIndex = 0;
      doc.currentSegmentProgress = 30;
      await storage.set(`paperflip:doc:${documentId}`, doc);
    }

    // Re-segment with a larger video length (e.g., 60 seconds)
    // All text should fit in one segment.
    await resegmentDocument(documentId, 60);

    const updatedDoc = await getDocument(documentId);
    expect(updatedDoc?.segments.length).toBe(1);
    expect(updatedDoc?.segments[0]).toContain(fullText);
    expect(updatedDoc?.videoLengthAtSegmentation).toBe(60);

    // Global offset was 30. In the new single segment, progress should be 30.
    expect(updatedDoc?.currentSegmentIndex).toBe(0);
    expect(updatedDoc?.currentSegmentProgress).toBe(30);
  });

  it("should handle progress across multiple new segments", async () => {
    const fullText = "Sentence one. Sentence two. Sentence three.";
    const oldSegments = ["Sentence one. Sentence two. Sentence three."];
    const documentId = "test-doc";

    await addDocument(documentId, oldSegments, fullText, 60);

    // Global offset: "Sentence one. ".length = 14
    const doc = await getDocument(documentId);
    if (doc) {
      doc.currentSegmentIndex = 0;
      doc.currentSegmentProgress = 14;
      await storage.set(`paperflip:doc:${documentId}`, doc);
    }

    // Re-segment with a very small video length
    await resegmentDocument(documentId, 1);

    const updatedDoc = await getDocument(updatedDocId(documentId));
    // Segments based on 1s video length will be small
    expect(updatedDoc?.segments.length).toBeGreaterThan(1);

    // "Sentence one." is 13 chars.
    // Global offset 14 should map to:
    // newIndex = 1 (second segment: " Sentence two.")
    // or similar depending on segmenter logic
    expect(updatedDoc?.currentSegmentIndex).toBeGreaterThan(0);
  });
});

// Helper to avoid TS error about getStorage not exported (it is, but let's be safe)
function getStorageEngine() {
  return (globalThis as any)._storage;
}
function updatedDocId(id: string) {
  return id;
}
