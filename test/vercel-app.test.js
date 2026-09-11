const test = require('node:test');
const assert = require('node:assert/strict');

test('Vercel entry exports an Express application without starting the bot', async (context) => {
  const app = require('../src/app');
  assert.equal(typeof app, 'function');
  assert.equal(typeof app.listen, 'function');
  const server = app.listen(0, '127.0.0.1');
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/bot/start`, { method: 'POST', headers: { 'content-type': 'application/json' } });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /persistent Node\.js runtime/);
});
