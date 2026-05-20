const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { hermesHomeCandidates, hermesPath } = require('../.test-dist/hermesPaths');
const { loadHermesModelGroups } = require('../.test-dist/modelCatalog');

function withTempHome(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-vscode-test-'));
  try {
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    throw err;
  }
}

test('hermesHomeCandidates includes Windows AppData Local Hermes before dot-hermes on Windows', () => {
  const home = path.join('C:', 'Users', 'noppy');
  const candidates = hermesHomeCandidates(home, {}, 'win32');
  assert.strictEqual(candidates[0], path.join(home, 'AppData', 'Local', 'hermes'));
  assert.ok(candidates.includes(path.join(home, '.hermes')));
});

test('hermesPath prefers an existing Windows AppData Hermes home', () => {
  withTempHome((home) => {
    const appDataHome = path.join(home, 'AppData', 'Local', 'hermes');
    fs.mkdirSync(appDataHome, { recursive: true });
    assert.strictEqual(
      hermesPath(['models_dev_cache.json'], home, {}, 'win32'),
      path.join(appDataHome, 'models_dev_cache.json'),
    );
  });
});

test('loadHermesModelGroups exposes GPT-5.5 and configured custom models', () => {
  withTempHome((home) => {
    const groups = loadHermesModelGroups(['openrouter:openai/gpt-5.5', 'my-provider:custom-model'], home, {}, 'win32');
    const items = groups.flatMap((group) => group.items);
    assert.ok(items.some((item) => item.command === 'openai:gpt-5.5'));
    assert.ok(items.some((item) => item.command === 'openrouter:openai/gpt-5.5'));
    assert.ok(items.some((item) => item.command === 'my-provider:custom-model'));
  });
});

test('loadHermesModelGroups reads model cache from Windows Hermes home', () => {
  withTempHome((home) => {
    const hermesHome = path.join(home, 'AppData', 'Local', 'hermes');
    fs.mkdirSync(hermesHome, { recursive: true });
    fs.writeFileSync(path.join(hermesHome, 'models_dev_cache.json'), JSON.stringify({
      openrouter: {
        models: {
          'openai/gpt-5.5': { name: 'GPT-5.5 via OpenRouter' },
        },
      },
    }));

    const groups = loadHermesModelGroups([], home, {}, 'win32');
    const openrouter = groups.find((group) => group.group === 'OpenRouter');
    assert.ok(openrouter, 'OpenRouter group should exist');
    assert.ok(openrouter.items.some((item) => item.label === 'GPT-5.5 via OpenRouter' && item.command === 'openrouter:openai/gpt-5.5'));
  });
});
