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

  async latest(jobName) {
    return this.client.request(
      'GET',
      `/job/${encodeJobPath(jobName)}/lastBuild/api/json`
    );
  }

  async log(jobName, buildNumber) {
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

module.exports = { JenkinsBuilds };
