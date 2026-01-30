#!/usr/bin/env node
'use strict';

const [,, command, ...args] = process.argv;

switch (command) {
  case 'run':
    require('@jsaf/cli').run(args[0], parseFlags(args.slice(1)));
    break;
  case 'repl':
    require('@jsaf/cli').repl(parseFlags(args));
    break;
  case 'init':
    require('@jsaf/cli').init();
    break;
  case 'version':
    console.log(require('../package.json').version);
    break;
  case 'help':
    require('@jsaf/cli').help(args[0]);
    break;
  default:
    // No command or unrecognized -> launch REPL
    if (!command || command.startsWith('-')) {
      require('@jsaf/cli').repl(parseFlags(command ? [command, ...args] : args));
    } else {
      console.error(`Unknown command: ${command}`);
      require('@jsaf/cli').help();
    }
    break;
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config') flags.config = args[++i];
    else if (args[i] === '--log-level') flags.logLevel = args[++i];
    else if (args[i] === '--env') (flags.env = flags.env || []).push(args[++i]);
  }
  return flags;
}
