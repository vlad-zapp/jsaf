'use strict';

const { BaseClient, Config, ConfigError } = require('@jsaf/core');
const { JenkinsJobs } = require('./jobs');
const { JenkinsBuilds } = require('./builds');
const { JenkinsNodes } = require('./nodes');
const { JenkinsCredentials } = require('./credentials');
const { GroovyExecutor } = require('./groovy');

class Jenkins extends BaseClient {
  constructor(options = {}) {
    const cfg = new Config();
    const user = options.user || cfg.get('jenkins.user');
    const password = options.password || cfg.get('jenkins.password');
    const token = options.token || cfg.get('jenkins.token');

    const auth = options.auth || {};
    if (!auth.user && user) auth.user = user;
    // API token auth: Jenkins uses Basic auth with user:token
    if (!auth.password && token) {
      auth.password = token;
    } else if (!auth.password && password) {
      auth.password = password;
    }

    const merged = {
      url: options.url || cfg.get('jenkins.url'),
      auth,
      rejectUnauthorized: options.rejectUnauthorized ?? cfg.get('jenkins.rejectUnauthorized', true),
      timeout: options.timeout || cfg.get('jenkins.timeout', 30000),
      retries: options.retries ?? cfg.get('jenkins.retries', 0),
      retryDelay: options.retryDelay || cfg.get('jenkins.retryDelay', 1000),
      logLevel: options.logLevel || cfg.get('jenkins.logLevel', 'info'),
    };

    super(merged);
    this._crumb = null;

    this.jobs = new JenkinsJobs(this);
    this.builds = new JenkinsBuilds(this);
    this.nodes = new JenkinsNodes(this);
    this.credentials = new JenkinsCredentials(this);
    this.groovy = new GroovyExecutor(this);
  }

  async request(method, urlPath, options = {}) {
    if (!this.auth.user || !this.auth.password) {
      throw new ConfigError('user/token', 'No Jenkins authentication configured. Set "user" and "token" (or "password") in your config.');
    }
    if (['POST', 'PUT', 'DELETE'].includes(method) && !this._crumb) {
      await this._fetchCrumb();
    }
    if (this._crumb && this._crumb.field && ['POST', 'PUT', 'DELETE'].includes(method)) {
      options.headers = {
        ...options.headers,
        [this._crumb.field]: this._crumb.value,
      };
      if (this._sessionCookie) {
        options.headers['Cookie'] = this._sessionCookie;
      }
    }
    return super.request(method, urlPath, options);
  }

  async _fetchCrumb() {
    try {
      // Fetch crumb and capture session cookie
      const url = new URL('/crumbIssuer/api/json', this.baseUrl);
      const headers = this._authHeaders();
      const res = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(this.timeout),
      });
      if (!res.ok) {
        this._crumb = { field: null, value: null };
        return;
      }
      // Capture session cookie from Set-Cookie header
      const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      if (setCookie.length > 0) {
        this._sessionCookie = setCookie
          .map((c) => c.split(';')[0])
          .join('; ');
      }
      const data = await res.json();
      this._crumb = { field: data.crumbRequestField, value: data.crumb };
    } catch {
      // CSRF crumb might be disabled
      this._crumb = { field: null, value: null };
    }
  }

  async ping() {
    const data = await this.request('GET', '/api/json?tree=mode,nodeDescription');
    return { mode: data.mode, description: data.nodeDescription };
  }
}

module.exports = { Jenkins };
