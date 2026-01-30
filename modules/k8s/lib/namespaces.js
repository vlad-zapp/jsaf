'use strict';

class K8sNamespaces {
  constructor(client) {
    this.client = client;
  }

  async list() {
    const path = this.client._path('namespaces');
    const data = await this.client.request('GET', path);
    return data.items;
  }

  async get(name) {
    const path = this.client._path('namespaces', name);
    return this.client.request('GET', path);
  }

  async create(name) {
    const path = this.client._path('namespaces');
    return this.client.request('POST', path, {
      body: JSON.stringify({
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { name },
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async delete(name) {
    const path = this.client._path('namespaces', name);
    return this.client.request('DELETE', path);
  }
}

module.exports = { K8sNamespaces };
