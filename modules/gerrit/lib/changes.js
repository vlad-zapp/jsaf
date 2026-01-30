'use strict';

function shellQuote(s) {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

class GerritChanges {
  constructor(gerrit) {
    this.gerrit = gerrit;
  }

  async query(q, options = {}) {
    const args = ['query', '--format=JSON'];
    if (options.currentPatchSet) args.push('--current-patch-set');
    if (options.patchSets) args.push('--patch-sets');
    if (options.allApprovals) args.push('--all-approvals');
    if (options.files) args.push('--files');
    if (options.comments) args.push('--comments');
    if (options.commitMessage) args.push('--commit-message');
    if (options.allReviewers) args.push('--all-reviewers');
    if (options.dependencies) args.push('--dependencies');
    if (options.submitRecords) args.push('--submit-records');
    if (options.start != null) args.push('--start', String(options.start));
    if (options.limit) {
      args.push('--', `${q} limit:${options.limit}`);
    } else {
      args.push('--', q);
    }
    const out = await this.gerrit.exec(args.join(' '));
    return this.gerrit._parseQueryJson(out);
  }

  async get(changeId, options = {}) {
    const results = await this.query(`change:${changeId}`, {
      currentPatchSet: true,
      ...options,
    });
    return results[0] || null;
  }

  async review(change, patchSet, options = {}) {
    const args = ['review'];
    if (options.message) args.push('--message', shellQuote(options.message));
    if (options.notify) args.push('--notify', options.notify);
    if (options.labels) {
      for (const [label, score] of Object.entries(options.labels)) {
        const s = score > 0 ? `+${score}` : String(score);
        args.push('--label', `${label}=${s}`);
      }
    }
    if (options.submit) args.push('--submit');
    if (options.tag) args.push('--tag', shellQuote(options.tag));
    args.push(`${change},${patchSet}`);
    await this.gerrit.exec(args.join(' '));
  }

  async approve(change, patchSet, options = {}) {
    const args = ['review', '--code-review', '+2'];
    if (options.message) args.push('--message', shellQuote(options.message));
    if (options.submit) args.push('--submit');
    args.push(`${change},${patchSet}`);
    await this.gerrit.exec(args.join(' '));
  }

  async reject(change, patchSet, options = {}) {
    const args = ['review', '--code-review', '-2'];
    if (options.message) args.push('--message', shellQuote(options.message));
    args.push(`${change},${patchSet}`);
    await this.gerrit.exec(args.join(' '));
  }

  async verify(change, patchSet, score = 1) {
    const s = score > 0 ? `+${score}` : String(score);
    await this.gerrit.exec(`review --verified ${s} ${change},${patchSet}`);
  }

  async submit(change, patchSet) {
    await this.gerrit.exec(`review --submit ${change},${patchSet}`);
  }

  async abandon(change, patchSet, message) {
    const args = ['review', '--abandon'];
    if (message) args.push('--message', shellQuote(message));
    args.push(`${change},${patchSet}`);
    await this.gerrit.exec(args.join(' '));
  }

  async restore(change, patchSet, message) {
    const args = ['review', '--restore'];
    if (message) args.push('--message', shellQuote(message));
    args.push(`${change},${patchSet}`);
    await this.gerrit.exec(args.join(' '));
  }

  async rebase(change, patchSet) {
    await this.gerrit.exec(`review --rebase ${change},${patchSet}`);
  }

  async addReviewers(change, ...reviewers) {
    const flat = reviewers.flat();
    const flags = flat.map((r) => `-a ${shellQuote(r)}`).join(' ');
    await this.gerrit.exec(`set-reviewers ${flags} ${change}`);
  }

  async removeReviewers(change, ...reviewers) {
    const flat = reviewers.flat();
    const flags = flat.map((r) => `-r ${shellQuote(r)}`).join(' ');
    await this.gerrit.exec(`set-reviewers ${flags} ${change}`);
  }

  async setTopic(change, topic) {
    await this.gerrit.exec(`set-topic ${change} -t ${shellQuote(topic)}`);
  }
}

module.exports = { GerritChanges };
