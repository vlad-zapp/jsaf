'use strict';

class K8sPods {
  constructor(k8s) {
    this.k8s = k8s;
  }

  async list(namespace) {
    const data = await this.k8s.kubectlJson(['get', 'pods'], { namespace });
    return data.items;
  }

  async get(name, namespace) {
    return this.k8s.kubectlJson(['get', 'pod', name], { namespace });
  }

  async logs(name, options = {}) {
    const args = ['logs', name];
    if (options.container) args.push('-c', options.container);
    if (options.previous) args.push('--previous');
    if (options.tail) args.push('--tail', String(options.tail));
    if (options.since) args.push('--since', options.since);
    const { stdout } = await this.k8s.kubectl(args, { namespace: options.namespace });
    return stdout;
  }

  async exec(name, command, options = {}) {
    const args = ['exec', name];
    if (options.container) args.push('-c', options.container);
    args.push('--');
    if (Array.isArray(command)) {
      args.push(...command);
    } else {
      args.push('sh', '-c', command);
    }
    const { stdout } = await this.k8s.kubectl(args, { namespace: options.namespace });
    return stdout;
  }

  async delete(name, namespace) {
    return this.k8s.kubectl(['delete', 'pod', name], { namespace });
  }

  async wait(name, condition = 'Ready', timeout = 120, namespace) {
    return this.k8s.kubectl(
      ['wait', `--for=condition=${condition}`, `--timeout=${timeout}s`, 'pod', name],
      { namespace }
    );
  }
}

module.exports = { K8sPods };
