'use strict';

const fs = require('fs');
const { BaseClient, Config, ConfigError, HttpError } = require('@jsaf/core');
const { Agent } = require('undici');
const { loadKubeconfig, execCredentialPlugin } = require('./kubeconfig');
const { K8sPods } = require('./pods');
const { K8sDeployments } = require('./deployments');
const { K8sServices } = require('./services');
const { K8sNamespaces } = require('./namespaces');
const { K8sConfigMaps } = require('./configmaps');
const { K8sSecrets } = require('./secrets');

// Resource type → API group metadata
const RESOURCES = {
  pods:        { prefix: '/api/v1', name: 'pods', namespaced: true },
  services:    { prefix: '/api/v1', name: 'services', namespaced: true },
  namespaces:  { prefix: '/api/v1', name: 'namespaces', namespaced: false },
  configmaps:  { prefix: '/api/v1', name: 'configmaps', namespaced: true },
  secrets:     { prefix: '/api/v1', name: 'secrets', namespaced: true },
  events:      { prefix: '/api/v1', name: 'events', namespaced: true },
  deployments: { prefix: '/apis/apps/v1', name: 'deployments', namespaced: true },
  replicasets: { prefix: '/apis/apps/v1', name: 'replicasets', namespaced: true },
};

// Kind (e.g. "Deployment") → resource name (e.g. "deployments")
const KIND_TO_RESOURCE = {
  Pod: 'pods',
  Service: 'services',
  Namespace: 'namespaces',
  ConfigMap: 'configmaps',
  Secret: 'secrets',
  Deployment: 'deployments',
  ReplicaSet: 'replicasets',
  Event: 'events',
};

class K8s extends BaseClient {
  constructor(options = {}) {
    const cfg = new Config();

    let server, token, ca, clientCert, clientKey, namespace, skipTLS, execPlugin;

    if (options.server || cfg.get('k8s.server')) {
      // Direct configuration — no kubeconfig needed
      server = options.server || cfg.get('k8s.server');
      token = options.token || cfg.get('k8s.token');
      ca = options.ca ? Buffer.from(options.ca) : null;
      namespace = options.namespace || cfg.get('k8s.namespace', 'default');
      skipTLS = options.skipTLS || false;
    } else {
      // Kubeconfig-based configuration
      const kc = loadKubeconfig({
        kubeconfig: options.kubeconfig || cfg.get('k8s.kubeconfig'),
        context: options.context || cfg.get('k8s.context'),
      });
      server = kc.server;
      token = kc.token;
      ca = kc.ca;
      clientCert = kc.clientCert;
      clientKey = kc.clientKey;
      namespace = options.namespace || cfg.get('k8s.namespace') || kc.namespace;
      skipTLS = kc.skipTLS || false;
      execPlugin = kc.execPlugin;
    }

    if (!server) {
      throw new ConfigError('k8s.server', 'No Kubernetes API server configured. Set "server" in config or provide a kubeconfig.');
    }

    // Build undici Agent with custom TLS options
    const connect = {};
    if (ca) connect.ca = [ca];
    if (clientCert) { connect.cert = clientCert; connect.key = clientKey; }
    if (skipTLS) connect.rejectUnauthorized = false;
    const hasConnect = Object.keys(connect).length > 0;
    const dispatcher = hasConnect ? new Agent({ connect }) : null;

    super({
      url: server,
      auth: token ? { token } : {},
      timeout: options.timeout || cfg.get('k8s.timeout', 30000),
      retries: options.retries ?? cfg.get('k8s.retries', 0),
      retryDelay: options.retryDelay || cfg.get('k8s.retryDelay', 1000),
      logLevel: options.logLevel || cfg.get('k8s.logLevel', 'info'),
      dispatcher,
    });

    this.namespace = namespace;
    this._execPlugin = execPlugin || null;
    this._tokenExpiry = null;
    this._versionCache = null;

    this.pods = new K8sPods(this);
    this.deployments = new K8sDeployments(this);
    this.services = new K8sServices(this);
    this.namespaces = new K8sNamespaces(this);
    this.configmaps = new K8sConfigMaps(this);
    this.secrets = new K8sSecrets(this);
  }

  async request(method, urlPath, options = {}) {
    if (this._execPlugin) {
      await this._refreshExecToken();
    }
    return super.request(method, urlPath, options);
  }

  async _refreshExecToken() {
    if (this._tokenExpiry && this._tokenExpiry > Date.now() + 30000) return;
    const cred = await execCredentialPlugin(this._execPlugin);
    if (cred.token) {
      this.auth.token = cred.token;
      this._tokenExpiry = cred.expiration ? cred.expiration.getTime() : null;
    }
  }

  /**
   * Build a Kubernetes API path for a resource.
   */
  _path(resource, name, namespace, subresource) {
    const r = RESOURCES[resource];
    if (!r) throw new Error(`Unknown resource type: ${resource}`);
    let p = r.prefix;
    if (r.namespaced) {
      p += `/namespaces/${namespace || this.namespace}`;
    }
    p += `/${r.name}`;
    if (name) p += `/${name}`;
    if (subresource) p += `/${subresource}`;
    return p;
  }

  /**
   * Get a single resource by type and name.
   */
  async get(resource, name, options = {}) {
    return this.request('GET', this._path(resource, name, options.namespace));
  }

  /**
   * List resources of a given type.
   */
  async list(resource, options = {}) {
    const p = this._path(resource, null, options.namespace);
    const params = new URLSearchParams();
    if (options.labelSelector) params.set('labelSelector', options.labelSelector);
    if (options.fieldSelector) params.set('fieldSelector', options.fieldSelector);
    const qs = params.toString();
    return this.request('GET', p + (qs ? '?' + qs : ''));
  }

  /**
   * Delete a resource.
   */
  async delete(resource, name, options = {}) {
    const body = {};
    if (options.force) body.gracePeriodSeconds = 0;
    return this.request('DELETE', this._path(resource, name, options.namespace), {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Apply a manifest (object, YAML/JSON string, or file path).
   * Uses server-side apply on K8s 1.16+, falls back to create-or-update on older clusters.
   */
  async apply(manifest, options = {}) {
    let obj;
    let bodyStr;

    if (typeof manifest === 'string') {
      if (!manifest.includes('\n') && !manifest.trimStart().startsWith('{')) {
        manifest = fs.readFileSync(manifest, 'utf8');
      }
      const { parse } = require('aq');
      obj = parse(manifest);
      bodyStr = manifest;
    } else {
      obj = manifest;
      bodyStr = JSON.stringify(manifest);
    }

    const resource = KIND_TO_RESOURCE[obj.kind] || (obj.kind.toLowerCase() + 's');
    const ns = obj.metadata?.namespace || options.namespace;
    const name = obj.metadata?.name;
    const p = this._path(resource, name, ns);

    // Try server-side apply first (K8s 1.16+)
    try {
      const fieldManager = options.fieldManager || 'jsaf';
      const force = options.force ?? true;
      const qs = `?fieldManager=${encodeURIComponent(fieldManager)}&force=${force}`;
      return await this.request('PATCH', p + qs, {
        body: bodyStr,
        headers: { 'Content-Type': 'application/apply-patch+yaml' },
      });
    } catch (err) {
      // 415 = Unsupported Media Type, 400/405 = older API may reject apply-patch
      if (err instanceof HttpError && [415, 400, 405].includes(err.statusCode)) {
        this.logger.info('Server-side apply not supported, falling back to create-or-update');
        return this._applyFallback(resource, name, ns, obj);
      }
      throw err;
    }
  }

  /**
   * Fallback for clusters without server-side apply: GET → PUT (update) or POST (create).
   */
  async _applyFallback(resource, name, namespace, obj) {
    const jsonBody = JSON.stringify(obj);
    const jsonHeaders = { 'Content-Type': 'application/json' };

    if (name) {
      try {
        // Check if resource exists
        await this.request('GET', this._path(resource, name, namespace));
        // Exists → update
        return this.request('PUT', this._path(resource, name, namespace), {
          body: jsonBody,
          headers: jsonHeaders,
        });
      } catch (err) {
        if (err instanceof HttpError && err.statusCode === 404) {
          // Does not exist → create
          return this.request('POST', this._path(resource, null, namespace), {
            body: jsonBody,
            headers: jsonHeaders,
          });
        }
        throw err;
      }
    }

    // No name — create
    return this.request('POST', this._path(resource, null, namespace), {
      body: jsonBody,
      headers: jsonHeaders,
    });
  }

  /**
   * Get resource details along with related events.
   */
  async describe(resource, name, options = {}) {
    const obj = await this.get(resource, name, options);
    const ns = options.namespace || this.namespace;
    const r = RESOURCES[resource];
    let events = [];
    try {
      if (r && r.namespaced) {
        const eventsPath = this._path('events', null, ns);
        const qs = `?fieldSelector=${encodeURIComponent(`involvedObject.name=${name}`)}`;
        const evData = await this.request('GET', eventsPath + qs);
        events = evData.items || [];
      }
    } catch {
      // Events may not be available
    }
    return { resource: obj, events };
  }

  /**
   * Test connectivity to the cluster.
   */
  async ping() {
    return this.request('GET', '/api/v1');
  }

  /**
   * Get the Kubernetes cluster version info.
   * Returns { major, minor, gitVersion, platform, ... }.
   */
  async version() {
    if (!this._versionCache) {
      this._versionCache = await this.request('GET', '/version');
    }
    return this._versionCache;
  }

  /**
   * Parse major.minor from cached version. Returns [major, minor] as ints.
   */
  async _versionTuple() {
    const v = await this.version();
    const major = parseInt(v.major, 10) || 0;
    const minor = parseInt(String(v.minor).replace(/\D+$/, ''), 10) || 0;
    return [major, minor];
  }
}

module.exports = { K8s, RESOURCES };
