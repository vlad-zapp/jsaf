'use strict';

class DockerVolumes {
  constructor(client) {
    this.client = client;
  }

  async list() {
    const data = await this.client.request('GET', '/volumes');
    return data.Volumes || [];
  }

  async get(name) {
    return this.client.request('GET', `/volumes/${encodeURIComponent(name)}`);
  }

  async create(name, options = {}) {
    return this.client.request('POST', '/volumes/create', {
      body: JSON.stringify({ Name: name, Driver: options.driver || 'local', ...options }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async remove(name, force = false) {
    return this.client.request('DELETE', `/volumes/${encodeURIComponent(name)}?force=${force}`);
  }

  async prune() {
    return this.client.request('POST', '/volumes/prune');
  }
}

module.exports = { DockerVolumes };
