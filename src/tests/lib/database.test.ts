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

// Hoist all mock functions so they can be used in vi.mock factories
const {
  mockCreateRxDatabase,
  mockAddRxPlugin,
  mockAddCollections,
  mockInsert,
  mockUpsert,
  mockGetRxStorageDexie,
  mockDevModePlugin,
  mockWrappedValidateAjvStorage,
} = vi.hoisted(() => {
  const mockCreateRxDatabase = vi.fn();
  const mockAddRxPlugin = vi.fn();
  const mockAddCollections = vi.fn();
  const mockInsert = vi.fn();
  const mockUpsert = vi.fn();
  const mockGetRxStorageDexie = vi.fn(() => ({ name: "dexie-storage" }));
  const mockDevModePlugin = { name: "dev-mode-plugin" };
  const mockWrappedValidateAjvStorage = vi.fn(({ storage }) => ({
    name: `validate-ajv-${storage.name}`,
    storage,
  }));

  return {
    mockCreateRxDatabase,
    mockAddRxPlugin,
    mockAddCollections,
    mockInsert,
    mockUpsert,
    mockGetRxStorageDexie,
    mockDevModePlugin,
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

// Mock $app/environment with hoisted value
vi.mock("$app/environment", () => mockBrowser);

// Mock RxDB dev-mode plugin
vi.mock("rxdb/plugins/dev-mode", () => ({
  RxDBDevModePlugin: mockDevModePlugin,
}));

// Mock RxDB validation plugin
vi.mock("rxdb/plugins/validate-ajv", () => ({
  wrappedValidateAjvStorage: mockWrappedValidateAjvStorage,
}));

// Import the module after mocks are set up
import {
  getDb,
  addDocument,
  upsertDocument,
  updateDocumentProgress,
  resetDb,
  toggleFavourite,
  deleteDocument,
} from "../../lib/database";

// Type for mock database
type MockDatabase = {
  documents_v2: {
    insert: typeof mockInsert;
    upsert: typeof mockUpsert;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    incrementalPatch: ReturnType<typeof vi.fn>;
  };
  settings: {
    findOne: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    incrementalPatch: ReturnType<typeof vi.fn>;
  };
  addCollections: typeof mockAddCollections;
};

describe("database.ts", () => {
  let mockDb: MockDatabase;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock window for these tests since we are in node environment
    vi.stubGlobal("window", {});

    // Reset browser to true for most tests
    setMockBrowser(true);

    // Reset all mocks
    vi.clearAllMocks();

    // Reset window globals
    if (typeof window !== "undefined") {
      delete (window as Window).__rxdb_devmode_added;
    }

    // Reset the dbPromise singleton
    resetDb();

    // Create mock database instance
    mockDb = {
      documents_v2: {
        insert: mockInsert,
        upsert: mockUpsert,
        find: vi.fn(() => ({
          sort: vi.fn(() => ({
            limit: vi.fn(() => ({
              exec: vi.fn().mockResolvedValue([]),
            })),
            exec: vi.fn().mockResolvedValue([]),
          })),
        })),
        findOne: vi.fn(() => ({
          exec: vi.fn().mockResolvedValue(null),
        })),
        incrementalPatch: vi.fn(),
      },
      settings: {
        findOne: vi.fn(() => ({
          exec: vi.fn().mockResolvedValue(null),
        })),
        insert: vi.fn().mockResolvedValue({}),
        upsert: vi.fn().mockResolvedValue({}),
        incrementalPatch: vi.fn(),
      },
      addCollections: mockAddCollections,
    };

    // Setup default mock implementations
    mockCreateRxDatabase.mockResolvedValue(mockDb);
    mockAddCollections.mockResolvedValue(undefined);
    mockInsert.mockImplementation((doc) => ({
      toJSON: () => doc,
    }));
    mockUpsert.mockImplementation((doc) => ({
      toJSON: () => doc,
    }));

    // Spy on console methods
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  describe("getDb", () => {
    it("creates and returns a database instance", async () => {
      // By default DEV is true in vitest, so it might be wrapped
      const db = await getDb();

      expect(db).toBe(mockDb);
      expect(mockCreateRxDatabase).toHaveBeenCalledTimes(1);
    });

    it("returns the same database instance on subsequent calls (singleton pattern)", async () => {
      const db1 = await getDb();
      const db2 = await getDb();

      expect(db1).toBe(db2);
      expect(mockCreateRxDatabase).toHaveBeenCalledTimes(1);
    });

    it("adds the documents collection with correct schema", async () => {
      await getDb();

      expect(mockAddCollections).toHaveBeenCalledTimes(1);
      expect(mockAddCollections).toHaveBeenCalledWith(
        expect.objectContaining({
          documents_v2: {
            schema: expect.objectContaining({
              title: "paperflip_document",
              primaryKey: "documentId",
              version: 6,
              properties: expect.objectContaining({
                currentSegmentIndex: expect.objectContaining({
                  type: "number",
                }),
                currentSegmentProgress: expect.objectContaining({
                  type: "number",
                }),
                totalSegments: expect.objectContaining({ type: "number" }),
                currentSegmentLength: expect.objectContaining({
                  type: "number",
                }),
                isFavourite: expect.objectContaining({ type: "boolean" }),
              }),
            }),
            migrationStrategies: expect.any(Object),
          },
        }),
      );
    });

    it("rejects when called on the server (browser = false)", async () => {
      // Set browser to false
      setMockBrowser(false);

      await expect(getDb()).rejects.toThrow(
        "RxDB is not available on the server",
      );
    });
  });

  describe("Schema & Migration", () => {
    it("TC-DB-001: Schema Validation", async () => {
      await getDb();
      const call = mockAddCollections.mock.calls[0][0];
      const schema = call.documents_v2.schema;

      expect(schema.version).toBe(6);
      expect(schema.properties).toHaveProperty("currentSegmentIndex");
      expect(schema.properties).toHaveProperty("currentSegmentProgress");
      expect(schema.properties).toHaveProperty("totalSegments");
      expect(schema.properties).toHaveProperty("currentSegmentLength");
      expect(schema.properties).toHaveProperty("isFavourite");
    });
  });

  describe("addDocument", () => {
    it("inserts a document with all required fields including isFavourite", async () => {
      const documentId = "doc-123";
      const segments = ["Segment 1", "Segment 2", "Segment 3"];
      const currentSegmentIndex = 1;

      await addDocument(documentId, segments, currentSegmentIndex);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith({
        documentId,
        segments,
        totalSegments: 3,
        currentSegmentLength: 9, // "Segment 2".length
        currentSegmentIndex,
        currentSegmentProgress: 0,
        createdAt: expect.any(Number),
        lastViewedAt: expect.any(Number),
        isFavourite: false,
      });
    });
  });

  describe("upsertDocument", () => {
    it("upserts a document with all required fields including isFavourite", async () => {
      const documentId = "doc-123";
      const segments = ["Segment 1", "Segment 2"];
      const currentSegmentIndex = 1;

      await upsertDocument(documentId, segments, currentSegmentIndex);

      expect(mockUpsert).toHaveBeenCalledTimes(1);
      expect(mockUpsert).toHaveBeenCalledWith({
        documentId,
        segments,
        totalSegments: 2,
        currentSegmentLength: 9, // "Segment 2".length
        currentSegmentIndex,
        currentSegmentProgress: 0,
        createdAt: expect.any(Number),
        lastViewedAt: expect.any(Number),
        isFavourite: false,
      });
    });
  });

  describe("toggleFavourite", () => {
    it("toggles favourite status", async () => {
      const mockIncrementalPatch = vi.fn();
      const mockExec = vi.fn().mockResolvedValue({
        isFavourite: false,
        incrementalPatch: mockIncrementalPatch,
      });
      const mockFindOne = vi.fn().mockReturnValue({ exec: mockExec });
      mockDb.documents_v2.findOne = mockFindOne as any;

      const result = await toggleFavourite("doc-1");

      expect(mockFindOne).toHaveBeenCalledWith("doc-1");
      expect(mockIncrementalPatch).toHaveBeenCalledWith({ isFavourite: true });
      expect(result).toBe(true);
    });
  });

  describe("deleteDocument", () => {
    it("deletes a document", async () => {
      const mockRemove = vi.fn();
      const mockExec = vi.fn().mockResolvedValue({
        remove: mockRemove,
      });
      const mockFindOne = vi.fn().mockReturnValue({ exec: mockExec });
      mockDb.documents_v2.findOne = mockFindOne as any;

      const result = await deleteDocument("doc-1");

      expect(mockFindOne).toHaveBeenCalledWith("doc-1");
      expect(mockRemove).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe("updateDocumentProgress", () => {
    it("updates segment index, progress and lastViewedAt timestamp", async () => {
      const mockIncrementalPatch = vi.fn();
      const segments = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "Segment 5", // index 5
      ];
      const mockExec = vi.fn().mockResolvedValue({
        segments,
        incrementalPatch: mockIncrementalPatch,
      });
      const mockFindOne = vi.fn().mockReturnValue({ exec: mockExec });
      mockDb.documents_v2.findOne = mockFindOne as any;

      const documentId = "doc-progress-test";
      const index = 5;
      const progress = 120;

      await updateDocumentProgress(documentId, index, progress);

      expect(mockFindOne).toHaveBeenCalledWith(documentId);
      expect(mockIncrementalPatch).toHaveBeenCalledWith({
        currentSegmentIndex: index,
        currentSegmentProgress: progress,
        currentSegmentLength: 9, // "Segment 5".length
        lastViewedAt: expect.any(Number),
      });
    });
  });

  describe("getAllDocuments", () => {
    it("returns documents without segments", async () => {
      const mockDocs = [
        {
          documentId: "1",
          segments: ["a", "b"],
          toJSON: () => ({ documentId: "1", segments: ["a", "b"], other: 1 }),
        },
      ];

      const mockExec = vi.fn().mockResolvedValue(mockDocs);
      const mockSort = vi.fn().mockReturnValue({ exec: mockExec });
      const mockFind = vi.fn().mockReturnValue({ sort: mockSort });
      mockDb.documents_v2.find = mockFind as any;

      // Import inside test scope to use mocked implementation if needed, but here we use the top-level import
      const { getAllDocuments } = await import("../../lib/database");

      const results = await getAllDocuments();

      expect(mockFind).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0]).not.toHaveProperty("segments");
      expect(results[0]).toHaveProperty("other", 1);
    });
  });
});
