'use strict';

const { SSH } = require('@jsaf/ssh');
const { Config, Logger } = require('@jsaf/core');
const { GerritChanges } = require('./changes');
const { GerritProjects } = require('./projects');
const { GerritGroups } = require('./groups');

class Gerrit {
  constructor(options = {}) {
    const cfg = new Config();

    this._ssh = new SSH({
      host: options.host || cfg.get('gerrit.host'),
      port: options.port || cfg.get('gerrit.port', 29418),
      user: options.user || cfg.get('gerrit.user'),
      privateKey: options.privateKey || cfg.get('gerrit.privateKey'),
      passphrase: options.passphrase || cfg.get('gerrit.passphrase'),
      password: options.password || cfg.get('gerrit.password'),
      logLevel: options.logLevel || cfg.get('gerrit.logLevel', 'info'),
    });

    this.logger = options.logger || new Logger(options.logLevel || cfg.get('gerrit.logLevel', 'info'));

    this.changes = new GerritChanges(this);
    this.projects = new GerritProjects(this);
    this.groups = new GerritGroups(this);
  }

  async exec(cmd) {
    this.logger.debug(`gerrit ${cmd}`);
    const result = await this._ssh.exec(`gerrit ${cmd}`);
    return result.stdout;
  }

  _parseQueryJson(stdout) {
    const lines = stdout.split('\n').filter((l) => l.trim());
    const results = [];
    for (const line of lines) {
      const obj = JSON.parse(line);
      if (obj.type === 'stats') continue;
      results.push(obj);
    }
    return results;
  }

  _parseJson(stdout) {
    return JSON.parse(stdout);
  }

  _parseTsv(stdout) {
    const lines = stdout.split('\n').filter((l) => l.trim());
    if (lines.length === 0) return [];
    const headers = lines[0].split('\t').map((h) => h.trim().replace(/ /g, '_').toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split('\t');
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        const val = (cols[j] || '').trim();
        row[headers[j]] = val === 'n/a' ? null : val;
      }
      rows.push(row);
    }
    return rows;
  }

  _parseLines(stdout) {
    return stdout.split('\n').filter((l) => l.trim());
  }

  async getVersion() {
    const out = await this.exec('version');
    return out.replace(/^gerrit version\s*/i, '').trim();
  }

  async close() {
    await this._ssh.close();
  }
}

module.exports = { Gerrit };
