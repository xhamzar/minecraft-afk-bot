const test = require('node:test');
const assert = require('node:assert/strict');
const { canCommand, parseGoal } = require('../src/security/permissions');
const { resolveSecret, secureEqual } = require('../src/security/secrets');

test('chat permissions default to deny', () => {
  assert.equal(canCommand('Alex', []), false);
  assert.equal(canCommand('alex', ['Alex']), true);
});

test('natural commands map to bounded tasks', () => {
  assert.equal(parseGoal('cari diamond').target, 'diamond_ore');
  assert.equal(parseGoal('buat rumah dekat sungai').task, 'build');
  assert.throws(() => parseGoal(''), /kosong/);
});

test('environment secret references do not leak placeholders', () => {
  assert.equal(resolveSecret('env:EXAMPLE_KEY', { EXAMPLE_KEY: 'secret' }), 'secret');
  assert.equal(secureEqual('abc', 'abc'), true);
  assert.equal(secureEqual('abc', 'abcd'), false);
});
