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
  resetDb,
  getRecentUploads,
  getDocument,
} from "../../lib/database";

// Type for mock database
type MockDatabase = {
  documents: {
    insert: typeof mockInsert;
    upsert: typeof mockUpsert;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
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
      documents: {
        insert: mockInsert,
        upsert: mockUpsert,
        find: vi.fn(() => ({
          sort: vi.fn(() => ({
            limit: vi.fn(() => ({
              exec: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
        findOne: vi.fn(() => ({
          exec: vi.fn().mockResolvedValue(null),
        })),
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
      expect(mockAddCollections).toHaveBeenCalledWith({
        documents: {
          schema: expect.objectContaining({
            title: "paperflip_document",
            primaryKey: "documentId",
          }),
          migrationStrategies: {
            1: expect.any(Function),
          },
        },
      });
    });

    it("rejects when called on the server (browser = false)", async () => {
      // Set browser to false
      setMockBrowser(false);

      await expect(getDb()).rejects.toThrow(
        "RxDB is not available on the server",
      );
    });
  });

  describe("getDb - dev mode plugin and validation", () => {
    it("registers dev-mode plugin and wraps storage in development", async () => {
      // Mock development environment
      vi.stubEnv("DEV", true);

      await getDb();

      expect(mockAddRxPlugin).toHaveBeenCalledWith(mockDevModePlugin);
      expect(mockWrappedValidateAjvStorage).toHaveBeenCalled();
      expect(mockCreateRxDatabase).toHaveBeenCalledWith({
        name: "paperflipdb",
        storage: expect.objectContaining({
          name: "validate-ajv-dexie-storage",
        }),
      });
      expect((window as any).__rxdb_devmode_added).toBe(true);
    });

    it("skips dev-mode plugin and wrapping in production", async () => {
      // Mock production environment
      vi.stubEnv("DEV", false);

      await getDb();

      // Should not call addRxPlugin for dev-mode plugin
      const devModeCalls = mockAddRxPlugin.mock.calls.filter(
        (call) => call[0] === mockDevModePlugin,
      );
      expect(devModeCalls.length).toBe(0);

      // Should not wrap storage
      expect(mockWrappedValidateAjvStorage).not.toHaveBeenCalled();
      expect(mockCreateRxDatabase).toHaveBeenCalledWith({
        name: "paperflipdb",
        storage: expect.objectContaining({ name: "dexie-storage" }),
      });
    });

    it("skips dev-mode plugin if already added but still wraps storage", async () => {
      vi.stubEnv("DEV", true);
      (window as any).__rxdb_devmode_added = true;

      await getDb();

      // Should not call addRxPlugin for dev-mode plugin
      const devModeCalls = mockAddRxPlugin.mock.calls.filter(
        (call) => call[0] === mockDevModePlugin,
      );
      expect(devModeCalls.length).toBe(0);

      // But should still wrap storage in DEV
      expect(mockWrappedValidateAjvStorage).toHaveBeenCalled();
    });

    it("handles DEV1 error gracefully when dev-mode plugin is already registered", async () => {
      vi.stubEnv("DEV", true);

      // Mock addRxPlugin to throw DEV1 error for dev-mode plugin
      mockAddRxPlugin.mockImplementation((plugin) => {
        if (plugin === mockDevModePlugin) {
          const error = new Error("DEV1: Plugin already added");
          (error as any).code = "DEV1";
          throw error;
        }
      });

      // Should not throw
      await expect(getDb()).resolves.toBe(mockDb);

      // Should set the flag to prevent future attempts
      expect((window as any).__rxdb_devmode_added).toBe(true);
    });

    it("warns about errors when loading dev-mode plugin or validation", async () => {
      vi.stubEnv("DEV", true);

      const customError = new Error("Some other error");
      mockAddRxPlugin.mockImplementation((plugin) => {
        if (plugin === mockDevModePlugin) {
          throw customError;
        }
      });

      await expect(getDb()).resolves.toBe(mockDb);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to load RxDB Dev Mode Plugin",
        customError,
      );
    });
  });

  describe("addDocument", () => {
    it("inserts a document with all required fields", async () => {
      const documentId = "doc-123";
      const segments = ["Segment 1", "Segment 2", "Segment 3"];
      const currentSegmentIndex = 1;

      const result = await addDocument(
        documentId,
        segments,
        currentSegmentIndex,
      );

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith({
        documentId,
        segments,
        currentSegmentIndex,
        createdAt: expect.any(Number),
      });

      expect(result).toEqual({
        documentId,
        segments,
        currentSegmentIndex,
        createdAt: expect.any(Number),
      });
    });
  });

  describe("upsertDocument", () => {
    it("upserts a document with all required fields", async () => {
      const documentId = "doc-123";
      const segments = ["Segment 1", "Segment 2"];
      const currentSegmentIndex = 1;

      const result = await upsertDocument(
        documentId,
        segments,
        currentSegmentIndex,
      );

      expect(mockUpsert).toHaveBeenCalledTimes(1);
      expect(mockUpsert).toHaveBeenCalledWith({
        documentId,
        segments,
        currentSegmentIndex,
        createdAt: expect.any(Number),
      });

      expect(result).toEqual({
        documentId,
        segments,
        currentSegmentIndex,
        createdAt: expect.any(Number),
      });
    });
  });

  describe("getRecentUploads", () => {
    it("fetches recent uploads sorted by createdAt desc", async () => {
      // Mock find chain
      const mockExec = vi
        .fn()
        .mockResolvedValue([
          { toJSON: () => ({ documentId: "doc1", createdAt: 200 }) },
          { toJSON: () => ({ documentId: "doc2", createdAt: 100 }) },
        ]);
      const mockLimit = vi.fn().mockReturnValue({ exec: mockExec });
      const mockSort = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFind = vi.fn().mockReturnValue({ sort: mockSort });
      mockDb.documents.find = mockFind as any;

      const result = await getRecentUploads(5);

      expect(mockSort).toHaveBeenCalledWith({ createdAt: "desc" });
      expect(mockLimit).toHaveBeenCalledWith(5);
      expect(result).toHaveLength(2);
    });
  });

  describe("getDocument", () => {
    it("fetches a single document by ID", async () => {
      const mockExec = vi.fn().mockResolvedValue({
        toJSON: () => ({ documentId: "doc1", title: "Test" }),
      });
      const mockFindOne = vi.fn().mockReturnValue({ exec: mockExec });
      mockDb.documents.findOne = mockFindOne as any;

      const result = await getDocument("doc1");

      expect(mockFindOne).toHaveBeenCalledWith("doc1");
      expect(result).toEqual({ documentId: "doc1", title: "Test" });
    });
  });
});
