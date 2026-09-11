const test = require('node:test');
const assert = require('node:assert/strict');
const { ruleDecision } = require('../src/brain/decision-maker');
const { extractJson, validateDecision } = require('../src/brain/reasoning');
const base = { health: 20, hunger: 20, hostiles: [], isNight: false, inventoryFree: 20, hasFood: true, hasWood: true };

test('survival overrides ordinary autonomous work', () => {
  assert.equal(ruleDecision({ ...base, hunger: 5 }).task, 'eat');
  assert.equal(ruleDecision({ ...base, health: 4, hunger: 5 }).task, 'escape');
});

test('AI decisions are parsed and constrained', () => {
  assert.deepEqual(validateDecision(extractJson('```json\n{"task":"mine","priority":200,"target":"iron_ore"}\n```')), {
    task: 'mine', priority: 100, reason: 'AI decision', target: 'iron_ore', parameters: {}
  });
  assert.throws(() => validateDecision({ task: 'shell' }), /unsupported/);
});
