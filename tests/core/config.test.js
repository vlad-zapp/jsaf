'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { Config } = require('../../modules/core/lib/config');

describe('Config', () => {
  describe('get with overrides', () => {
    it('returns override value', () => {
      const cfg = new Config({ overrides: { jenkins: { url: 'http://test' } } });
      assert.equal(cfg.get('jenkins.url'), 'http://test');
    });

    it('returns default when key not found', () => {
      const cfg = new Config({ overrides: {} });
      assert.equal(cfg.get('missing.key', 'fallback'), 'fallback');
    });

    it('returns undefined when no default', () => {
      const cfg = new Config({ overrides: {} });
      assert.equal(cfg.get('missing.key'), undefined);
    });
  });

  describe('get with env vars', () => {
    const envKey = 'JSAF_TEST_VALUE';

    afterEach(() => {
      delete process.env[envKey];
    });

    it('reads JSAF_ prefixed env vars', () => {
      process.env[envKey] = 'from-env';
      const cfg = new Config({ overrides: {} });
      assert.equal(cfg.get('test.value'), 'from-env');
    });

    it('overrides take precedence over env', () => {
      process.env[envKey] = 'from-env';
      const cfg = new Config({ overrides: { test: { value: 'from-override' } } });
      assert.equal(cfg.get('test.value'), 'from-override');
    });
  });

  describe('module', () => {
    it('returns module config from overrides', () => {
      const cfg = new Config({ overrides: { jenkins: { url: 'http://j' } } });
      assert.deepEqual(cfg.module('jenkins'), { url: 'http://j' });
    });

    it('returns empty object for unknown module', () => {
      const cfg = new Config({ overrides: {} });
      assert.deepEqual(cfg.module('nonexistent'), {});
    });
  });
});
