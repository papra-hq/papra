import { describe, expect, test } from 'vitest';
import { getUrlHostname } from './urls.models';

describe('urls.models', () => {
  describe('getUrlHostname', () => {
    test('safely get the hostname of a url', () => {
      expect(getUrlHostname('http://example.com/foo/bar')).to.eql('example.com');
      expect(getUrlHostname('https://example.com/foo/bar')).to.eql('example.com');
      expect(getUrlHostname('ftp://example.com/foo/bar')).to.eql('example.com');
      expect(getUrlHostname('http://example.com:8080/foo/bar')).to.eql('example.com');
      expect(getUrlHostname('http://user:password@example.com/foo/bar')).to.eql('example.com');
      expect(getUrlHostname('http://127.0.0.1/foo/bar')).to.eql('127.0.0.1');
      expect(getUrlHostname('http://[2001:db8::1]/foo/bar')).to.eql('[2001:db8::1]');
    });

    test('given an invalid url, return null', () => {
      expect(getUrlHostname('not a url')).to.eql(null);
      expect(getUrlHostname('http://')).to.eql(null);
      expect(getUrlHostname('foo/bar')).to.eql(null);
      expect(getUrlHostname('')).to.eql(null);
    });
  });
});
