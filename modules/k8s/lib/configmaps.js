'use strict';

class K8sConfigMaps {
  constructor(client) {
    this.client = client;
  }

  async list(namespace) {
    const path = this.client._path('configmaps', null, namespace);
    const data = await this.client.request('GET', path);
    return data.items;
  }

  async get(name, namespace) {
    const path = this.client._path('configmaps', name, namespace);
    return this.client.request('GET', path);
  }

  async create(name, data = {}, namespace) {
    const path = this.client._path('configmaps', null, namespace);
    return this.client.request('POST', path, {
      body: JSON.stringify({
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name },
        data,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async delete(name, namespace) {
    const path = this.client._path('configmaps', name, namespace);
    return this.client.request('DELETE', path);
  }
}

module.exports = { K8sConfigMaps };
