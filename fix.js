const fs = require('fs');

const file = 'packages/core/src/database.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /export let __testMockDb: any = null;\nexport function setMockDb\(mock: any\) \{\n  __testMockDb = mock;\n\}\n\nexport async function getDb\(\) \{[\s\S]*?if \(\!currentStorage\) \{/g,
  `export async function getDb() {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    const glob = typeof globalThis !== 'undefined' ? (globalThis as any) : (global as any);
    if (glob && glob.__mockDb) {
      return Promise.resolve(glob.__mockDb);
    }
  }
  if (!currentStorage) {`
);

fs.writeFileSync(file, code);

// Now, properly inject __mockDb globally BEFORE loading db module!
const t1 = 'apps/web/src/tests/lib/resegmentation.test.ts';
let code1 = fs.readFileSync(t1, 'utf8');
code1 = code1.replace(/import \* as dbModule from "@paperflip\/core\/database";\nconst \{ setMockDb \} = dbModule as any;\n/g, 'import { resegmentDocument, resetDb } from "@paperflip/core/database";\n');
code1 = code1.replace(/setMockDb\(mockDb = \{/g, '(globalThis as any).__mockDb = mockDb = {');
fs.writeFileSync(t1, code1);

const t2 = 'apps/web/src/tests/lib/database.test.ts';
let code2 = fs.readFileSync(t2, 'utf8');
code2 = code2.replace(/import \* as dbModule from "@paperflip\/core\/database";\nconst \{ setMockDb \} = dbModule as any;\n/g, 'import { getDb, addDocument, upsertDocument, updateDocumentProgress, resetDb, toggleFavourite, deleteDocument } from "@paperflip/core/database";\n');
code2 = code2.replace(/setMockDb\(mockDb = \{/g, '(globalThis as any).__mockDb = mockDb = {');
fs.writeFileSync(t2, code2);
