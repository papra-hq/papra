import { describe, expect, test } from 'vitest';
import { shouldRedirectShareIntent } from './share-intent.models';

describe('share intent models', () => {
  test('it does not redirect without a pending share', () => {
    expect(shouldRedirectShareIntent({ hasShareIntent: false, pathname: '/list' })).toBe(false);
  });

  test.each([
    '/app-settings',
    '/config/server-selection',
    '/auth/login',
    '/auth/signup',
    '/organizations/create',
    '/share',
  ])('a pending share does not interrupt %s', (pathname) => {
    expect(shouldRedirectShareIntent({ hasShareIntent: true, pathname })).toBe(false);
  });

  test.each(['/list', '/search', '/settings'])('a pending share resumes on %s', (pathname) => {
    expect(shouldRedirectShareIntent({ hasShareIntent: true, pathname })).toBe(true);
  });
});
