// @vitest-environment node
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Use vi.hoisted to ensure mocks are set up before module imports
const { mockBrowser, setMockBrowser } = vi.hoisted(() => {
  let browserValue = true;
  return {
    mockBrowser: {
      get browser() {
        return browserValue;
      },
    },
    setMockBrowser: (value: boolean) => {
      browserValue = value;
    },
  };
});

// Hoist all mock functions
const {
  mockCreateRxDatabase,
  mockAddRxPlugin,
  mockAddCollections,
  mockGetRxStorageDexie,
  mockWrappedValidateAjvStorage,
} = vi.hoisted(() => {
  const mockCreateRxDatabase = vi.fn();
  const mockAddRxPlugin = vi.fn();
  const mockAddCollections = vi.fn();
  const mockGetRxStorageDexie = vi.fn(() => ({ name: "dexie-storage" }));
  const mockWrappedValidateAjvStorage = vi.fn(({ storage }) => ({
    name: `validate-ajv-${storage.name}`,
    storage,
  }));

  return {
    mockCreateRxDatabase,
    mockAddRxPlugin,
    mockAddCollections,
    mockGetRxStorageDexie,
    mockWrappedValidateAjvStorage,
  };
});

// Mock RxDB
vi.mock("rxdb", () => ({
  createRxDatabase: mockCreateRxDatabase,
  addRxPlugin: mockAddRxPlugin,
  RxStorage: {},
}));

// Mock RxDB plugins
vi.mock("rxdb/plugins/storage-dexie", () => ({
  getRxStorageDexie: mockGetRxStorageDexie,
}));

vi.mock("rxdb/plugins/migration-schema", () => ({
  RxDBMigrationSchemaPlugin: { name: "migration-schema-plugin" },
}));

vi.mock("rxdb/plugins/query-builder", () => ({
  RxDBQueryBuilderPlugin: { name: "query-builder-plugin" },
}));

vi.mock("rxdb/plugins/update", () => ({
  RxDBUpdatePlugin: { name: "update-plugin" },
}));

// Mock RxDB validation plugin
vi.mock("rxdb/plugins/validate-ajv", () => ({
  wrappedValidateAjvStorage: mockWrappedValidateAjvStorage,
}));

// Mock $app/environment with hoisted value
vi.mock("$app/environment", () => mockBrowser);

// Mock RxDB dev-mode plugin
vi.mock("rxdb/plugins/dev-mode", () => ({
  RxDBDevModePlugin: { name: "dev-mode-plugin" },
}));

// Import the module after mocks are set up
import { resegmentDocument, resetDb } from "../../lib/database";

describe("resegmentDocument", () => {
  let mockDb: any;

  beforeEach(() => {
    vi.stubGlobal("window", {});
    setMockBrowser(true);
    vi.clearAllMocks();
    resetDb();

    mockDb = {
      documents: {
        findOne: vi.fn(),
      },
      settings: {
        findOne: vi.fn(() => ({
          exec: vi.fn().mockResolvedValue({ id: "global", videoLength: 15 }),
        })),
        insert: vi.fn(),
      },
      addCollections: mockAddCollections,
    };

    mockCreateRxDatabase.mockResolvedValue(mockDb);
    mockAddCollections.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should re-segment a document and maintain progress", async () => {
    const fullText =
      "This is a long sentence that will be split. This is another sentence.";
    const oldSegments = [
      "This is a long sentence that will be split.",
      "This is another sentence.",
    ];
    const documentId = "test-doc";

    // Mock existing document
    // We want to simulate having read up to "This is a long sentence that " (30 chars)
    const mockDoc = {
      documentId,
      fullText,
      segments: oldSegments,
      currentSegmentIndex: 0,
      currentSegmentProgress: 30,
      videoLengthAtSegmentation: 10,
      incrementalPatch: vi.fn().mockResolvedValue(true),
      toJSON: vi.fn().mockReturnValue({
        documentId,
        segments: [], // will be filled by re-segmentation
        currentSegmentIndex: 0,
        currentSegmentProgress: 0,
      }),
    };

    mockDb.documents.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockDoc),
    });

    // Re-segment with a larger video length (e.g., 60 seconds)
    // 60 * 16.6 = 996 chars max length. All text should fit in one segment.
    await resegmentDocument(documentId, 60);

    expect(mockDoc.incrementalPatch).toHaveBeenCalled();
    const patch = mockDoc.incrementalPatch.mock.calls[0][0];

    expect(patch.segments.length).toBe(1);
    expect(patch.segments[0]).toContain(fullText);
    expect(patch.videoLengthAtSegmentation).toBe(60);

    // Global offset was 30.
    // In the new single segment, the progress should be 30.
    expect(patch.currentSegmentIndex).toBe(0);
    expect(patch.currentSegmentProgress).toBe(30);
  });

  it("should handle progress across multiple new segments", async () => {
    const fullText = "Sentence one. Sentence two. Sentence three.";
    const oldSegments = ["Sentence one. Sentence two. Sentence three."];
    const documentId = "test-doc";

    // Global offset: "Sentence one. ".length = 14
    const mockDoc = {
      documentId,
      fullText,
      segments: oldSegments,
      currentSegmentIndex: 0,
      currentSegmentProgress: 14,
      videoLengthAtSegmentation: 60,
      incrementalPatch: vi.fn().mockResolvedValue(true),
      toJSON: vi.fn().mockReturnValue({}),
    };

    mockDb.documents.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockDoc),
    });

    // Re-segment with a very small video length
    // 1 second * 16.6 = 16 chars max length.
    // "Sentence one. " is 14 chars. "Sentence one." is 13 chars.
    // "Sentence two." is 13 chars.
    // Segments should be ["Sentence one.", "Sentence two.", "Sentence three."]
    await resegmentDocument(documentId, 1);

    const patch = mockDoc.incrementalPatch.mock.calls[0][0];

    // "Sentence one." is 13 chars.
    // Global offset 14 should map to:
    // newIndex = 1 (second segment: "Sentence two.")
    // newProgress = 14 - 13 = 1
    expect(patch.currentSegmentIndex).toBe(1);
    expect(patch.currentSegmentProgress).toBe(1);
  });
});
