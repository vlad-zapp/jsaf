'use strict';

const { run } = require('./lib/runner');
const { init, help, version } = require('./lib/commands');
const { startRepl } = require('./lib/repl');

module.exports = { run, init, help, version, repl: startRepl };
