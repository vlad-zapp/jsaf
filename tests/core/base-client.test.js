'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { BaseClient } = require('../../modules/core/lib/base-client');

describe('BaseClient', () => {
  describe('_authHeaders', () => {
    it('returns Bearer header for token auth', () => {
      const client = new BaseClient({ url: 'http://test', auth: { token: 'abc123' } });
      const headers = client._authHeaders();
      assert.equal(headers.Authorization, 'Bearer abc123');
    });

    it('returns Basic header for user/password auth', () => {
      const client = new BaseClient({ url: 'http://test', auth: { user: 'admin', password: 'secret' } });
      const headers = client._authHeaders();
      const expected = 'Basic ' + Buffer.from('admin:secret').toString('base64');
      assert.equal(headers.Authorization, expected);
    });

    it('returns empty object with no auth', () => {
      const client = new BaseClient({ url: 'http://test', auth: {} });
      const headers = client._authHeaders();
      assert.deepEqual(headers, {});
    });

    it('prefers token over user/password', () => {
      const client = new BaseClient({
        url: 'http://test',
        auth: { token: 'mytoken', user: 'admin', password: 'pass' },
      });
      const headers = client._authHeaders();
      assert.equal(headers.Authorization, 'Bearer mytoken');
    });
  });

  describe('constructor defaults', () => {
    it('sets default timeout', () => {
      const client = new BaseClient({ url: 'http://test' });
      assert.equal(client.timeout, 30000);
    });

    it('sets default retries to 0', () => {
      const client = new BaseClient({ url: 'http://test' });
      assert.equal(client.retries, 0);
    });

    it('stores base URL', () => {
      const client = new BaseClient({ url: 'http://example.com' });
      assert.equal(client.baseUrl, 'http://example.com');
    });

    it('accepts custom timeout', () => {
      const client = new BaseClient({ url: 'http://test', timeout: 5000 });
      assert.equal(client.timeout, 5000);
    });
  });
});
