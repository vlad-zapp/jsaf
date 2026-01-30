'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { shellQuote } = require('../../modules/gerrit/lib/groups');

describe('gerrit utilities', () => {
  describe('shellQuote', () => {
    it('wraps simple string in single quotes', () => {
      assert.equal(shellQuote('hello'), "'hello'");
    });

    it('escapes single quotes inside string', () => {
      assert.equal(shellQuote("it's"), "'it'\\''s'");
    });

    it('handles empty string', () => {
      assert.equal(shellQuote(''), "''");
    });

    it('handles spaces', () => {
      assert.equal(shellQuote('hello world'), "'hello world'");
    });

    it('handles special shell characters', () => {
      const result = shellQuote('a;b|c&d');
      assert.equal(result, "'a;b|c&d'");
    });

    it('handles multiple single quotes', () => {
      assert.equal(shellQuote("a'b'c"), "'a'\\''b'\\''c'");
    });
  });
});
