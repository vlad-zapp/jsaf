'use strict';

const { JsafError, HttpError, ConnectionError, ConfigError } = require('./errors');
const { Logger } = require('./logger');

class BaseClient {
  constructor(config = {}) {
    this.baseUrl = config.url;
    this.auth = config.auth || {};
    this.timeout = config.timeout || 30000;
    this.retries = config.retries ?? 0;
    this.retryDelay = config.retryDelay || 1000;
    this.rejectUnauthorized = config.rejectUnauthorized ?? true;
    this._dispatcher = config.dispatcher || null;
    this.logger = config.logger || new Logger(config.logLevel || 'info');
  }

  async request(method, urlPath, options = {}) {
    if (!this.baseUrl) {
      throw new ConfigError('url', 'No URL configured. Set "url" in your config or pass it to the constructor.');
    }
    const url = new URL(urlPath, this.baseUrl);
    const headers = { ...this._authHeaders(), ...options.headers };
    const fetchOpts = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (options.body !== undefined) {
      fetchOpts.body = options.body;
    }

    if (this._dispatcher) {
      fetchOpts.dispatcher = this._dispatcher;
    }

    if (!this.rejectUnauthorized) {
      // Disable TLS verification for self-signed certs
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    let lastError;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        this.logger.debug(`${method} ${url} (attempt ${attempt + 1})`);
        const res = await fetch(url, fetchOpts);
        if (!res.ok) {
          const body = await res.text();
          throw new HttpError(method, url.toString(), res.status, body);
        }
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('json')) return res.json();
        return res.text();
      } catch (err) {
        if (err instanceof JsafError) {
          lastError = err;
        } else {
          lastError = new ConnectionError(url.toString(), err);
        }
        if (attempt < this.retries) {
          const delay = this.retryDelay * (attempt + 1);
          this.logger.warn(`Request failed, retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }

  _authHeaders() {
    if (this.auth.token) {
      return { Authorization: `Bearer ${this.auth.token}` };
    }
    if (this.auth.user && this.auth.password) {
      const b64 = Buffer.from(`${this.auth.user}:${this.auth.password}`).toString('base64');
      return { Authorization: `Basic ${b64}` };
    }
    return {};
  }

}

module.exports = { BaseClient };
