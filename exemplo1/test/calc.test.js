const test = require('node:test');
const assert = require('node:assert');
const { somar, subtrair } = require('../src/calc');

test('somar 2 + 3 = 5', () => {
  assert.strictEqual(somar(2, 3), 5);
});

test('subtrair 5 - 3 = 2', () => {
  assert.strictEqual(subtrair(5, 3), 2);
});
