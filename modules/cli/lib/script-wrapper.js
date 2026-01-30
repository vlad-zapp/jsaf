'use strict';

const vm = require('vm');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const { createContext } = require('@jsaf/core');

async function runScript(scriptPath, options = {}) {
  const resolved = path.resolve(scriptPath);
  const code = fs.readFileSync(resolved, 'utf8');

  const context = createContext(options);

  const sandbox = {
    ...context,
    // Node globals
    console,
    process,
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
    setImmediate,
    clearImmediate,
    Buffer,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    fetch,
    AbortController,
    AbortSignal,
    // Module system — users can still require their own deps
    // Falls back to jsaf workspace for @jsaf/* modules
    require: createRequireWithFallback(resolved),
    __filename: resolved,
    __dirname: path.dirname(resolved),
    module: { exports: {} },
    exports: {},
  };

  // Wrap in async IIFE for top-level await support
  const wrapped = `(async () => {\n${code}\n})()`;

  const script = new vm.Script(wrapped, {
    filename: resolved,
    lineOffset: -1, // compensate for wrapper line
  });

  const vmContext = vm.createContext(sandbox);
  return script.runInContext(vmContext);
}

function createRequireWithFallback(scriptPath) {
  const scriptRequire = Module.createRequire(scriptPath);
  // Also create a require from jsaf's own location for @jsaf/* modules
  const jsafRequire = require;

  return function jsafSmartRequire(id) {
    try {
      return scriptRequire(id);
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND' && id.startsWith('@jsaf/')) {
        return jsafRequire(id);
      }
      throw err;
    }
  };
}

module.exports = { runScript };
