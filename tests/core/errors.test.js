'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  JsafError, HttpError, ConnectionError, AuthError, ConfigError, CommandError,
} = require('../../modules/core/lib/errors');

describe('errors', () => {
  describe('JsafError', () => {
    it('sets message and context', () => {
      const err = new JsafError('something broke', { key: 'val' });
      assert.equal(err.message, 'something broke');
      assert.deepEqual(err.context, { key: 'val' });
      assert.equal(err.name, 'JsafError');
    });

    it('defaults context to empty object', () => {
      const err = new JsafError('oops');
      assert.deepEqual(err.context, {});
    });

    it('is an instance of Error', () => {
      assert.ok(new JsafError('x') instanceof Error);
    });
  });

  describe('HttpError', () => {
    it('stores status code and response body', () => {
      const err = new HttpError('GET', '/api/foo', 404, 'Not Found');
      assert.equal(err.statusCode, 404);
      assert.equal(err.responseBody, 'Not Found');
      assert.equal(err.name, 'HttpError');
      assert.ok(err.message.includes('404'));
      assert.ok(err.message.includes('GET'));
      assert.ok(err.message.includes('/api/foo'));
    });

    it('truncates long response bodies in message', () => {
      const longBody = 'x'.repeat(500);
      const err = new HttpError('POST', '/api', 500, longBody);
      assert.ok(err.message.length < longBody.length);
      assert.equal(err.responseBody, longBody);
    });

    it('handles empty body', () => {
      const err = new HttpError('DELETE', '/api', 500, '');
      assert.equal(err.statusCode, 500);
      assert.equal(err.responseBody, '');
    });

    it('is an instance of JsafError', () => {
      assert.ok(new HttpError('GET', '/', 500, '') instanceof JsafError);
    });
  });

  describe('ConnectionError', () => {
    it('wraps the original error', () => {
      const cause = new Error('ECONNREFUSED');
      const err = new ConnectionError('https://example.com', cause);
      assert.equal(err.name, 'ConnectionError');
      assert.ok(err.message.includes('example.com'));
      assert.ok(err.message.includes('ECONNREFUSED'));
      assert.equal(err.cause, cause);
    });

    it('is an instance of JsafError', () => {
      assert.ok(new ConnectionError('x', new Error('y')) instanceof JsafError);
    });
  });

  describe('AuthError', () => {
    it('includes target in message', () => {
      const err = new AuthError('https://jenkins.local');
      assert.equal(err.name, 'AuthError');
      assert.ok(err.message.includes('jenkins.local'));
      assert.ok(err.message.includes('Authentication failed'));
    });
  });

  describe('ConfigError', () => {
    it('includes key and detail', () => {
      const err = new ConfigError('jenkins.url', 'URL is required');
      assert.equal(err.name, 'ConfigError');
      assert.ok(err.message.includes('jenkins.url'));
      assert.ok(err.message.includes('URL is required'));
    });
  });

  describe('CommandError', () => {
    it('stores exit code and stderr', () => {
      const err = new CommandError('git push', 128, 'fatal: remote rejected');
      assert.equal(err.name, 'CommandError');
      assert.equal(err.exitCode, 128);
      assert.equal(err.stderr, 'fatal: remote rejected');
      assert.ok(err.message.includes('128'));
      assert.ok(err.message.includes('git push'));
    });

    it('handles empty stderr', () => {
      const err = new CommandError('ls', 1, '');
      assert.equal(err.exitCode, 1);
      assert.equal(err.stderr, '');
    });
  });
});
