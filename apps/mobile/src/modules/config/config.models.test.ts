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
        success: true,
        headers: {
          'X-Api-Key': 'secret',
          'Authorization': 'Basic dXNlcjpwYXNz',
        },
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
      ).to.eql({ success: true, headers: { 'X-Foo': 'bar' } });

      expect(validateCustomHeaders({ headers: [] })).to.eql({ success: true, headers: {} });
    });

    test.each(['', '  '])('a header with a value but an empty name %j is rejected', (name) => {
      expect(validateCustomHeaders({ headers: [{ name, value: 'foo' }] })).to.eql({
        success: false,
        issue: { code: 'empty-name', headerName: '' },
      });
    });

    test.each(['X Foo', 'X-Foo:', 'X-Fôo', '  X Foo  '])(
      'the invalid header name %j is rejected',
      (name) => {
        expect(validateCustomHeaders({ headers: [{ name, value: 'bar' }] })).to.eql({
          success: false,
          issue: { code: 'invalid-name', headerName: name.trim() },
        });
      },
    );

    test.each(['Cookie', 'cookie', 'HOST', 'Content-Type', 'Origin', 'Referer'])(
      'the managed header %j is denied, regardless of casing',
      (name) => {
        expect(validateCustomHeaders({ headers: [{ name, value: 'foo' }] })).to.eql({
          success: false,
          issue: { code: 'forbidden-name', headerName: name },
        });
      },
    );

    test.each(['Proxy-Authorization', 'Sec-Fetch-Mode', 'Access-Control-Request-Method'])(
      'the header %j with a denied prefix is rejected',
      (name) => {
        expect(validateCustomHeaders({ headers: [{ name, value: 'foo' }] })).to.eql({
          success: false,
          issue: { code: 'forbidden-name', headerName: name },
        });
      },
    );

    test.each(['bar\r\nbaz', 'bar\rbaz', 'bar\nbaz'])(
      'the header value %j containing newlines is rejected',
      (value) => {
        expect(validateCustomHeaders({ headers: [{ name: '  X-Foo  ', value }] })).to.eql({
          success: false,
          issue: { code: 'invalid-value', headerName: 'X-Foo' },
        });
      },
    );

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
        success: true,
        headers: {
          'Authorization': 'Bearer token',
          'CF-Access-Client-Id': 'id',
          'CF-Access-Client-Secret': 'secret',
          'X-Forwarded-User': 'corentin',
        },
      });
    });
  });
});
