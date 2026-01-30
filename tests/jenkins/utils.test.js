'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { encodeJobPath, escapeXml, unescapeXml } = require('../../modules/jenkins/lib/jobs');

describe('jenkins utilities', () => {
  describe('encodeJobPath', () => {
    it('encodes a simple job name', () => {
      assert.equal(encodeJobPath('my-job'), 'my-job');
    });

    it('encodes a folder path', () => {
      assert.equal(encodeJobPath('folder/job'), 'folder/job/job');
    });

    it('encodes nested folder path', () => {
      assert.equal(encodeJobPath('org/team/pipeline'), 'org/job/team/job/pipeline');
    });

    it('URI-encodes special characters', () => {
      const result = encodeJobPath('my folder/my job');
      assert.equal(result, 'my%20folder/job/my%20job');
    });

    it('handles single segment', () => {
      assert.equal(encodeJobPath('build'), 'build');
    });
  });

  describe('escapeXml', () => {
    it('escapes ampersand', () => {
      assert.equal(escapeXml('a & b'), 'a &amp; b');
    });

    it('escapes angle brackets', () => {
      assert.equal(escapeXml('<tag>'), '&lt;tag&gt;');
    });

    it('escapes quotes', () => {
      assert.equal(escapeXml('"hello"'), '&quot;hello&quot;');
    });

    it('escapes apostrophes', () => {
      assert.equal(escapeXml("it's"), 'it&apos;s');
    });

    it('escapes all special chars together', () => {
      assert.equal(
        escapeXml(`<script>"a" & 'b'</script>`),
        '&lt;script&gt;&quot;a&quot; &amp; &apos;b&apos;&lt;/script&gt;'
      );
    });

    it('passes through safe strings unchanged', () => {
      assert.equal(escapeXml('hello world 123'), 'hello world 123');
    });
  });

  describe('unescapeXml', () => {
    it('unescapes ampersand', () => {
      assert.equal(unescapeXml('a &amp; b'), 'a & b');
    });

    it('unescapes angle brackets', () => {
      assert.equal(unescapeXml('&lt;tag&gt;'), '<tag>');
    });

    it('unescapes quotes', () => {
      assert.equal(unescapeXml('&quot;hello&quot;'), '"hello"');
    });

    it('unescapes apostrophes', () => {
      assert.equal(unescapeXml('it&apos;s'), "it's");
    });

    it('passes through strings without entities', () => {
      assert.equal(unescapeXml('hello world'), 'hello world');
    });

    it('round-trips with escapeXml', () => {
      const original = `pipeline { stage('Build') { sh "echo 'hello & world'" } }`;
      assert.equal(unescapeXml(escapeXml(original)), original);
    });
  });
});
