'use strict';

class JsafError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'JsafError';
    this.context = context;
  }
}

class HttpError extends JsafError {
  constructor(method, url, statusCode, body) {
    const short = body ? body.slice(0, 200) : '';
    super(`${method} ${url} returned ${statusCode}: ${short}`, { method, url, statusCode });
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.responseBody = body;
  }
}

class ConnectionError extends JsafError {
  constructor(target, cause) {
    super(`Failed to connect to ${target}: ${cause.message}`, { target });
    this.name = 'ConnectionError';
    this.cause = cause;
  }
}

class AuthError extends JsafError {
  constructor(target) {
    super(`Authentication failed for ${target}. Check your credentials.`, { target });
    this.name = 'AuthError';
  }
}

class ConfigError extends JsafError {
  constructor(key, detail) {
    super(`Configuration error for "${key}": ${detail}`, { key });
    this.name = 'ConfigError';
  }
}

class CommandError extends JsafError {
  constructor(cmd, exitCode, stderr) {
    super(`Command failed (exit ${exitCode}): ${cmd}\n${stderr ? stderr.slice(0, 500) : ''}`, { cmd, exitCode });
    this.name = 'CommandError';
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

module.exports = { JsafError, HttpError, ConnectionError, AuthError, ConfigError, CommandError };
