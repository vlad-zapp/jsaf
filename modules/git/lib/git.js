'use strict';

const { exec, Config, Logger } = require('@jsaf/core');
const path = require('path');

class Git {
  constructor(options = {}) {
    const cfg = new Config();
    this.cwd = options.cwd || cfg.get('git.cwd', process.cwd());
    this.logger = options.logger || new Logger(options.logLevel || cfg.get('git.logLevel', 'info'));
  }

  async git(args, options = {}) {
    this.logger.debug(`git ${args.join(' ')}`);
    return exec('git', args, { cwd: options.cwd || this.cwd, ...options });
  }

  async clone(url, dest, options = {}) {
    const args = ['clone'];
    if (options.depth) args.push('--depth', String(options.depth));
    if (options.branch) args.push('--branch', options.branch);
    if (options.bare) args.push('--bare');
    args.push(url);
    if (dest) args.push(dest);
    const result = await exec('git', args, { cwd: path.dirname(path.resolve(dest || '.')) });
    if (dest) this.cwd = path.resolve(dest);
    return result;
  }

  async add(files) {
    const list = Array.isArray(files) ? files : [files];
    return this.git(['add', ...list]);
  }

  async commit(message, options = {}) {
    if (options.all) await this.git(['add', '-A']);
    const args = ['commit', '-m', message];
    if (options.amend) args.push('--amend');
    if (options.allowEmpty) args.push('--allow-empty');
    return this.git(args);
  }

  async push(remote = 'origin', branch, options = {}) {
    const args = ['push'];
    if (options.force) args.push('--force');
    if (options.tags) args.push('--tags');
    if (options.setUpstream) args.push('-u');
    args.push(remote);
    if (branch) args.push(branch);
    return this.git(args);
  }

  async pull(remote = 'origin', branch, options = {}) {
    const args = ['pull'];
    if (options.rebase) args.push('--rebase');
    args.push(remote);
    if (branch) args.push(branch);
    return this.git(args);
  }

  async fetch(remote = 'origin', options = {}) {
    const args = ['fetch'];
    if (options.all) args.push('--all');
    if (options.prune) args.push('--prune');
    if (options.tags) args.push('--tags');
    if (!options.all) args.push(remote);
    return this.git(args);
  }

  async tag(name, options = {}) {
    const args = ['tag'];
    if (options.message) {
      args.push('-a', name, '-m', options.message);
    } else if (options.delete) {
      args.push('-d', name);
    } else {
      args.push(name);
    }
    return this.git(args);
  }

  async tags() {
    const { stdout } = await this.git(['tag', '--list']);
    return stdout ? stdout.split('\n') : [];
  }

  async branch(name, options = {}) {
    if (!name) {
      const { stdout } = await this.git(['branch', '--list']);
      return stdout.split('\n').map((b) => b.replace(/^\*?\s+/, '')).filter(Boolean);
    }
    if (options.delete) {
      return this.git(['branch', '-d', name]);
    }
    return this.git(['checkout', '-b', name]);
  }

  async checkout(ref) {
    return this.git(['checkout', ref]);
  }

  async merge(branch, options = {}) {
    const args = ['merge'];
    if (options.noFf) args.push('--no-ff');
    if (options.squash) args.push('--squash');
    if (options.message) args.push('-m', options.message);
    args.push(branch);
    return this.git(args);
  }

  async status() {
    const { stdout } = await this.git(['status', '--porcelain']);
    return stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => ({
        status: line.slice(0, 2).trim(),
        file: line.slice(3),
      }));
  }

  async log(count = 10) {
    const { stdout } = await this.git([
      'log',
      `--max-count=${count}`,
      '--pretty=format:%H|%an|%ae|%s|%ci',
    ]);
    return stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, author, email, subject, date] = line.split('|');
        return { hash, author, email, subject, date };
      });
  }

  async diff(options = {}) {
    const args = ['diff'];
    if (options.staged) args.push('--staged');
    if (options.stat) args.push('--stat');
    if (options.nameOnly) args.push('--name-only');
    const { stdout } = await this.git(args);
    return stdout;
  }

  async stash(options = {}) {
    const args = ['stash'];
    if (options.pop) args.push('pop');
    else if (options.list) args.push('list');
    else if (options.drop) args.push('drop');
    else if (options.message) args.push('push', '-m', options.message);
    return this.git(args);
  }

  async currentBranch() {
    const { stdout } = await this.git(['rev-parse', '--abbrev-ref', 'HEAD']);
    return stdout;
  }

  async remoteUrl(remote = 'origin') {
    const { stdout } = await this.git(['remote', 'get-url', remote]);
    return stdout;
  }

  async remotes() {
    const { stdout } = await this.git(['remote', '-v']);
    return stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [name, rest] = line.split('\t');
        const [url, type] = rest.split(' ');
        return { name, url, type: type.replace(/[()]/g, '') };
      });
  }

  async clean(options = {}) {
    const args = ['clean', '-f'];
    if (options.directories) args.push('-d');
    if (options.dryRun) {
      args.length = 0;
      args.push('clean', '-n');
      if (options.directories) args.push('-d');
    }
    return this.git(args);
  }

  async rev(ref = 'HEAD') {
    const { stdout } = await this.git(['rev-parse', ref]);
    return stdout;
  }
}

module.exports = { Git };
