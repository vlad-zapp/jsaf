'use strict';

class K8sPods {
  constructor(client) {
    this.client = client;
  }

  async list(namespace) {
    const path = this.client._path('pods', null, namespace);
    const data = await this.client.request('GET', path);
    return data.items;
  }

  async get(name, namespace) {
    const path = this.client._path('pods', name, namespace);
    return this.client.request('GET', path);
  }

  async getLogs(name, options = {}) {
    const path = this.client._path('pods', name, options.namespace, 'log');
    const params = new URLSearchParams();
    if (options.container) params.set('container', options.container);
    if (options.previous) params.set('previous', 'true');
    if (options.tail) params.set('tailLines', String(options.tail));
    if (options.since) params.set('sinceSeconds', String(parseDuration(options.since)));
    const qs = params.toString();
    return this.client.request('GET', path + (qs ? '?' + qs : ''));
  }

  async exec() {
    throw new Error(
      'Pod exec via REST API requires WebSocket support, which is not yet implemented. ' +
      'Install kubectl and use it directly for exec.'
    );
  }

  async delete(name, namespace) {
    const path = this.client._path('pods', name, namespace);
    return this.client.request('DELETE', path);
  }

  async wait(name, condition = 'Ready', timeout = 120, namespace) {
    const deadline = Date.now() + (timeout * 1000);
    while (Date.now() < deadline) {
      const pod = await this.get(name, namespace);
      const conditions = pod.status?.conditions || [];
      const match = conditions.find((c) => c.type === condition);
      if (match && match.status === 'True') return pod;
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error(`Timeout waiting for pod ${name} condition ${condition} after ${timeout}s`);
  }
}

function parseDuration(since) {
  if (typeof since === 'number') return since;
  const match = String(since).match(/^(\d+)([smh])$/);
  if (!match) return parseInt(since, 10) || 300;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'h') return num * 3600;
  if (unit === 'm') return num * 60;
  return num;
}

module.exports = { K8sPods, parseDuration };
