sed -i 's/import { removeRxDatabase } from "rxdb";//g' apps/web/src/tests/lib/resegmentation.test.ts
sed -i 's/import { removeRxDatabase } from "rxdb";//g' apps/web/src/tests/lib/database.test.ts

# Just replace the implementation with removing the db map cache if mock is DB9
cat << 'MOCK' > apps/web/src/tests/lib/resegmentation.test.ts.patch
--- apps/web/src/tests/lib/resegmentation.test.ts
+++ apps/web/src/tests/lib/resegmentation.test.ts
@@ -48,6 +48,7 @@
 vi.mock("rxdb", () => ({
   createRxDatabase: mockCreateRxDatabase,
   addRxPlugin: mockAddRxPlugin,
+  removeRxDatabase: vi.fn(),
   RxStorage: {},
 }));

@@ -109,7 +110,6 @@
   });

   afterEach(async () => {
-    await removeRxDatabase("paperflipdb", mockGetRxStorageDexie() as any);

     vi.unstubAllGlobals();
   });
MOCK

cat << 'MOCK2' > apps/web/src/tests/lib/database.test.ts.patch
--- apps/web/src/tests/lib/database.test.ts
+++ apps/web/src/tests/lib/database.test.ts
@@ -62,6 +62,7 @@
 vi.mock("rxdb", () => ({
   createRxDatabase: mockCreateRxDatabase,
   addRxPlugin: mockAddRxPlugin,
+  removeRxDatabase: vi.fn(),
   RxStorage: {},
 }));

@@ -176,7 +177,6 @@
   });

   afterEach(async () => {
-    await removeRxDatabase("paperflipdb", mockGetRxStorageDexie() as any);
     consoleWarnSpy.mockRestore();
     vi.unstubAllGlobals();
   });
MOCK2

patch apps/web/src/tests/lib/resegmentation.test.ts < apps/web/src/tests/lib/resegmentation.test.ts.patch || true
patch apps/web/src/tests/lib/database.test.ts < apps/web/src/tests/lib/database.test.ts.patch || true

pnpm run test --filter=@paperflip/web | grep -C 5 "FAIL"
