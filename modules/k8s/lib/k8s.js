'use strict';

const { exec, Logger, Config } = require('@jsaf/core');
const { K8sPods } = require('./pods');
const { K8sDeployments } = require('./deployments');
const { K8sServices } = require('./services');
const { K8sNamespaces } = require('./namespaces');
const { K8sConfigMaps } = require('./configmaps');
const { K8sSecrets } = require('./secrets');

class K8s {
  constructor(options = {}) {
    const cfg = new Config();
    this.kubeconfig = options.kubeconfig || cfg.get('k8s.kubeconfig');
    this.context = options.context || cfg.get('k8s.context');
    this.namespace = options.namespace || cfg.get('k8s.namespace', 'default');
    this.logger = options.logger || new Logger(options.logLevel || cfg.get('k8s.logLevel', 'info'));

    this.pods = new K8sPods(this);
    this.deployments = new K8sDeployments(this);
    this.services = new K8sServices(this);
    this.namespaces = new K8sNamespaces(this);
    this.configmaps = new K8sConfigMaps(this);
    this.secrets = new K8sSecrets(this);
  }

  async kubectl(args, options = {}) {
    const baseArgs = [];
    if (this.kubeconfig) baseArgs.push('--kubeconfig', this.kubeconfig);
    if (this.context) baseArgs.push('--context', this.context);
    if (options.namespace !== false) {
      baseArgs.push('-n', options.namespace || this.namespace);
    }
    const fullArgs = [...baseArgs, ...args];
    this.logger.debug(`kubectl ${fullArgs.join(' ')}`);
    return exec('kubectl', fullArgs, { timeout: options.timeout || 30000 });
  }

  async kubectlJson(args, options = {}) {
    const { stdout } = await this.kubectl([...args, '-o', 'json'], options);
    return JSON.parse(stdout);
  }

  async apply(manifest, options = {}) {
    if (typeof manifest === 'string' && !manifest.includes('\n')) {
      return this.kubectl(['apply', '-f', manifest], options);
    }
    // Inline YAML/JSON via stdin
    const { execFile } = require('child_process');
    const baseArgs = [];
    if (this.kubeconfig) baseArgs.push('--kubeconfig', this.kubeconfig);
    if (this.context) baseArgs.push('--context', this.context);
    if (options.namespace !== false) {
      baseArgs.push('-n', options.namespace || this.namespace);
    }
    const fullArgs = [...baseArgs, 'apply', '-f', '-'];
    return new Promise((resolve, reject) => {
      const proc = execFile('kubectl', fullArgs, { timeout: 30000 }, (err, stdout, stderr) => {
        if (err) {
          const { CommandError } = require('@jsaf/core');
          reject(new CommandError(`kubectl apply`, err.code, stderr));
        } else {
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        }
      });
      proc.stdin.write(manifest);
      proc.stdin.end();
    });
  }

  async delete(resource, name, options = {}) {
    const args = ['delete', resource, name];
    if (options.force) args.push('--force', '--grace-period=0');
    return this.kubectl(args, options);
  }

  async get(resource, name, options = {}) {
    const args = ['get', resource];
    if (name) args.push(name);
    return this.kubectlJson(args, options);
  }

  async describe(resource, name, options = {}) {
    const { stdout } = await this.kubectl(['describe', resource, name], options);
    return stdout;
  }
}

module.exports = { K8s };
