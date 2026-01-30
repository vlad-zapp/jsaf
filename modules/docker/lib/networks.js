'use strict';

class DockerNetworks {
  constructor(client) {
    this.client = client;
  }

  async list() {
    return this.client.request('GET', '/networks');
  }

  async get(id) {
    return this.client.request('GET', `/networks/${id}`);
  }

  async create(name, options = {}) {
    return this.client.request('POST', '/networks/create', {
      body: JSON.stringify({ Name: name, Driver: options.driver || 'bridge', ...options }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async remove(id) {
    return this.client.request('DELETE', `/networks/${id}`);
  }

  async connect(networkId, containerId) {
    return this.client.request('POST', `/networks/${networkId}/connect`, {
      body: JSON.stringify({ Container: containerId }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async disconnect(networkId, containerId, force = false) {
    return this.client.request('POST', `/networks/${networkId}/disconnect`, {
      body: JSON.stringify({ Container: containerId, Force: force }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async prune() {
    return this.client.request('POST', '/networks/prune');
  }
}

module.exports = { DockerNetworks };
