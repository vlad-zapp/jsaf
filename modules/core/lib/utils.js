'use strict';

const { execFile } = require('child_process');

function exec(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      timeout: options.timeout || 60000,
      maxBuffer: options.maxBuffer || 10 * 1024 * 1024,
      ...options,
    };
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) {
        const { CommandError } = require('./errors');
        reject(new CommandError(`${cmd} ${args.join(' ')}`, err.code, stderr));
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function retry(fn, { attempts = 3, delay = 1000, backoff = 2 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
    }
    if (i < attempts - 1) await sleep(delay * Math.pow(backoff, i));
  }
  throw lastErr;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { exec, retry, sleep };
