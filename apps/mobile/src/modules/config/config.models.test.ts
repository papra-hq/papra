import { describe, expect, test } from 'vitest';
import { validateCustomHeaders, validateServerUrl } from './config.models';

describe('config models', () => {
  describe('validateServerUrl', () => {
    test('non-url are rejected', () => {
      expect(() => validateServerUrl({ url: 'not-a-url' })).toThrow();
      expect(() => validateServerUrl({ url: '' })).toThrow();
    });

    test('urls are trimmed', () => {
      expect(validateServerUrl({ url: '   https://example.com   ' })).to.eql('https://example.com');
    });

    test('if the url ends with a /api it is removed', () => {
      expect(validateServerUrl({ url: 'https://example.com/api' })).to.eql('https://example.com');
      expect(validateServerUrl({ url: 'https://example.com/api/' })).to.eql('https://example.com');
      expect(validateServerUrl({ url: 'https://example.com/papra/api/' })).to.eql(
        'https://example.com/papra',
      );
      expect(validateServerUrl({ url: 'https://example.com/papi' })).to.eql(
        'https://example.com/papi',
      );
    });

    test('protocol must be present', () => {
      expect(() => validateServerUrl({ url: 'example.com' })).toThrow();
      expect(() => validateServerUrl({ url: '192.168.0.0' })).toThrow();
    });

    test('standard urls are returned as-is', () => {
      expect(validateServerUrl({ url: 'https://example.com' })).to.eql('https://example.com');
      expect(validateServerUrl({ url: 'https://example.com/' })).to.eql('https://example.com/');
      expect(validateServerUrl({ url: 'http://example.com' })).to.eql('http://example.com');
      expect(validateServerUrl({ url: 'https://192.168.0.0' })).to.eql('https://192.168.0.0');
      expect(validateServerUrl({ url: 'https://sub.domain.example.com' })).to.eql(
        'https://sub.domain.example.com',
      );
      expect(validateServerUrl({ url: 'https://example.com:8080' })).to.eql(
        'https://example.com:8080',
      );
      expect(validateServerUrl({ url: 'https://example.com/papra' })).to.eql(
        'https://example.com/papra',
      );
    });
  });

  describe('validateCustomHeaders', () => {
    test('headers are trimmed and returned as a record', () => {
      expect(
        validateCustomHeaders({
          headers: [
            { name: '  X-Api-Key  ', value: '  secret  ' },
            { name: 'Authorization', value: 'Basic dXNlcjpwYXNz' },
          ],
        }),
      ).to.eql({
        'X-Api-Key': 'secret',
        'Authorization': 'Basic dXNlcjpwYXNz',
      });
    });

    test('fully empty rows are ignored', () => {
      expect(
        validateCustomHeaders({
          headers: [
            { name: '', value: '' },
            { name: '  ', value: '' },
            { name: 'X-Foo', value: 'bar' },
          ],
        }),
      ).to.eql({ 'X-Foo': 'bar' });

      expect(validateCustomHeaders({ headers: [] })).to.eql({});
    });

    test('a header with a value but no name is rejected', () => {
      expect(() => validateCustomHeaders({ headers: [{ name: '', value: 'foo' }] })).toThrow(
        'Header names cannot be empty.',
      );
    });

    test('header names with invalid characters are rejected', () => {
      expect(() => validateCustomHeaders({ headers: [{ name: 'X Foo', value: 'bar' }] })).toThrow(
        'The header name "X Foo" is invalid.',
      );
      expect(() =>
        validateCustomHeaders({ headers: [{ name: 'X-Foo:', value: 'bar' }] }),
      ).toThrow();
      expect(() => validateCustomHeaders({ headers: [{ name: 'X-Fôo', value: 'bar' }] })).toThrow();
    });

    test('headers managed by the app are denied, regardless of casing', () => {
      expect(() => validateCustomHeaders({ headers: [{ name: 'Cookie', value: 'a=b' }] })).toThrow(
        'The header "Cookie" is managed by the app and cannot be overridden.',
      );
      expect(() =>
        validateCustomHeaders({ headers: [{ name: 'cookie', value: 'a=b' }] }),
      ).toThrow();
      expect(() =>
        validateCustomHeaders({ headers: [{ name: 'HOST', value: 'evil.com' }] }),
      ).toThrow();
      expect(() =>
        validateCustomHeaders({ headers: [{ name: 'Content-Type', value: 'text/plain' }] }),
      ).toThrow();
      expect(() => validateCustomHeaders({ headers: [{ name: 'Origin', value: 'x' }] })).toThrow();
      expect(() => validateCustomHeaders({ headers: [{ name: 'Referer', value: 'x' }] })).toThrow();
    });

    test('headers with denied prefixes are rejected', () => {
      expect(() =>
        validateCustomHeaders({ headers: [{ name: 'Proxy-Authorization', value: 'x' }] }),
      ).toThrow();
      expect(() =>
        validateCustomHeaders({ headers: [{ name: 'Sec-Fetch-Mode', value: 'cors' }] }),
      ).toThrow();
      expect(() =>
        validateCustomHeaders({
          headers: [{ name: 'Access-Control-Request-Method', value: 'GET' }],
        }),
      ).toThrow();
    });

    test('values containing newlines are rejected', () => {
      expect(() =>
        validateCustomHeaders({ headers: [{ name: 'X-Foo', value: 'bar\r\nbaz' }] }),
      ).toThrow('The value of the header "X-Foo" is invalid.');
    });

    test('common reverse-proxy auth headers are allowed', () => {
      expect(
        validateCustomHeaders({
          headers: [
            { name: 'Authorization', value: 'Bearer token' },
            { name: 'CF-Access-Client-Id', value: 'id' },
            { name: 'CF-Access-Client-Secret', value: 'secret' },
            { name: 'X-Forwarded-User', value: 'corentin' },
          ],
        }),
      ).to.eql({
        'Authorization': 'Bearer token',
        'CF-Access-Client-Id': 'id',
        'CF-Access-Client-Secret': 'secret',
        'X-Forwarded-User': 'corentin',
      });
    });
  });
});
