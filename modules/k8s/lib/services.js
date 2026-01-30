'use strict';

class K8sServices {
  constructor(client) {
    this.client = client;
  }

  async list(namespace) {
    const path = this.client._path('services', null, namespace);
    const data = await this.client.request('GET', path);
    return data.items;
  }

  async get(name, namespace) {
    const path = this.client._path('services', name, namespace);
    return this.client.request('GET', path);
  }

  async delete(name, namespace) {
    const path = this.client._path('services', name, namespace);
    return this.client.request('DELETE', path);
  }
}

module.exports = { K8sServices };
