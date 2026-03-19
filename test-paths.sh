sed -i 's/\/src\/lib\/database/$lib\/database-init/g' apps/web/src/tests/lib/database.test.ts
sed -i 's/"..\/..\/lib\/database"/"$lib\/database-init"/g' apps/web/src/tests/lib/resegmentation.test.ts
sed -i 's/"$lib\/database"/"$lib\/database-init"/g' apps/web/src/tests/lib/sync.test.ts

# We need to manually inject setDbStorage correctly again
cat << 'REPLACE' > apps/web/src/tests/lib/database.test.ts.patch
--- apps/web/src/tests/lib/database.test.ts
+++ apps/web/src/tests/lib/database.test.ts
@@ -97,8 +97,11 @@
   resetDb,
   toggleFavourite,
   deleteDocument,
-} from "../../lib/database";
+} from "$lib/database-init";
+import { setDbStorage } from "@paperflip/core/database";

+setDbStorage({} as any, true);
+
 // Type for mock database
 type MockDatabase = {
   documents: {
REPLACE
patch apps/web/src/tests/lib/database.test.ts < apps/web/src/tests/lib/database.test.ts.patch || true

cat << 'REPLACE2' > apps/web/src/tests/lib/resegmentation.test.ts.patch
--- apps/web/src/tests/lib/resegmentation.test.ts
+++ apps/web/src/tests/lib/resegmentation.test.ts
@@ -80,7 +80,10 @@
 }));

 // Import the module after mocks are set up
-import { resegmentDocument, resetDb } from "../../lib/database";
+import { resegmentDocument, resetDb } from "$lib/database-init";
+import { setDbStorage } from "@paperflip/core/database";
+
+setDbStorage({} as any, true);

 describe("resegmentDocument", () => {
   let mockDb: any;
@@ -107,6 +110,7 @@
   });

   afterEach(() => {
+    resetDb();
     vi.unstubAllGlobals();
   });

REPLACE2
patch apps/web/src/tests/lib/resegmentation.test.ts < apps/web/src/tests/lib/resegmentation.test.ts.patch || true
