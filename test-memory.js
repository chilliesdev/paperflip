const fs = require('fs');

const file = 'packages/core/src/database.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /export async function getDb\(\) \{[\s\S]*?if \(\!currentStorage\) \{/g,
  `export async function getDb() {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
    // Under test, aggressively bypass everything to return mockDb
    const glob = typeof globalThis !== 'undefined' ? (globalThis as any) : (global as any);
    if (glob && glob.__mockDb) {
      return Promise.resolve(glob.__mockDb);
    }
  }
  if (!currentStorage) {`
);

fs.writeFileSync(file, code);

// For tests, use `globalThis.__mockDb`
const t1 = 'apps/web/src/tests/lib/resegmentation.test.ts';
let code1 = fs.readFileSync(t1, 'utf8');
code1 = code1.replace(/__testMockDb/g, '__mockDb');
fs.writeFileSync(t1, code1);

const t2 = 'apps/web/src/tests/lib/database.test.ts';
let code2 = fs.readFileSync(t2, 'utf8');
code2 = code2.replace(/__testMockDb/g, '__mockDb');
fs.writeFileSync(t2, code2);
