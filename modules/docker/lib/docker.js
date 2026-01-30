'use strict';

const http = require('http');
const https = require('https');
const { Config, Logger, HttpError } = require('@jsaf/core');
const { DockerContainers } = require('./containers');
const { DockerImages } = require('./images');
const { DockerVolumes } = require('./volumes');
const { DockerNetworks } = require('./networks');

class Docker {
  constructor(options = {}) {
    const cfg = new Config();
    this.socketPath = options.socketPath || cfg.get('docker.socketPath', '/var/run/docker.sock');
    this.host = options.host || cfg.get('docker.host');
    this.apiVersion = options.apiVersion || cfg.get('docker.apiVersion', 'v1.47');
    this.timeout = options.timeout || cfg.get('docker.timeout', 30000);
    this.logger = options.logger || new Logger(options.logLevel || cfg.get('docker.logLevel', 'info'));

    this.containers = new DockerContainers(this);
    this.images = new DockerImages(this);
    this.volumes = new DockerVolumes(this);
    this.networks = new DockerNetworks(this);
  }

  async request(method, urlPath, options = {}) {
    const versionedPath = `/${this.apiVersion}${urlPath}`;
    this.logger.debug(`Docker ${method} ${versionedPath}`);

    if (this.host) {
      // TCP mode using fetch
      const url = new URL(versionedPath, this.host.replace('tcp://', 'http://'));
      const fetchOpts = {
        method,
        headers: options.headers || {},
        signal: AbortSignal.timeout(this.timeout),
      };
      if (options.body !== undefined) fetchOpts.body = options.body;
      const res = await fetch(url, fetchOpts);
      return this._handleFetchResponse(method, versionedPath, res);
    }

    // Unix socket mode using Node's built-in http module
    return this._socketRequest(method, versionedPath, options);
  }

  _socketRequest(method, path, options = {}) {
    return new Promise((resolve, reject) => {
      const reqOpts = {
        socketPath: this.socketPath,
        path,
        method,
        headers: options.headers || {},
        timeout: this.timeout,
      };

      const req = http.request(reqOpts, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString();
          if (res.statusCode >= 400) {
            reject(new HttpError(method, path, res.statusCode, text));
            return;
          }
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('json')) {
            try {
              resolve(JSON.parse(text));
            } catch {
              resolve(text);
            }
          } else {
            resolve(text);
          }
        });
      });

      req.on('error', (err) => {
        reject(new (require('@jsaf/core').ConnectionError)(this.socketPath, err));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new (require('@jsaf/core').JsafError)(`Docker request timed out: ${method} ${path}`));
      });

      if (options.body !== undefined) {
        req.write(options.body);
      }
      req.end();
    });
  }

  async _handleFetchResponse(method, urlPath, res) {
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    if (!res.ok) {
      throw new HttpError(method, urlPath, res.status, text);
    }
    if (contentType.includes('json')) {
      return JSON.parse(text);
    }
    return text;
  }

  async ping() {
    return this.request('GET', '/_ping');
  }

  async info() {
    return this.request('GET', '/info');
  }

  async version() {
    return this.request('GET', '/version');
  }
}

module.exports = { Docker };
