'use strict';

function shellQuote(s) {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

class GerritProjects {
  constructor(gerrit) {
    this.gerrit = gerrit;
  }

  async list(options = {}) {
    const args = ['ls-projects', '--format', 'json'];
    if (options.description) args.push('--description');
    if (options.match) args.push('--match', shellQuote(options.match));
    if (options.prefix) args.push('--prefix', shellQuote(options.prefix));
    if (options.type) args.push('--type', options.type);
    if (options.state) args.push('--state', options.state);
    if (options.limit) args.push('--limit', String(options.limit));
    if (options.start != null) args.push('--start', String(options.start));
    const out = await this.gerrit.exec(args.join(' '));
    if (!out.trim()) return {};
    return this.gerrit._parseJson(out);
  }

  async create(name, options = {}) {
    const args = ['create-project'];
    if (options.branch) {
      const branches = Array.isArray(options.branch) ? options.branch : [options.branch];
      for (const b of branches) args.push('--branch', shellQuote(b));
    }
    if (options.parent) args.push('--parent', shellQuote(options.parent));
    if (options.description) args.push('--description', shellQuote(options.description));
    if (options.submitType) args.push('--submit-type', options.submitType);
    if (options.emptyCommit) args.push('--empty-commit');
    if (options.permissionsOnly) args.push('--permissions-only');
    if (options.owner) {
      const owners = Array.isArray(options.owner) ? options.owner : [options.owner];
      for (const o of owners) args.push('--owner', shellQuote(o));
    }
    args.push(shellQuote(name));
    await this.gerrit.exec(args.join(' '));
  }

  async createBranch(project, branch, revision) {
    await this.gerrit.exec(
      `create-branch ${shellQuote(project)} ${shellQuote(branch)} ${shellQuote(revision)}`
    );
  }
}

module.exports = { GerritProjects };
