cat << 'REPLACE' > apps/web/src/tests/lib/database.test.ts.patch
--- apps/web/src/tests/lib/database.test.ts
+++ apps/web/src/tests/lib/database.test.ts
@@ -103,11 +103,11 @@
   wrappedValidateAjvStorage: mockWrappedValidateAjvStorage,
 }));

+import { setDbStorage } from "@paperflip/core/database";
+import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
+import { removeRxDatabase } from "rxdb";
+
 import {
   getDb,
   addDocument,
@@ -118,6 +118,7 @@
 } from "$lib/database-init";
-import { setDbStorage } from "@paperflip/core/database";
-import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
-import { removeRxDatabase } from "rxdb";

 setDbStorage(getRxStorageDexie(), true);

@@ -183,7 +184,8 @@
   });

   afterEach(async () => {
-    await removeRxDatabase("paperflipdb", getRxStorageDexie() as any).catch(() => {});
+    resetDb();
+    await removeRxDatabase("paperflipdb", getRxStorageDexie() as any).catch(() => {});
     consoleWarnSpy.mockRestore();
     vi.unstubAllGlobals();
   });
REPLACE
patch apps/web/src/tests/lib/database.test.ts < apps/web/src/tests/lib/database.test.ts.patch || true

cat << 'REPLACE2' > apps/web/src/tests/lib/resegmentation.test.ts.patch
--- apps/web/src/tests/lib/resegmentation.test.ts
+++ apps/web/src/tests/lib/resegmentation.test.ts
@@ -80,11 +80,12 @@
 }));

+import { setDbStorage } from "@paperflip/core/database";
+import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
+import { removeRxDatabase } from "rxdb";
 import { resegmentDocument, resetDb } from "$lib/database-init";
-import { setDbStorage } from "@paperflip/core/database";
-import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
-import { removeRxDatabase } from "rxdb";

 setDbStorage(getRxStorageDexie(), true);

 describe("resegmentDocument", () => {
REPLACE2
patch apps/web/src/tests/lib/resegmentation.test.ts < apps/web/src/tests/lib/resegmentation.test.ts.patch || true
