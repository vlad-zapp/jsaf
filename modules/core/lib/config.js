'use strict';

const fs = require('fs');
const path = require('path');
const { loadJsConfig } = require('./js-config-loader');

class Config {
  constructor(options = {}) {
    this._file = this._loadFile(options.configPath);
    this._env = process.env;
    this._overrides = options.overrides || {};
  }

  get(keyPath, defaultValue) {
    const fromOverrides = this._resolve(this._overrides, keyPath);
    if (fromOverrides !== undefined) return fromOverrides;

    const fromFile = this._resolve(this._file, keyPath);
    if (fromFile !== undefined) return fromFile;

    const envKey = 'JSAF_' + keyPath.toUpperCase().replace(/\./g, '_');
    const fromEnv = this._env[envKey];
    if (fromEnv !== undefined) return fromEnv;

    return defaultValue;
  }

  module(name) {
    return this._overrides[name] || this._file[name] || {};
  }

  _loadFile(explicit) {
    if (explicit) {
      return loadJsConfig(explicit) || {};
    }
    return loadJsConfig() || {};
  }

  _resolve(obj, keyPath) {
    return keyPath.split('.').reduce(
      (o, k) => (o && o[k] !== undefined ? o[k] : undefined),
      obj
    );
  }
}

module.exports = { Config };
