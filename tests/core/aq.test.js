'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createContext } = require('@jsaf/core');

const ctx = createContext();
const { aq } = ctx;

describe('aq', () => {
  describe('context integration', () => {
    it('exposes aq as a top-level object', () => {
      assert.ok(aq);
      assert.equal(typeof aq, 'object');
    });

    it('exposes all expected methods', () => {
      const expected = [
        'parse', 'encode', 'tracked',
        'aqFindByLocator', 'aqFindByName', 'aqFindByFullName', 'aqFindByValue',
        'aqDiff', 'aqComments', 'aqAnchors',
      ];
      for (const name of expected) {
        assert.equal(typeof aq[name], 'function', `aq.${name} should be a function`);
      }
    });
  });

  describe('parse', () => {
    it('parses JSON', () => {
      const result = aq.parse('{"name":"alice","age":30}');
      assert.deepEqual(result, { name: 'alice', age: 30 });
    });

    it('parses JSON with explicit format', () => {
      const result = aq.parse('{"x":1}', 'json');
      assert.deepEqual(result, { x: 1 });
    });

    it('parses YAML', () => {
      const result = aq.parse('name: bob\nage: 25');
      assert.deepEqual(result, { name: 'bob', age: 25 });
    });

    it('parses YAML with explicit format', () => {
      const result = aq.parse('items:\n  - a\n  - b', 'yaml');
      assert.deepEqual(result, { items: ['a', 'b'] });
    });

    it('parses TOML', () => {
      const result = aq.parse('[server]\nhost = "localhost"\nport = 8080', 'toml');
      assert.deepEqual(result, { server: { host: 'localhost', port: 8080 } });
    });

    it('parses INI', () => {
      const result = aq.parse('[database]\nhost=localhost\nport=5432', 'ini');
      assert.deepEqual(result, { database: { host: 'localhost', port: '5432' } });
    });

    it('throws on unknown format', () => {
      assert.throws(() => aq.parse('data', 'nope'), /Unknown format/);
    });
  });

  describe('encode', () => {
    it('encodes to JSON', () => {
      const result = aq.encode({ a: 1 }, 'json');
      assert.deepEqual(JSON.parse(result), { a: 1 });
    });

    it('encodes to YAML', () => {
      const result = aq.encode({ key: 'value' }, 'yaml');
      assert.ok(result.includes('key:'));
      assert.ok(result.includes('value'));
    });

    it('round-trips JSON', () => {
      const original = { users: [{ name: 'alice' }, { name: 'bob' }] };
      const encoded = aq.encode(original, 'json');
      const decoded = aq.parse(encoded, 'json');
      assert.deepEqual(decoded, original);
    });

    it('round-trips YAML', () => {
      const original = { db: { host: 'localhost', port: 5432 } };
      const encoded = aq.encode(original, 'yaml');
      const decoded = aq.parse(encoded, 'yaml');
      assert.deepEqual(decoded, original);
    });

    it('throws on unknown format', () => {
      assert.throws(() => aq.encode({ a: 1 }, 'nope'), /Unknown format/);
    });
  });

  describe('aqFindByName', () => {
    it('finds properties by name regex', () => {
      const data = { user: { firstName: 'Alice', lastName: 'Smith', age: 30 } };
      const results = aq.aqFindByName.call(data, 'Name$');
      assert.equal(results.length, 2);
      const names = results.map((r) => r.value);
      assert.ok(names.includes('Alice'));
      assert.ok(names.includes('Smith'));
    });

    it('returns empty array when nothing matches', () => {
      const data = { a: 1, b: 2 };
      const results = aq.aqFindByName.call(data, 'zzz');
      assert.deepEqual(results, []);
    });
  });

  describe('aqFindByFullName', () => {
    it('finds by full dotted path', () => {
      const data = { server: { db: { host: 'localhost' } } };
      const results = aq.aqFindByFullName.call(data, 'server\\.db\\.host');
      assert.equal(results.length, 1);
      assert.equal(results[0].value, 'localhost');
    });
  });

  describe('aqFindByValue', () => {
    it('finds by string value regex', () => {
      const data = {
        prod: { url: 'https://prod.example.com' },
        staging: { url: 'https://staging.example.com' },
        timeout: 5000,
      };
      const results = aq.aqFindByValue.call(data, 'staging');
      assert.equal(results.length, 1);
      assert.equal(results[0].path, 'staging.url');
    });
  });

  describe('aqFindByLocator', () => {
    it('finds with custom locator function', () => {
      const data = { a: 1, b: 2, c: 3, d: 4 };
      const results = aq.aqFindByLocator((parent, name, value) => {
        return typeof value === 'number' && value > 2;
      }, data);
      assert.equal(results.length, 2);
      const values = results.map((r) => r.value);
      assert.ok(values.includes(3));
      assert.ok(values.includes(4));
    });
  });

  describe('aqDiff', () => {
    it('returns differences between two objects', () => {
      const a = { name: 'alice', age: 30, city: 'NYC' };
      const b = { name: 'alice', age: 31, city: 'LA' };
      const diff = aq.aqDiff(a, b);
      assert.ok(!('name' in diff), 'identical keys should not appear');
      assert.ok('age' in diff, 'differing keys should appear');
      assert.ok('city' in diff, 'differing keys should appear');
    });

    it('returns empty object for identical inputs', () => {
      const obj = { x: 1, y: 2 };
      const diff = aq.aqDiff(obj, { ...obj });
      assert.deepEqual(diff, {});
    });

    it('throws with fewer than two objects', () => {
      assert.throws(() => aq.aqDiff({ a: 1 }), /at least two/);
    });
  });

  describe('tracked', () => {
    it('wraps an object in a proxy', () => {
      const data = { name: 'test' };
      const t = aq.tracked(data);
      assert.equal(t.name, 'test');
    });

    it('supports comment manipulation', () => {
      const data = aq.parse('{"host": "localhost"}', 'json');
      const t = aq.tracked(data);
      t.host.comment('the server hostname');
      const comments = aq.aqComments.call(data, 'host');
      assert.ok(comments);
      assert.equal(comments.before, 'the server hostname');
    });
  });
});
