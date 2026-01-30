'use strict';

function shellQuote(s) {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

class GerritGroups {
  constructor(gerrit) {
    this.gerrit = gerrit;
  }

  async list(options = {}) {
    const args = ['ls-groups'];
    if (options.project) args.push('--project', shellQuote(options.project));
    if (options.user) args.push('--user', shellQuote(options.user));
    if (options.owned) args.push('--owned');
    if (options.verbose) args.push('--verbose');
    const out = await this.gerrit.exec(args.join(' '));
    if (!out.trim()) return [];
    if (options.verbose) {
      return out.split('\n').filter((l) => l.trim()).map((line) => {
        const cols = line.split('\t');
        return {
          name: cols[0] || null,
          uuid: cols[1] || null,
          description: cols[2] || null,
          owner: cols[3] || null,
          ownerUuid: cols[4] || null,
          visibleToAll: cols[5] === 'true',
        };
      });
    }
    return this.gerrit._parseLines(out);
  }

  async getMembers(group, options = {}) {
    const args = ['ls-members'];
    if (options.recursive) args.push('--recursive');
    args.push(shellQuote(group));
    const out = await this.gerrit.exec(args.join(' '));
    if (!out.trim()) return [];
    return this.gerrit._parseTsv(out);
  }

  async create(name, options = {}) {
    const args = ['create-group'];
    if (options.owner) args.push('--owner', shellQuote(options.owner));
    if (options.description) args.push('--description', shellQuote(options.description));
    if (options.visibleToAll) args.push('--visible-to-all');
    if (options.members) {
      const members = Array.isArray(options.members) ? options.members : [options.members];
      for (const m of members) args.push('--member', shellQuote(m));
    }
    args.push(shellQuote(name));
    await this.gerrit.exec(args.join(' '));
  }

  async addMembers(group, ...members) {
    const flat = members.flat();
    const flags = flat.map((m) => `--add ${shellQuote(m)}`).join(' ');
    await this.gerrit.exec(`set-members ${flags} ${shellQuote(group)}`);
  }

  async removeMembers(group, ...members) {
    const flat = members.flat();
    const flags = flat.map((m) => `--remove ${shellQuote(m)}`).join(' ');
    await this.gerrit.exec(`set-members ${flags} ${shellQuote(group)}`);
  }
}

module.exports = { GerritGroups, shellQuote };
