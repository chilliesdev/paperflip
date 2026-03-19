const fs = require('fs');

const test1 = 'apps/web/src/tests/lib/resegmentation.test.ts';
let t1 = fs.readFileSync(test1, 'utf8');

t1 = t1.replace(/addCollections: mockAddCollections,\n    \};\n/g, 'addCollections: mockAddCollections,\n    });\n');
fs.writeFileSync(test1, t1);

const test2 = 'apps/web/src/tests/lib/database.test.ts';
let t2 = fs.readFileSync(test2, 'utf8');
t2 = t2.replace(/addCollections: mockAddCollections,\n    \};\n/g, 'addCollections: mockAddCollections,\n    });\n');
fs.writeFileSync(test2, t2);
