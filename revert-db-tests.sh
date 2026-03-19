git checkout HEAD -- apps/web/src/tests/lib/resegmentation.test.ts apps/web/src/tests/lib/database.test.ts

# Instead of passing the Dexie adapter or trying to clear mocks perfectly for DB9, we just stub RxDB completely so it never tries to build actual internals.
cat << 'REPLACE' > apps/web/src/tests/lib/resegmentation.test.ts.patch
--- apps/web/src/tests/lib/resegmentation.test.ts
+++ apps/web/src/tests/lib/resegmentation.test.ts
@@ -82,10 +82,9 @@
   RxDBDevModePlugin: { name: "dev-mode-plugin" },
 }));

-import { setDbStorage } from "@paperflip/core/database";
-import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
+import { resegmentDocument, resetDb } from "$lib/database-init";

-import { resegmentDocument, resetDb } from "$lib/database-init";
+import { setDbStorage } from "@paperflip/core/database";
+setDbStorage({} as any, true);

 describe("resegmentDocument", () => {
   let mockDb: any;
@@ -107,7 +106,6 @@

     mockCreateRxDatabase.mockResolvedValue(mockDb);
     mockAddCollections.mockResolvedValue(undefined);
-    setDbStorage(getRxStorageDexie(), true);
   });

   afterEach(() => {
REPLACE
patch apps/web/src/tests/lib/resegmentation.test.ts < apps/web/src/tests/lib/resegmentation.test.ts.patch || true

cat << 'REPLACE2' > apps/web/src/tests/lib/database.test.ts.patch
--- apps/web/src/tests/lib/database.test.ts
+++ apps/web/src/tests/lib/database.test.ts
@@ -103,10 +103,6 @@
   wrappedValidateAjvStorage: mockWrappedValidateAjvStorage,
 }));

-// Import the module after mocks are set up
-import { setDbStorage } from "@paperflip/core/database";
-import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
-
 import {
   getDb,
   addDocument,
@@ -116,6 +112,8 @@
   toggleFavourite,
   deleteDocument,
 } from "$lib/database-init";
+import { setDbStorage } from "@paperflip/core/database";
+setDbStorage({} as any, true);

 // Type for mock database
 type MockDatabase = {
@@ -145,9 +143,6 @@
   });

   describe("getDb", () => {
-    beforeEach(() => {
-      setDbStorage(getRxStorageDexie(), true);
-    });
     it("creates and returns a database instance", async () => {
       // By default DEV is true in vitest, so it might be wrapped
       const db = await getDb();
REPLACE2
patch apps/web/src/tests/lib/database.test.ts < apps/web/src/tests/lib/database.test.ts.patch || true
