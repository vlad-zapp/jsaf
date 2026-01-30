'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { Logger } = require('../../modules/core/lib/logger');

describe('Logger', () => {
  let output;
  let originalError;

  beforeEach(() => {
    output = [];
    originalError = console.error;
    console.error = (...args) => output.push(args.join(' '));
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('logs at info level by default', () => {
    const log = new Logger();
    log.info('hello');
    assert.equal(output.length, 1);
    assert.ok(output[0].includes('hello'));
  });

  it('suppresses debug when level is info', () => {
    const log = new Logger('info');
    log.debug('hidden');
    assert.equal(output.length, 0);
  });

  it('shows debug when level is debug', () => {
    const log = new Logger('debug');
    log.debug('visible');
    assert.equal(output.length, 1);
    assert.ok(output[0].includes('visible'));
  });

  it('shows warn at info level', () => {
    const log = new Logger('info');
    log.warn('warning');
    assert.equal(output.length, 1);
    assert.ok(output[0].includes('warning'));
  });

  it('shows error at warn level', () => {
    const log = new Logger('warn');
    log.error('err');
    assert.equal(output.length, 1);
  });

  it('suppresses info at warn level', () => {
    const log = new Logger('warn');
    log.info('hidden');
    assert.equal(output.length, 0);
  });

  it('suppresses everything at silent level', () => {
    const log = new Logger('silent');
    log.debug('x');
    log.info('x');
    log.warn('x');
    log.error('x');
    assert.equal(output.length, 0);
  });

  it('includes level prefix in output', () => {
    const log = new Logger('debug');
    log.useColor = false;
    log.info('test message');
    assert.ok(output[0].includes('[jsaf:info]'));
  });
});
