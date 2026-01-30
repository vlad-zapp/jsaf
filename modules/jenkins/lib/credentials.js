'use strict';

class JenkinsCredentials {
  constructor(client) {
    this.client = client;
  }

  async list(domain = '_') {
    const data = await this.client.request(
      'GET',
      `/credentials/store/system/domain/${encodeURIComponent(domain)}/api/json?tree=credentials[id,typeName,displayName,description]`
    );
    return data.credentials;
  }

  async get(id, domain = '_') {
    return this.client.request(
      'GET',
      `/credentials/store/system/domain/${encodeURIComponent(domain)}/credential/${encodeURIComponent(id)}/api/json`
    );
  }

  async create(xmlConfig, domain = '_') {
    return this.client.request(
      'POST',
      `/credentials/store/system/domain/${encodeURIComponent(domain)}/createCredentials`,
      {
        body: xmlConfig,
        headers: { 'Content-Type': 'application/xml' },
      }
    );
  }

  async delete(id, domain = '_') {
    return this.client.request(
      'POST',
      `/credentials/store/system/domain/${encodeURIComponent(domain)}/credential/${encodeURIComponent(id)}/doDelete`
    );
  }
}

module.exports = { JenkinsCredentials };
