'use strict';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };
const COLORS = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  reset: '\x1b[0m',
};

class Logger {
  constructor(level = 'info') {
    this.level = LEVELS[level] ?? LEVELS.info;
    this.useColor = process.stderr.isTTY !== false;
  }

  debug(msg, ...args) { this._log('debug', msg, args); }
  info(msg, ...args) { this._log('info', msg, args); }
  warn(msg, ...args) { this._log('warn', msg, args); }
  error(msg, ...args) { this._log('error', msg, args); }

  _log(level, msg, args) {
    if (LEVELS[level] < this.level) return;
    const prefix = this.useColor
      ? `${COLORS[level]}[jsaf:${level}]${COLORS.reset}`
      : `[jsaf:${level}]`;
    const ts = new Date().toISOString().slice(11, 23);
    console.error(`${ts} ${prefix} ${msg}`, ...args);
  }
}

module.exports = { Logger };
