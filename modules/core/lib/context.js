'use strict';

const { Config } = require('./config');
const { Logger } = require('./logger');

// Static require functions so bundlers (esbuild) can trace the imports.
// Dynamic require(variable) is invisible to bundlers.
const MODULE_REGISTRY = {
  jenkins: { load: () => require('@jsaf/jenkins'), className: 'Jenkins' },
  k8s: { load: () => require('@jsaf/k8s'), className: 'K8s' },
  ssh: { load: () => require('@jsaf/ssh'), className: 'SSH' },
  docker: { load: () => require('@jsaf/docker'), className: 'Docker' },
  git: { load: () => require('@jsaf/git'), className: 'Git' },
};

/**
 * Detect whether a module config section describes a single instance or
 * multiple named instances.
 *
 * Single instance: config has primitive values (url, host, etc.) or is empty.
 * Multi instance: every value is a plain object (each one is a named instance config).
 */
function isSingleInstance(config) {
  const values = Object.values(config);
  if (values.length === 0) return true;
  return values.some(
    (v) => v === null || v === undefined || typeof v !== 'object' || Array.isArray(v)
  );
}

function createContext(options = {}) {
  const configOpts = options.config || {};
  if (options.configPath) configOpts.configPath = options.configPath;
  const cfg = new Config(configOpts);
  const logLevel = options.logLevel || cfg.get('logLevel', 'info');
  const logger = new Logger(logLevel);

  const context = {
    Config,
    Logger,
    config: cfg,
    logger,
  };

  for (const [moduleName, { load, className }] of Object.entries(MODULE_REGISTRY)) {
    let ModuleClass;
    try {
      ModuleClass = load()[className];
    } catch {
      logger.debug(`Module ${moduleName} not available`);
      continue;
    }

    // Expose the class for manual instantiation (new Jenkins({...}))
    context[className] = ModuleClass;

    const moduleConfig = cfg.module(moduleName);

    if (isSingleInstance(moduleConfig)) {
      // Single instance: module variable IS the client
      // e.g. docker.containers.list(), git.status()
      try {
        context[moduleName] = new ModuleClass(moduleConfig);
      } catch (err) {
        logger.debug(`${moduleName}: ${err.message}`);
      }
    } else {
      // Multi instance: module variable is a namespace with named clients
      // e.g. jenkins.staging.jobs.list(), ssh.db.exec('cmd')
      const namespace = {};
      for (const [instanceName, instanceConfig] of Object.entries(moduleConfig)) {
        try {
          namespace[instanceName] = new ModuleClass(instanceConfig);
        } catch (err) {
          logger.debug(`${moduleName}.${instanceName}: ${err.message}`);
        }
      }
      context[moduleName] = namespace;
    }
  }

  return context;
}

function getCompletions(context) {
  const completions = [];

  for (const [key, value] of Object.entries(context)) {
    completions.push(key);
    if (value && typeof value === 'object' && !Array.isArray(value) && typeof value !== 'function') {
      const proto = Object.getPrototypeOf(value);
      const isInstance = proto && proto !== Object.prototype;

      if (isInstance) {
        // Module client instance — list sub-resources and methods
        addInstanceCompletions(completions, key, value);
      } else {
        // Plain object — could be a namespace of named instances or Config
        for (const [prop, sub] of Object.entries(value)) {
          if (prop.startsWith('_')) continue;
          completions.push(`${key}.${prop}`);
          if (sub && typeof sub === 'object' && !Array.isArray(sub) && typeof sub !== 'function') {
            addInstanceCompletions(completions, `${key}.${prop}`, sub);
          }
        }
      }
    }
  }

  return [...new Set(completions)].sort();
}

function addInstanceCompletions(completions, prefix, instance) {
  // Own enumerable properties (sub-resources like jenkins.jobs)
  for (const prop of Object.keys(instance)) {
    if (prop.startsWith('_')) continue;
    completions.push(`${prefix}.${prop}`);
  }

  // Prototype methods (like jenkins.ping, jenkins.request)
  const proto = Object.getPrototypeOf(instance);
  if (proto && proto !== Object.prototype) {
    const methods = Object.getOwnPropertyNames(proto).filter(
      (m) => m !== 'constructor' && typeof instance[m] === 'function' && !m.startsWith('_')
    );
    for (const m of methods) {
      completions.push(`${prefix}.${m}`);
    }

    // One level deeper for sub-resources (jenkins.jobs.list, docker.containers.run)
    for (const prop of Object.keys(instance)) {
      if (prop.startsWith('_')) continue;
      const sub = instance[prop];
      if (sub && typeof sub === 'object' && typeof sub !== 'function') {
        const subProto = Object.getPrototypeOf(sub);
        if (subProto && subProto !== Object.prototype) {
          const subMethods = Object.getOwnPropertyNames(subProto).filter(
            (m) => m !== 'constructor' && typeof sub[m] === 'function' && !m.startsWith('_')
          );
          for (const sm of subMethods) {
            completions.push(`${prefix}.${prop}.${sm}`);
          }
        }
      }
    }
  }
}

module.exports = { createContext, getCompletions, MODULE_REGISTRY };
