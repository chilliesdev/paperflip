const fs = require('fs');

const setup = 'apps/web/src/tests/setup.ts';
let scode = fs.readFileSync(setup, 'utf8');

scode = scode.replace(/setDbStorage\(\{\} as import\("rxdb"\).RxStorage<any, any>, false\);/, '// eslint-disable-next-line @typescript-eslint/no-explicit-any\nsetDbStorage({} as any, false);');

fs.writeFileSync(setup, scode);
