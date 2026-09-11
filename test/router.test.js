const test = require('node:test');
const assert = require('node:assert/strict');
const { AIRouter } = require('../src/ai/router');

test('router switches provider after failure', async () => {
  const providers = [
    { config: { name: 'first', limit: 10, api_key: 'x' }, client: { ask: async () => { throw new Error('quota'); } } },
    { config: { name: 'second', limit: 10, api_key: 'x' }, client: { ask: async () => ({ text: '{}', usage: { total_tokens: 4 } }) } }
  ];
  const store = {};
  const memory = { db: { get: () => store, set: () => {} } };
  const router = new AIRouter({ list: () => providers }, memory, { warn: () => {} }, { cooldown_ms: 10 });
  const result = await router.ask([]);
  assert.equal(result.provider, 'second');
  assert.equal(router.status().first.failures, 1);
  assert.equal(router.status().second.tokens, 4);
});
