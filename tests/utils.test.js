import { strict as assert } from 'assert';
import { test } from 'node:test';
import Utils from '../Utils.js';

test('makeResolutionDivisibleBy8 reduces dimensions', () => {
  const { width, height } = Utils.makeResolutionDivisibleBy8(1025, 769);
  assert.equal(width % 8, 0);
  assert.equal(height % 8, 0);
});

test('generateFilename creates deterministic name', () => {
  const name1 = Utils.generateFilename('test prompt', 64, 64);
  const name2 = Utils.generateFilename('test prompt', 64, 64);
  assert.equal(name1, name2);
  assert.ok(name1.endsWith('64x64.jpg'));
});
