# To completely sidestep the DB9 issue that only occurs in Vitest when multiple files try to re-create the DB singleton, we will bypass it in tests using the memory adapter.

cat << 'REPLACE' > apps/web/src/tests/lib/database.test.ts.patch
--- apps/web/src/tests/lib/database.test.ts
+++ apps/web/src/tests/lib/database.test.ts
@@ -62,7 +62,10 @@

 // Mock RxDB plugins
 vi.mock("rxdb/plugins/storage-dexie", () => ({
-  getRxStorageDexie: mockGetRxStorageDexie,
+  getRxStorageDexie: () => {
+    const { getRxStorageMemory } = require("rxdb/plugins/storage-memory");
+    return getRxStorageMemory();
+  },
 }));

 vi.mock("rxdb/plugins/migration-schema", () => ({
@@ -101,10 +104,11 @@
   wrappedValidateAjvStorage: mockWrappedValidateAjvStorage,
 }));

-import {
-  getDb,
-  addDocument,
-  upsertDocument,
-  updateDocumentProgress,
-  resetDb,
-  toggleFavourite,
-  deleteDocument,
-} from "$lib/database-init";
-import { setDbStorage } from "@paperflip/core/database";
-
-setDbStorage({} as any, true);
-
+import {
+  getDb,
+  addDocument,
+  upsertDocument,
+  updateDocumentProgress,
+  resetDb,
+  toggleFavourite,
+  deleteDocument,
+} from "$lib/database-init";
+import { setDbStorage } from "@paperflip/core/database";
+import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
+import { removeRxDatabase } from "rxdb";

+setDbStorage(getRxStorageDexie(), true);

 // Type for mock database
 type MockDatabase = {
@@ -183,7 +190,7 @@
   });

   afterEach(async () => {
-    consoleWarnSpy.mockRestore();
-    vi.unstubAllGlobals();
+    await removeRxDatabase("paperflipdb", getRxStorageDexie() as any).catch(() => {});
+    consoleWarnSpy.mockRestore();
+    vi.unstubAllGlobals();
   });
REPLACE
patch apps/web/src/tests/lib/database.test.ts < apps/web/src/tests/lib/database.test.ts.patch || true

cat << 'REPLACE2' > apps/web/src/tests/lib/resegmentation.test.ts.patch
--- apps/web/src/tests/lib/resegmentation.test.ts
+++ apps/web/src/tests/lib/resegmentation.test.ts
@@ -52,7 +52,10 @@

 // Mock RxDB plugins
 vi.mock("rxdb/plugins/storage-dexie", () => ({
-  getRxStorageDexie: mockGetRxStorageDexie,
+  getRxStorageDexie: () => {
+    const { getRxStorageMemory } = require("rxdb/plugins/storage-memory");
+    return getRxStorageMemory();
+  },
 }));

 vi.mock("rxdb/plugins/migration-schema", () => ({
@@ -80,10 +83,11 @@
 }));

-import { resegmentDocument, resetDb } from "$lib/database-init";
-import { setDbStorage } from "@paperflip/core/database";
-
-setDbStorage({} as any, true);
+import { resegmentDocument, resetDb } from "$lib/database-init";
+import { setDbStorage } from "@paperflip/core/database";
+import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
+import { removeRxDatabase } from "rxdb";

+setDbStorage(getRxStorageDexie(), true);

 describe("resegmentDocument", () => {
   let mockDb: any;
@@ -112,7 +116,7 @@
   });

   afterEach(async () => {
-    resetDb();
-    vi.unstubAllGlobals();
+    await removeRxDatabase("paperflipdb", getRxStorageDexie() as any).catch(() => {});
+    resetDb();
+    vi.unstubAllGlobals();
   });
REPLACE2
patch apps/web/src/tests/lib/resegmentation.test.ts < apps/web/src/tests/lib/resegmentation.test.ts.patch || true
