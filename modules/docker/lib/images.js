'use strict';

class DockerImages {
  constructor(client) {
    this.client = client;
  }

  async list(options = {}) {
    const params = new URLSearchParams();
    if (options.all) params.set('all', 'true');
    if (options.digests) params.set('digests', 'true');
    const qs = params.toString();
    return this.client.request('GET', `/images/json${qs ? '?' + qs : ''}`);
  }

  async get(name) {
    return this.client.request('GET', `/images/${encodeURIComponent(name)}/json`);
  }

  async pull(image, tag = 'latest') {
    const ref = `${image}:${tag}`;
    return this.client.request('POST', `/images/create?fromImage=${encodeURIComponent(image)}&tag=${encodeURIComponent(tag)}`);
  }

  async tag(source, repo, tag = 'latest') {
    return this.client.request(
      'POST',
      `/images/${encodeURIComponent(source)}/tag?repo=${encodeURIComponent(repo)}&tag=${encodeURIComponent(tag)}`
    );
  }

  async push(name, options = {}) {
    const headers = {};
    if (options.auth) {
      headers['X-Registry-Auth'] = Buffer.from(JSON.stringify(options.auth)).toString('base64');
    }
    return this.client.request('POST', `/images/${encodeURIComponent(name)}/push`, { headers });
  }

  async remove(name, options = {}) {
    const params = new URLSearchParams();
    if (options.force) params.set('force', 'true');
    if (options.noprune) params.set('noprune', 'true');
    const qs = params.toString();
    return this.client.request('DELETE', `/images/${encodeURIComponent(name)}${qs ? '?' + qs : ''}`);
  }

  async history(name) {
    return this.client.request('GET', `/images/${encodeURIComponent(name)}/history`);
  }

  async search(term) {
    return this.client.request('GET', `/images/search?term=${encodeURIComponent(term)}`);
  }

  async prune(options = {}) {
    const params = new URLSearchParams();
    if (options.dangling !== undefined) {
      params.set('filters', JSON.stringify({ dangling: [String(options.dangling)] }));
    }
    const qs = params.toString();
    return this.client.request('POST', `/images/prune${qs ? '?' + qs : ''}`);
  }
}

module.exports = { DockerImages };
