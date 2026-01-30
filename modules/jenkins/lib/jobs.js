'use strict';

function encodeJobPath(name) {
  return name.split('/').map(encodeURIComponent).join('/job/');
}

class JenkinsJobs {
  constructor(client) {
    this.client = client;
  }

  async list(folder) {
    const basePath = folder ? `/job/${encodeJobPath(folder)}` : '';
    const data = await this.client.request('GET', `${basePath}/api/json?tree=jobs[name,color,url]`);
    return data.jobs;
  }

  async get(name) {
    return this.client.request('GET', `/job/${encodeJobPath(name)}/api/json`);
  }

  async build(name, params = {}) {
    const hasParams = Object.keys(params).length > 0;
    const endpoint = hasParams ? 'buildWithParameters' : 'build';
    const qs = hasParams ? '?' + new URLSearchParams(params).toString() : '';
    await this.client.request('POST', `/job/${encodeJobPath(name)}/${endpoint}${qs}`);
    return { triggered: true, job: name };
  }

  async config(name) {
    return this.client.request('GET', `/job/${encodeJobPath(name)}/config.xml`, {
      headers: { Accept: 'application/xml' },
    });
  }

  async create(name, xmlConfig) {
    return this.client.request('POST', `/createItem?name=${encodeURIComponent(name)}`, {
      body: xmlConfig,
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  async delete(name) {
    return this.client.request('POST', `/job/${encodeJobPath(name)}/doDelete`);
  }

  async enable(name) {
    return this.client.request('POST', `/job/${encodeJobPath(name)}/enable`);
  }

  async disable(name) {
    return this.client.request('POST', `/job/${encodeJobPath(name)}/disable`);
  }

  async exists(name) {
    try {
      await this.get(name);
      return true;
    } catch {
      return false;
    }
  }

  async copy(existingName, newName) {
    const qs = new URLSearchParams({
      name: newName,
      mode: 'copy',
      from: existingName,
    }).toString();
    return this.client.request('POST', `/createItem?${qs}`);
  }
}

module.exports = { JenkinsJobs };
