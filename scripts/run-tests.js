const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.test-dist');
fs.rmSync(outDir, { recursive: true, force: true });

execFileSync(process.execPath, [path.join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
  '--outDir', outDir,
  '--rootDir', path.join(root, 'src'),
], { cwd: root, stdio: 'inherit' });

require(path.join(root, 'tests', 'behavior.test.js'));
