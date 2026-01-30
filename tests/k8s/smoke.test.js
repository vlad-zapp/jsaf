'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

// Load the K8s module directly
const { K8s } = require('../../modules/k8s/lib/k8s');

describe('k8s (live cluster)', () => {
  let k8s;

  before(() => {
    k8s = new K8s({ logLevel: 'warn' });
  });

  describe('connectivity', () => {
    it('ping returns API resource list', async () => {
      const result = await k8s.ping();
      assert.ok(result.kind, 'ping result should have a kind');
      assert.ok(result.resources, 'ping result should have resources');
    });

    it('version returns cluster version info', async () => {
      const v = await k8s.version();
      assert.ok(v.major, 'version should have major');
      assert.ok(v.minor, 'version should have minor');
      assert.ok(v.gitVersion, 'version should have gitVersion');
      console.log(`  Cluster version: ${v.gitVersion}`);
    });

    it('version is cached on second call', async () => {
      const v1 = await k8s.version();
      const v2 = await k8s.version();
      assert.strictEqual(v1, v2, 'should return same cached object');
    });
  });

  describe('namespaces', () => {
    it('lists namespaces', async () => {
      const ns = await k8s.namespaces.list();
      assert.ok(Array.isArray(ns), 'should return array');
      assert.ok(ns.length > 0, 'should have at least one namespace');
      const names = ns.map((n) => n.metadata.name);
      assert.ok(names.includes('default'), 'should include "default" namespace');
      assert.ok(names.includes('kube-system'), 'should include "kube-system" namespace');
    });

    it('gets a single namespace', async () => {
      const ns = await k8s.namespaces.get('default');
      assert.equal(ns.metadata.name, 'default');
      assert.equal(ns.kind, 'Namespace');
    });
  });

  describe('pods', () => {
    it('lists pods in kube-system', async () => {
      const pods = await k8s.pods.list('kube-system');
      assert.ok(Array.isArray(pods), 'should return array');
      assert.ok(pods.length > 0, 'kube-system should have pods');
      console.log(`  kube-system pods: ${pods.map((p) => p.metadata.name).join(', ')}`);
    });

    it('gets a specific pod', async () => {
      const pods = await k8s.pods.list('kube-system');
      const first = pods[0];
      const pod = await k8s.pods.get(first.metadata.name, 'kube-system');
      assert.equal(pod.metadata.name, first.metadata.name);
      assert.equal(pod.kind, 'Pod');
    });

    it('gets pod logs', async () => {
      const pods = await k8s.pods.list('kube-system');
      const running = pods.find((p) => p.status?.phase === 'Running');
      assert.ok(running, 'should have a running pod');
      const logs = await k8s.pods.logs(running.metadata.name, {
        namespace: 'kube-system',
        tail: 5,
      });
      assert.equal(typeof logs, 'string');
    });
  });

  describe('deployments', () => {
    it('lists deployments in kube-system', async () => {
      const deploys = await k8s.deployments.list('kube-system');
      assert.ok(Array.isArray(deploys), 'should return array');
      console.log(`  kube-system deployments: ${deploys.map((d) => d.metadata.name).join(', ')}`);
    });
  });

  describe('services', () => {
    it('lists services in default namespace', async () => {
      const svcs = await k8s.services.list('default');
      assert.ok(Array.isArray(svcs), 'should return array');
      const names = svcs.map((s) => s.metadata.name);
      assert.ok(names.includes('kubernetes'), 'should include "kubernetes" service');
    });

    it('gets the kubernetes service', async () => {
      const svc = await k8s.services.get('kubernetes', 'default');
      assert.equal(svc.metadata.name, 'kubernetes');
      assert.equal(svc.kind, 'Service');
    });
  });

  describe('configmaps', () => {
    it('lists configmaps in kube-system', async () => {
      const cms = await k8s.configmaps.list('kube-system');
      assert.ok(Array.isArray(cms), 'should return array');
      assert.ok(cms.length > 0, 'kube-system should have configmaps');
    });
  });

  describe('secrets', () => {
    it('lists secrets in kube-system', async () => {
      const secrets = await k8s.secrets.list('kube-system');
      assert.ok(Array.isArray(secrets), 'should return array');
    });
  });

  describe('top-level get/list/describe', () => {
    it('k8s.get() fetches a resource', async () => {
      const ns = await k8s.get('namespaces', 'default');
      assert.equal(ns.kind, 'Namespace');
      assert.equal(ns.metadata.name, 'default');
    });

    it('k8s.list() with labelSelector', async () => {
      const result = await k8s.list('pods', {
        namespace: 'kube-system',
        labelSelector: 'component=kube-apiserver',
      });
      assert.ok(result.items, 'should have items array');
    });

    it('k8s.describe() returns resource + events', async () => {
      const pods = await k8s.pods.list('kube-system');
      const first = pods[0];
      const desc = await k8s.describe('pods', first.metadata.name, { namespace: 'kube-system' });
      assert.ok(desc.resource, 'should have resource');
      assert.ok(Array.isArray(desc.events), 'should have events array');
    });
  });

  describe('CRUD lifecycle (configmap)', () => {
    const testName = `jsaf-test-${Date.now()}`;

    it('creates a configmap', async () => {
      const cm = await k8s.configmaps.create(testName, { key1: 'value1', key2: 'value2' });
      assert.equal(cm.metadata.name, testName);
      assert.equal(cm.data.key1, 'value1');
    });

    it('gets the created configmap', async () => {
      const cm = await k8s.configmaps.get(testName);
      assert.equal(cm.metadata.name, testName);
      assert.equal(cm.data.key2, 'value2');
    });

    it('deletes the configmap', async () => {
      const result = await k8s.configmaps.delete(testName);
      assert.ok(result);
    });
  });

  describe('CRUD lifecycle (secret)', () => {
    const testName = `jsaf-secret-${Date.now()}`;

    it('creates a secret (auto-base64-encodes)', async () => {
      const secret = await k8s.secrets.create(testName, { user: 'admin', pass: 'secret123' });
      assert.equal(secret.metadata.name, testName);
      // Values should be base64-encoded by the module
      assert.equal(Buffer.from(secret.data.user, 'base64').toString(), 'admin');
      assert.equal(Buffer.from(secret.data.pass, 'base64').toString(), 'secret123');
    });

    it('deletes the secret', async () => {
      const result = await k8s.secrets.delete(testName);
      assert.ok(result);
    });
  });

  describe('apply', () => {
    const testName = `jsaf-apply-${Date.now()}`;

    it('applies a manifest object', async () => {
      const result = await k8s.apply({
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: testName, namespace: 'default' },
        data: { applied: 'true' },
      });
      assert.equal(result.metadata.name, testName);
    });

    it('applies again (update)', async () => {
      const result = await k8s.apply({
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: testName, namespace: 'default' },
        data: { applied: 'true', updated: 'yes' },
      });
      assert.equal(result.data.updated, 'yes');
    });

    after(async () => {
      try { await k8s.configmaps.delete(testName); } catch { /* ignore */ }
    });
  });
});
