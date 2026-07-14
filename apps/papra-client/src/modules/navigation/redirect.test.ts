import { describe, test, expect } from 'vitest';
import { buildPathWithRedirect, parseRedirectPath } from './redirect';

describe('redirect', () => {
  describe('parseRedirectPath', () => {
    test('valid paths are preserved, including their query and hash', () => {
      expect(parseRedirectPath('/dashboard')).to.eql('/dashboard');
      expect(parseRedirectPath('/dashboard?foo=bar#section')).to.eql('/dashboard?foo=bar#section');
      expect(
        parseRedirectPath('/organizations/org_abc?search=report.pdf+draft&sort=created_at'),
      ).to.eql('/organizations/org_abc?search=report.pdf+draft&sort=created_at');
    });

    test('paths that do not start with a single slash are invalid', () => {
      expect(parseRedirectPath('dashboard')).to.eql(undefined);
      expect(parseRedirectPath('https://evil.com')).to.eql(undefined);
      expect(parseRedirectPath('//dashboard')).to.eql(undefined);
    });

    test('paths whose dot segments resolve to a protocol-relative url are invalid', () => {
      expect(parseRedirectPath('/.//evil.com')).to.eql(undefined);
      expect(parseRedirectPath('/..//evil.com')).to.eql(undefined);
    });

    test('paths with disallowed characters in the pathname are invalid', () => {
      expect(parseRedirectPath('/foo//bar')).to.eql(undefined);
      expect(parseRedirectPath('/foo<>bar')).to.eql(undefined);
      expect(parseRedirectPath('/evil.com')).to.eql(undefined);
    });

    test('dot segments, backslashes and trailing control characters are normalized away', () => {
      expect(parseRedirectPath('/foo/./bar')).to.eql('/foo/bar');
      expect(parseRedirectPath('/../../bar')).to.eql('/bar');
      expect(parseRedirectPath('/foo\\bar')).to.eql('/foo/bar');
      expect(parseRedirectPath('/foo\0')).to.eql('/foo');
    });

    test('empty path returns undefined', () => {
      expect(parseRedirectPath('')).to.eql(undefined);
      expect(parseRedirectPath('     ')).to.eql(undefined);
      expect(parseRedirectPath('  \n   ')).to.eql(undefined);
      expect(parseRedirectPath('  \t   ')).to.eql(undefined);
      expect(parseRedirectPath('  \n\t   ')).to.eql(undefined);

      expect(parseRedirectPath('/')).to.eql(undefined);
      expect(parseRedirectPath('   /  ')).to.eql(undefined);
    });

    test('public only routes and arbitrary subpaths are invalid', () => {
      expect(parseRedirectPath('/login')).to.eql(undefined);
      expect(parseRedirectPath('/login/')).to.eql(undefined);
      expect(parseRedirectPath('/login/foobar')).to.eql(undefined);
    });
  });

  describe('buildPathWithRedirect', () => {
    test('a valid redirect path is added as an encoded redirect query param', () => {
      expect(buildPathWithRedirect({ path: '/login', redirectPath: '/dashboard' })).to.eql(
        '/login?redirect=%2Fdashboard',
      );
      expect(
        buildPathWithRedirect({ path: '/login', redirectPath: '/dashboard?foo=bar#section' }),
      ).to.eql('/login?redirect=%2Fdashboard%3Ffoo%3Dbar%23section');
    });

    test('the query and hash of the base path are preserved', () => {
      expect(buildPathWithRedirect({ path: '/login?foo=bar', redirectPath: '/dashboard' })).to.eql(
        '/login?foo=bar&redirect=%2Fdashboard',
      );
      expect(buildPathWithRedirect({ path: '/login#section', redirectPath: '/dashboard' })).to.eql(
        '/login?redirect=%2Fdashboard#section',
      );
    });

    test('when the redirect path is missing or invalid, the path is returned unchanged', () => {
      expect(buildPathWithRedirect({ path: '/login' })).to.eql('/login');
      expect(buildPathWithRedirect({ path: '/login', redirectPath: undefined })).to.eql('/login');
      expect(buildPathWithRedirect({ path: '/login', redirectPath: 'https://evil.com' })).to.eql(
        '/login',
      );
      expect(buildPathWithRedirect({ path: '/login', redirectPath: '//evil.com' })).to.eql(
        '/login',
      );
      expect(buildPathWithRedirect({ path: '/login', redirectPath: '/register' })).to.eql('/login');
    });
  });
});
