'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  extractParams, resolveInfo, formatInfo, generateDocsData, DOCS,
} = require('../../modules/core/lib/method-info');

describe('method-info', () => {
  describe('extractParams', () => {
    it('extracts simple params', () => {
      const fn = function (a, b, c) {};
      assert.deepEqual(extractParams(fn), ['a', 'b', 'c']);
    });

    it('marks default params with ?', () => {
      const fn = function (name, options = {}) {};
      assert.deepEqual(extractParams(fn), ['name', 'options?']);
    });

    it('handles arrow functions', () => {
      const fn = (x, y) => x + y;
      assert.deepEqual(extractParams(fn), ['x', 'y']);
    });

    it('returns empty for no-param functions', () => {
      const fn = function () {};
      assert.deepEqual(extractParams(fn), []);
    });

    it('handles async functions', () => {
      const fn = async function (name, params = {}, options = {}) {};
      assert.deepEqual(extractParams(fn), ['name', 'params?', 'options?']);
    });

    it('handles destructured defaults', () => {
      const fn = function (a, b = { x: 1, y: 2 }) {};
      const params = extractParams(fn);
      assert.equal(params[0], 'a');
      assert.ok(params[1].startsWith('b'));
    });
  });

  describe('DOCS', () => {
    it('has entries for all expected modules', () => {
      const expected = ['jenkins', 'k8s', 'ssh', 'docker', 'git', 'aq', 'gerrit'];
      for (const mod of expected) {
        assert.ok(DOCS[mod], `DOCS should have "${mod}" module`);
      }
    });

    it('jenkins docs include new methods', () => {
      assert.ok(DOCS.jenkins['jobs.buildAndWait']);
      assert.ok(DOCS.jenkins['jobs.setConfig']);
      assert.ok(DOCS.jenkins['jobs.getPipeline']);
      assert.ok(DOCS.jenkins['jobs.setPipeline']);
    });

    it('jenkins docs use get/set naming', () => {
      assert.ok(DOCS.jenkins['jobs.getConfig']);
      assert.ok(DOCS.jenkins['builds.getLatest']);
      assert.ok(DOCS.jenkins['builds.getLog']);
      assert.ok(DOCS.jenkins['nodes.setOffline']);
      assert.ok(DOCS.jenkins['nodes.setOnline']);
      assert.ok(DOCS.jenkins['groovy.getSystemMessage']);
      assert.ok(DOCS.jenkins['groovy.getRunningBuilds']);
    });

    it('k8s docs use get/set naming', () => {
      assert.ok(DOCS.k8s['getVersion']);
      assert.ok(DOCS.k8s['deployments.getStatus']);
      assert.ok(DOCS.k8s['deployments.setImage']);
      assert.ok(DOCS.k8s['deployments.getHistory']);
      assert.ok(DOCS.k8s['pods.getLogs']);
    });

    it('docker docs use get/set naming', () => {
      assert.ok(DOCS.docker['getInfo']);
      assert.ok(DOCS.docker['getVersion']);
      assert.ok(DOCS.docker['containers.getLogs']);
      assert.ok(DOCS.docker['containers.getStats']);
      assert.ok(DOCS.docker['containers.getTop']);
      assert.ok(DOCS.docker['images.getHistory']);
    });

    it('git docs use get/set naming', () => {
      assert.ok(DOCS.git['getTags']);
      assert.ok(DOCS.git['getStatus']);
      assert.ok(DOCS.git['getLog']);
      assert.ok(DOCS.git['getDiff']);
      assert.ok(DOCS.git['getCurrentBranch']);
      assert.ok(DOCS.git['getRemoteUrl']);
      assert.ok(DOCS.git['getRemotes']);
      assert.ok(DOCS.git['getRev']);
    });

    it('gerrit docs use get/set naming', () => {
      assert.ok(DOCS.gerrit['getVersion']);
      assert.ok(DOCS.gerrit['groups.getMembers']);
    });

    it('every doc entry has desc field', () => {
      for (const [modName, modDocs] of Object.entries(DOCS)) {
        for (const [methodPath, doc] of Object.entries(modDocs)) {
          if (typeof doc === 'string') continue;
          assert.ok(doc.desc, `${modName}.${methodPath} should have desc`);
        }
      }
    });
  });

  describe('resolveInfo', () => {
    it('resolves a function on an object', () => {
      const ctx = {
        myFn: function (a, b) {},
      };
      const info = resolveInfo(ctx, 'myFn');
      assert.equal(info.type, 'function');
      assert.deepEqual(info.params, ['a', 'b']);
    });

    it('resolves nested objects', () => {
      const ctx = {
        group: {
          doStuff: function (x) {},
        },
      };
      const info = resolveInfo(ctx, 'group');
      assert.equal(info.type, 'object');
    });

    it('returns null for missing paths', () => {
      const info = resolveInfo({}, 'nonexistent.deep.path');
      assert.equal(info, null);
    });
  });

  describe('formatInfo', () => {
    it('formats function info', () => {
      const info = {
        type: 'function',
        path: 'test.fn',
        params: ['a', 'b?'],
        desc: 'A test function',
        argDescs: { a: 'First arg' },
        returns: 'string',
      };
      const out = formatInfo(info);
      assert.ok(out.includes('test.fn(a, b?)'));
      assert.ok(out.includes('A test function'));
      assert.ok(out.includes('Returns: string'));
      assert.ok(out.includes('First arg'));
    });

    it('formats object info', () => {
      const info = {
        type: 'object',
        path: 'my.module',
        methods: [
          { name: 'list', params: [], desc: 'List items' },
          { name: 'get', params: ['id'], desc: 'Get item' },
        ],
      };
      const out = formatInfo(info);
      assert.ok(out.includes('my.module'));
      assert.ok(out.includes('list()'));
      assert.ok(out.includes('get(id)'));
    });

    it('returns fallback for null', () => {
      const out = formatInfo(null);
      assert.ok(out.includes('No info'));
    });
  });

  describe('generateDocsData', () => {
    it('returns an array of modules', () => {
      const data = generateDocsData(null);
      assert.ok(Array.isArray(data));
      assert.ok(data.length > 0);
    });

    it('each module has name and methods', () => {
      const data = generateDocsData(null);
      for (const mod of data) {
        assert.ok(mod.module, 'should have module name');
        assert.ok(Array.isArray(mod.methods), 'should have methods array');
      }
    });

    it('methods have expected shape', () => {
      const data = generateDocsData(null);
      const jenkins = data.find((m) => m.module === 'jenkins');
      assert.ok(jenkins);
      for (const method of jenkins.methods) {
        assert.ok(method.path, 'method should have path');
        assert.ok(method.fullPath, 'method should have fullPath');
        assert.ok(method.signature, 'method should have signature');
        assert.equal(typeof method.desc, 'string');
      }
    });
  });
});
