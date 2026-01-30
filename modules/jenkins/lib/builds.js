'use strict';

const { JsafError } = require('@jsaf/core');

function encodeJobPath(name) {
  return name.split('/').map(encodeURIComponent).join('/job/');
}

class JenkinsBuilds {
  constructor(client) {
    this.client = client;
  }

  async get(jobName, buildNumber) {
    return this.client.request(
      'GET',
      `/job/${encodeJobPath(jobName)}/${buildNumber}/api/json`
    );
  }

  async getLatest(jobName) {
    return this.client.request(
      'GET',
      `/job/${encodeJobPath(jobName)}/lastBuild/api/json`
    );
  }

  async getLog(jobName, buildNumber) {
    return this.client.request(
      'GET',
      `/job/${encodeJobPath(jobName)}/${buildNumber}/consoleText`
    );
  }

  async stop(jobName, buildNumber) {
    return this.client.request(
      'POST',
      `/job/${encodeJobPath(jobName)}/${buildNumber}/stop`
    );
  }

  async _pollQueueItem(queueId, options = {}) {
    const interval = options.interval || 2000;
    const timeout = options.timeout || 60000;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const item = await this.client.request('GET', `/queue/item/${queueId}/api/json`);
      if (item.cancelled) {
        throw new JsafError(`Queue item ${queueId} was cancelled`, { queueId });
      }
      if (item.executable && item.executable.number) {
        return item.executable.number;
      }
      await new Promise((r) => setTimeout(r, interval));
    }

    throw new JsafError(
      `Timeout waiting for queue item ${queueId} to start after ${timeout}ms`,
      { queueId }
    );
  }

  async waitFor(jobName, buildNumber, options = {}) {
    const interval = options.interval || 5000;
    const timeout = options.timeout || 600000;
    const start = Date.now();

    const num = buildNumber === 'lastBuild' ? 'lastBuild' : buildNumber;

    while (Date.now() - start < timeout) {
      try {
        const build = await this.get(jobName, num);
        if (!build.building) {
          return build;
        }
      } catch {
        // Build might not exist yet if just triggered
      }
      await new Promise((r) => setTimeout(r, interval));
    }

    throw new JsafError(
      `Timeout waiting for build ${jobName}#${buildNumber} after ${timeout}ms`,
      { jobName, buildNumber }
    );
  }
}

module.exports = { JenkinsBuilds, encodeJobPath };
