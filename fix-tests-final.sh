cat << 'REPLACE2' > apps/web/src/tests/lib/resegmentation.test.ts.patch
--- apps/web/src/tests/lib/resegmentation.test.ts
+++ apps/web/src/tests/lib/resegmentation.test.ts
@@ -82,6 +82,9 @@

 // Import the module after mocks are set up
 import { resegmentDocument, resetDb } from "$lib/database-init";
+import { setDbStorage } from "@paperflip/core/database";
+import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
+import { removeRxDatabase } from "rxdb";
+
+setDbStorage(getRxStorageDexie(), true);

 describe("resegmentDocument", () => {
   let mockDb: any;
@@ -113,7 +116,8 @@
   });

-  afterEach(() => {
+  afterEach(async () => {
+    await removeRxDatabase("paperflipdb", getRxStorageDexie() as any).catch(() => {});
     resetDb();
     vi.unstubAllGlobals();
   });
REPLACE2
patch apps/web/src/tests/lib/resegmentation.test.ts < apps/web/src/tests/lib/resegmentation.test.ts.patch || true
