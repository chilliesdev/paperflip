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
  mockIdbAdapter,
  mockDevModePlugin,
} = vi.hoisted(() => {
  const mockCreateRxDatabase = vi.fn();
  const mockAddRxPlugin = vi.fn();
  const mockAddCollections = vi.fn();
  const mockInsert = vi.fn();
  const mockIdbAdapter = { name: "idb-adapter" };
  const mockDevModePlugin = { name: "dev-mode-plugin" };

  return {
    mockCreateRxDatabase,
    mockAddRxPlugin,
    mockAddCollections,
    mockInsert,
    mockIdbAdapter,
    mockDevModePlugin,
  };
});

// Mock RxDB
vi.mock("rxdb", () => ({
  createRxDatabase: mockCreateRxDatabase,
  addRxPlugin: mockAddRxPlugin,
}));

// Mock $app/environment with hoisted value
vi.mock("$app/environment", () => mockBrowser);

// Mock pouchdb-adapter-idb
vi.mock("pouchdb-adapter-idb", () => ({
  default: mockIdbAdapter,
}));

// Mock RxDB dev-mode plugin
vi.mock("rxdb/plugins/dev-mode", () => ({
  RxDBDevModePlugin: mockDevModePlugin,
}));

// Import the module after mocks are set up
import { getDb, addDocument, resetDb } from "../../lib/database";

// Type for mock database
type MockDatabase = {
  documents: {
    insert: typeof mockInsert;
  };
  addCollections: typeof mockAddCollections;
};

describe("database.ts", () => {
  let mockDb: MockDatabase;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset browser to true for most tests
    setMockBrowser(true);

    // Reset all mocks
    vi.clearAllMocks();

    // Reset window globals
    if (typeof window !== "undefined") {
      delete (window as Window).__rxdb_devmode_added;
      delete (window as Window).__rxdb_idb_added;
    }

    // Reset the dbPromise singleton
    resetDb();

    // Create mock database instance
    mockDb = {
      documents: {
        insert: mockInsert,
      },
      addCollections: mockAddCollections,
    };

    // Setup default mock implementations
    mockCreateRxDatabase.mockResolvedValue(mockDb);
    mockAddCollections.mockResolvedValue(undefined);
    mockInsert.mockImplementation((doc) => ({
      toJSON: () => doc,
    }));

    // Spy on console methods
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe("getDb", () => {
    it("creates and returns a database instance", async () => {
      const db = await getDb();

      expect(db).toBe(mockDb);
      expect(mockCreateRxDatabase).toHaveBeenCalledTimes(1);
      expect(mockCreateRxDatabase).toHaveBeenCalledWith({
        name: "paperflipdb",
        adapter: "idb",
      });
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
          schema: {
            title: "paperflip_document",
            version: 0,
            type: "object",
            properties: {
              documentId: {
                type: "string",
                primary: true,
              },
              segments: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              currentSegmentIndex: {
                type: "number",
              },
            },
            required: ["documentId", "segments", "currentSegmentIndex"],
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

    it("registers the idb adapter plugin only once", async () => {
      await getDb();
      await getDb(); // Call again

      // Plugin should only be added once
      expect(mockAddRxPlugin).toHaveBeenCalledWith(mockIdbAdapter);
      // Count how many times idb adapter was added
      const idbCalls = mockAddRxPlugin.mock.calls.filter(
        (call) => call[0] === mockIdbAdapter,
      );
      expect(idbCalls.length).toBe(1);
    });

    it("sets window.__rxdb_idb_added flag after registering idb adapter", async () => {
      expect((window as any).__rxdb_idb_added).toBeUndefined();

      await getDb();

      expect((window as any).__rxdb_idb_added).toBe(true);
    });

    it("skips idb adapter registration if already added", async () => {
      (window as any).__rxdb_idb_added = true;

      await getDb();

      // Should not call addRxPlugin for idb adapter
      const idbCalls = mockAddRxPlugin.mock.calls.filter(
        (call) => call[0] === mockIdbAdapter,
      );
      expect(idbCalls.length).toBe(0);
    });
  });

  describe("getDb - dev mode plugin", () => {
    it("registers dev-mode plugin in development", async () => {
      // Mock development environment
      vi.stubEnv("DEV", true);

      await getDb();

      expect(mockAddRxPlugin).toHaveBeenCalledWith(mockDevModePlugin);
      expect((window as any).__rxdb_devmode_added).toBe(true);
    });

    it("skips dev-mode plugin in production", async () => {
      // Mock production environment
      vi.stubEnv("DEV", false);

      await getDb();

      // Should not call addRxPlugin for dev-mode plugin
      const devModeCalls = mockAddRxPlugin.mock.calls.filter(
        (call) => call[0] === mockDevModePlugin,
      );
      expect(devModeCalls.length).toBe(0);
    });

    it("skips dev-mode plugin if already added", async () => {
      vi.stubEnv("DEV", true);
      (window as any).__rxdb_devmode_added = true;

      await getDb();

      // Should not call addRxPlugin for dev-mode plugin
      const devModeCalls = mockAddRxPlugin.mock.calls.filter(
        (call) => call[0] === mockDevModePlugin,
      );
      expect(devModeCalls.length).toBe(0);
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

    it("handles DEV1 error in error message when code is not set", async () => {
      vi.stubEnv("DEV", true);

      mockAddRxPlugin.mockImplementation((plugin) => {
        if (plugin === mockDevModePlugin) {
          throw new Error("DEV1: Plugin already added");
        }
      });

      await expect(getDb()).resolves.toBe(mockDb);

      expect((window as any).__rxdb_devmode_added).toBe(true);
    });

    it("handles DEV1 error in error name", async () => {
      vi.stubEnv("DEV", true);

      mockAddRxPlugin.mockImplementation((plugin) => {
        if (plugin === mockDevModePlugin) {
          const error = new Error("Plugin already added");

          (error as any).name = "DEV1Error";
          throw error;
        }
      });

      await expect(getDb()).resolves.toBe(mockDb);

      expect((window as any).__rxdb_devmode_added).toBe(true);
    });

    it("warns about non-DEV1 errors when loading dev-mode plugin", async () => {
      vi.stubEnv("DEV", true);
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

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

      consoleWarnSpy.mockRestore();
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
      });

      expect(result).toEqual({
        documentId,
        segments,
        currentSegmentIndex,
      });
    });

    it("uses default currentSegmentIndex of 0 when not provided", async () => {
      const documentId = "doc-456";
      const segments = ["First segment", "Second segment"];

      await addDocument(documentId, segments);

      expect(mockInsert).toHaveBeenCalledWith({
        documentId,
        segments,
        currentSegmentIndex: 0,
      });
    });

    it("handles empty segments array", async () => {
      const documentId = "doc-empty";
      const segments: string[] = [];

      const result = await addDocument(documentId, segments);

      expect(mockInsert).toHaveBeenCalledWith({
        documentId,
        segments: [],
        currentSegmentIndex: 0,
      });

      expect(result.segments).toEqual([]);
    });

    it("handles single segment", async () => {
      const documentId = "doc-single";
      const segments = ["Only one segment"];

      await addDocument(documentId, segments, 0);

      expect(mockInsert).toHaveBeenCalledWith({
        documentId,
        segments,
        currentSegmentIndex: 0,
      });
    });

    it("handles large segment arrays", async () => {
      const documentId = "doc-large";
      const segments = Array.from({ length: 1000 }, (_, i) => `Segment ${i}`);

      await addDocument(documentId, segments, 500);

      expect(mockInsert).toHaveBeenCalledWith({
        documentId,
        segments,
        currentSegmentIndex: 500,
      });
    });

    it("propagates database errors", async () => {
      const dbError = new Error("Database insertion failed");
      mockInsert.mockRejectedValueOnce(dbError);

      await expect(addDocument("doc-error", ["segment"])).rejects.toThrow(
        "Database insertion failed",
      );
    });

    it("waits for database initialization before inserting", async () => {
      // Make database creation slow
      let resolveDb!: (value: MockDatabase) => void;
      const slowDbPromise = new Promise<MockDatabase>((resolve) => {
        resolveDb = resolve;
      });
      mockCreateRxDatabase.mockReturnValue(slowDbPromise);

      const insertPromise = addDocument("doc-wait", ["segment"]);

      // Insert should not be called yet
      expect(mockInsert).not.toHaveBeenCalled();

      // Resolve the database creation
      resolveDb(mockDb);
      await insertPromise;

      // Now insert should have been called
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error handling", () => {
    it("throws error when _createDb is called on server", async () => {
      setMockBrowser(false);

      await expect(getDb()).rejects.toThrow(
        "RxDB is not available on the server",
      );
    });

    it("handles database creation errors", async () => {
      const dbError = new Error("Failed to create database");
      mockCreateRxDatabase.mockRejectedValueOnce(dbError);

      await expect(getDb()).rejects.toThrow("Failed to create database");
    });

    it("handles collection creation errors", async () => {
      const collectionError = new Error("Failed to add collections");
      mockAddCollections.mockRejectedValueOnce(collectionError);

      await expect(getDb()).rejects.toThrow("Failed to add collections");
    });
  });

  describe("Integration scenarios", () => {
    it("handles complete workflow: initialize db and add multiple documents", async () => {
      // Initialize database
      const db = await getDb();
      expect(db).toBe(mockDb);

      // Add first document
      await addDocument("doc-1", ["Segment A", "Segment B"]);

      // Add second document
      await addDocument("doc-2", ["Segment X", "Segment Y", "Segment Z"], 2);

      expect(mockInsert).toHaveBeenCalledTimes(2);
      expect(mockInsert).toHaveBeenNthCalledWith(1, {
        documentId: "doc-1",
        segments: ["Segment A", "Segment B"],
        currentSegmentIndex: 0,
      });
      expect(mockInsert).toHaveBeenNthCalledWith(2, {
        documentId: "doc-2",
        segments: ["Segment X", "Segment Y", "Segment Z"],
        currentSegmentIndex: 2,
      });
    });

    it("handles concurrent addDocument calls", async () => {
      // Call addDocument multiple times concurrently
      const promises = [
        addDocument("doc-concurrent-1", ["A"]),
        addDocument("doc-concurrent-2", ["B"]),
        addDocument("doc-concurrent-3", ["C"]),
      ];

      await Promise.all(promises);

      // Database should only be created once
      expect(mockCreateRxDatabase).toHaveBeenCalledTimes(1);

      // All documents should be inserted
      expect(mockInsert).toHaveBeenCalledTimes(3);
    });
  });
});
