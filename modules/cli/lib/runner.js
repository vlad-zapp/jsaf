'use strict';

const path = require('path');
const fs = require('fs');
const { Config, Logger, JsafError } = require('@jsaf/core');

async function run(scriptPath, cliOptions = {}) {
  if (!scriptPath) {
    console.error('Usage: jsaf run <script.js> [--config path] [--log-level level]');
    process.exit(1);
  }

  const resolved = path.resolve(scriptPath);
  if (!fs.existsSync(resolved)) {
    console.error(`Script not found: ${resolved}`);
    process.exit(1);
  }

  // Set up config overrides from CLI --env flags
  const overrides = {};
  if (cliOptions.env) {
    for (const pair of cliOptions.env) {
      const [key, ...rest] = pair.split('=');
      process.env[key] = rest.join('=');
    }
  }

  // Set log level if specified
  if (cliOptions.logLevel) {
    process.env.JSAF_LOGLEVEL = cliOptions.logLevel;
  }

  // Set config path if specified
  if (cliOptions.config) {
    process.env.JSAF_CONFIG_PATH = cliOptions.config;
  }

  const logger = new Logger(cliOptions.logLevel || 'info');

  process.on('unhandledRejection', (err) => {
    console.error(formatError(err));
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    console.error(formatError(err));
    process.exit(1);
  });

  const { runScript } = require('./script-wrapper');

  try {
    logger.debug(`Running script: ${resolved}`);
    await runScript(resolved, {
      configPath: cliOptions.config,
      logLevel: cliOptions.logLevel,
    });
  } catch (err) {
    console.error(formatError(err));
    process.exit(1);
  }
}

function formatError(err) {
  if (!err) return 'Unknown error';
  if (err.name === 'HttpError') {
    return `HTTP ${err.statusCode} from ${err.context?.url || 'unknown'}\n  ${err.message}`;
  }
  if (err.name === 'CommandError') {
    return `Command failed (exit ${err.exitCode}): ${err.context?.cmd || ''}\n  ${err.stderr ? err.stderr.slice(0, 300) : ''}`;
  }
  if (err.name === 'AuthError') {
    return `Authentication failed: ${err.message}\n  Check your credentials in jsaf.config.js or environment variables.`;
  }
  if (err.name === 'ConnectionError') {
    return `Connection failed: ${err.message}\n  Verify the host is reachable and the URL is correct.`;
  }
  if (err.name === 'ConfigError') {
    return `Config error: ${err.message}`;
  }
  return err.stack || err.message;
}

module.exports = { run, formatError };
