'use strict';

const { JsafError } = require('@jsaf/core');

function encodeJobPath(name) {
  return name.split('/').map(encodeURIComponent).join('/job/');
}

const XML_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
const XML_UNESCAPE = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };

function escapeXml(str) {
  return str.replace(/[&<>"']/g, (ch) => XML_ESCAPE[ch]);
}

function unescapeXml(str) {
  return str.replace(/&(?:amp|lt|gt|quot|apos);/g, (ent) => XML_UNESCAPE[ent]);
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

  async getConfig(name) {
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

  async buildAndWait(name, params = {}, options = {}) {
    const hasParams = Object.keys(params).length > 0;
    const endpoint = hasParams ? 'buildWithParameters' : 'build';
    const qs = hasParams ? '?' + new URLSearchParams(params).toString() : '';

    const { status, headers } = await this.client._rawRequest(
      'POST',
      `/job/${encodeJobPath(name)}/${endpoint}${qs}`
    );

    if (status < 200 || status >= 400) {
      throw new JsafError(`Failed to trigger build for ${name} (HTTP ${status})`, { name, status });
    }

    const location = headers.get('location') || '';
    const match = location.match(/\/queue\/item\/(\d+)/);
    if (!match) {
      throw new JsafError(`No queue item URL in response for ${name}`, { name, location });
    }

    const queueId = parseInt(match[1], 10);
    const buildNumber = await this.client.builds._pollQueueItem(queueId, options);
    return this.client.builds.waitFor(name, buildNumber, options);
  }

  async setConfig(name, xmlConfig) {
    return this.client.request('POST', `/job/${encodeJobPath(name)}/config.xml`, {
      body: xmlConfig,
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  async getPipeline(name) {
    const xml = await this.getConfig(name);
    const match = xml.match(/<script>([\s\S]*?)<\/script>/);
    if (!match) {
      throw new JsafError(`Job "${name}" is not a pipeline job (no <script> tag found)`, { name });
    }
    return unescapeXml(match[1]);
  }

  async setPipeline(name, script) {
    const xml = await this.getConfig(name);
    if (!/<script>[\s\S]*?<\/script>/.test(xml)) {
      throw new JsafError(`Job "${name}" is not a pipeline job (no <script> tag found)`, { name });
    }
    const newXml = xml.replace(
      /<script>[\s\S]*?<\/script>/,
      `<script>${escapeXml(script)}</script>`
    );
    return this.setConfig(name, newXml);
  }
}

module.exports = { JenkinsJobs, encodeJobPath, escapeXml, unescapeXml };
