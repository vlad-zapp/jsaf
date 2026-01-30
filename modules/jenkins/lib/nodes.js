'use strict';

class JenkinsNodes {
  constructor(client) {
    this.client = client;
  }

  async list() {
    const data = await this.client.request(
      'GET',
      '/computer/api/json?tree=computer[displayName,offline,temporarilyOffline,idle,numExecutors]'
    );
    return data.computer;
  }

  async get(name) {
    const nodeName = name === 'master' || name === 'built-in' ? '(master)' : name;
    return this.client.request(
      'GET',
      `/computer/${encodeURIComponent(nodeName)}/api/json`
    );
  }

  async offline(name, reason = '') {
    const nodeName = name === 'master' || name === 'built-in' ? '(master)' : name;
    const qs = reason ? `?offlineMessage=${encodeURIComponent(reason)}` : '';
    return this.client.request(
      'POST',
      `/computer/${encodeURIComponent(nodeName)}/toggleOffline${qs}`
    );
  }

  async online(name) {
    const nodeName = name === 'master' || name === 'built-in' ? '(master)' : name;
    return this.client.request(
      'POST',
      `/computer/${encodeURIComponent(nodeName)}/toggleOffline`
    );
  }
}

module.exports = { JenkinsNodes };
