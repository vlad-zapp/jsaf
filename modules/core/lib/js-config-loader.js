'use strict';

const path = require('path');
const fs = require('fs');
const Module = require('module');

function findJsConfig(startDir) {
  let dir = startDir || process.cwd();
  while (true) {
    const candidate = path.join(dir, 'jsaf.config.js');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function loadJsConfig(configPath) {
  const resolved = configPath || findJsConfig();
  if (!resolved) return null;
  const abs = path.resolve(resolved);
  if (!fs.existsSync(abs)) return null;
  // Use createRequire to load user config from the filesystem at runtime.
  // This ensures it works in bundled/binary builds where the bundled require
  // may not resolve paths outside the bundle.
  const userRequire = Module.createRequire(abs);
  delete userRequire.cache[abs];
  return userRequire(abs);
}

module.exports = { findJsConfig, loadJsConfig };
