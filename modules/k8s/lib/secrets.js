'use strict';

class K8sSecrets {
  constructor(client) {
    this.client = client;
  }

  async list(namespace) {
    const path = this.client._path('secrets', null, namespace);
    const data = await this.client.request('GET', path);
    return data.items;
  }

  async get(name, namespace) {
    const path = this.client._path('secrets', name, namespace);
    return this.client.request('GET', path);
  }

  async create(name, data = {}, namespace) {
    const encoded = {};
    for (const [key, value] of Object.entries(data)) {
      encoded[key] = Buffer.from(String(value)).toString('base64');
    }
    const path = this.client._path('secrets', null, namespace);
    return this.client.request('POST', path, {
      body: JSON.stringify({
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: { name },
        type: 'Opaque',
        data: encoded,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async delete(name, namespace) {
    const path = this.client._path('secrets', name, namespace);
    return this.client.request('DELETE', path);
  }
}

module.exports = { K8sSecrets };
