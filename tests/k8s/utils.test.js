'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseDuration } = require('../../modules/k8s/lib/pods');

describe('k8s utilities', () => {
  describe('parseDuration', () => {
    it('returns number as-is', () => {
      assert.equal(parseDuration(300), 300);
    });

    it('parses seconds', () => {
      assert.equal(parseDuration('30s'), 30);
    });

    it('parses minutes', () => {
      assert.equal(parseDuration('5m'), 300);
    });

    it('parses hours', () => {
      assert.equal(parseDuration('2h'), 7200);
    });

    it('parses numeric string', () => {
      assert.equal(parseDuration('60'), 60);
    });

    it('returns 300 for unparseable input', () => {
      assert.equal(parseDuration('invalid'), 300);
    });
  });
});
