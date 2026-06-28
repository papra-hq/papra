import { describe, expect, test } from 'vitest';
import { isMimeTypeAllowed } from './mime-types.models';

describe('mime-types.models', () => {
  describe('isMimeTypeAllowed', () => {
    test('a mime type is allowed if it is in the list of supported mime types', () => {
      expect(
        isMimeTypeAllowed({
          mimeType: 'application/pdf',
          allowList: new Set(['application/pdf', 'image/png']),
        }),
      ).to.eql(true);

      expect(
        isMimeTypeAllowed({
          mimeType: 'text/plain',
          allowList: new Set(['application/pdf', 'image/png']),
        }),
      ).to.eql(false);
    });

    test('a single wildcard allow all mime type', () => {
      expect(
        isMimeTypeAllowed({
          mimeType: 'application/pdf',
          allowList: new Set(['*']),
        }),
      ).to.eql(true);

      expect(
        isMimeTypeAllowed({
          mimeType: 'application/pdf',
          allowList: new Set(['*', 'image/png']),
        }),
      ).to.eql(true);
    });

    test('a wildcard in the type part of the mime type allows all mime types of that type', () => {
      expect(
        isMimeTypeAllowed({
          mimeType: 'application/pdf',
          allowList: new Set(['application/*']),
        }),
      ).to.eql(true);

      expect(
        isMimeTypeAllowed({
          mimeType: 'image/png',
          allowList: new Set(['application/*']),
        }),
      ).to.eql(false);
    });

    test('an exclamation mark in front of a mime type negates it', () => {
      expect(
        isMimeTypeAllowed({
          mimeType: 'application/pdf',
          allowList: new Set(['!application/pdf']),
        }),
      ).to.eql(false);

      expect(
        isMimeTypeAllowed({
          mimeType: 'image/png',
          allowList: new Set(['!application/pdf']),
        }),
      ).to.eql(false);

      expect(
        isMimeTypeAllowed({
          mimeType: 'image/png',
          allowList: new Set(['image/png', '!application/pdf']),
        }),
      ).to.eql(true);
    });

    test('negations works with wildcards', () => {
      expect(
        isMimeTypeAllowed({
          mimeType: 'application/pdf',
          allowList: new Set(['!application/*']),
        }),
      ).to.eql(false);

      expect(
        isMimeTypeAllowed({
          mimeType: 'image/png',
          allowList: new Set(['image/png', '!application/*']),
        }),
      ).to.eql(true);

      expect(
        isMimeTypeAllowed({
          mimeType: 'image/png',
          allowList: new Set(['*', '!image/*']),
        }),
      ).to.eql(false);

      expect(
        isMimeTypeAllowed({
          mimeType: 'application/pdf',
          allowList: new Set(['*', '!image/*']),
        }),
      ).to.eql(true);

      expect(
        isMimeTypeAllowed({
          mimeType: 'image/png',
          allowList: new Set(['*', '!image/png']),
        }),
      ).to.eql(false);

      expect(
        isMimeTypeAllowed({
          mimeType: 'image/jpeg',
          allowList: new Set(['*', '!image/png']),
        }),
      ).to.eql(true);
    });

    test('a negation takes precedence over a positive match', () => {
      expect(
        isMimeTypeAllowed({
          mimeType: 'image/png',
          allowList: new Set(['image/png', '!image/png']),
        }),
      ).to.eql(false);
    });

    test('a mimetype can have parameters', () => {
      expect(
        isMimeTypeAllowed({
          mimeType: 'application/pdf; charset=utf-8',
          allowList: new Set(['application/pdf']),
        }),
      ).to.eql(true);

      expect(
        isMimeTypeAllowed({
          mimeType: 'application/pdf; charset=utf-8',
          allowList: new Set(['*', '!application/pdf']),
        }),
      ).to.eql(false);
    });

    test('invalid mimetype is not allowed', () => {
      expect(
        isMimeTypeAllowed({
          mimeType: 'application',
          allowList: new Set(['*']),
        }),
      ).to.eql(false);

      expect(
        isMimeTypeAllowed({
          mimeType: 'application/',
          allowList: new Set(['*']),
        }),
      ).to.eql(false);

      expect(
        isMimeTypeAllowed({
          mimeType: '/pdf',
          allowList: new Set(['*']),
        }),
      ).to.eql(false);

      expect(
        isMimeTypeAllowed({
          mimeType: 'application/pdf/extra',
          allowList: new Set(['*']),
        }),
      ).to.eql(false);

      expect(
        isMimeTypeAllowed({
          mimeType: '',
          allowList: new Set(['*']),
        }),
      ).to.eql(false);
    });
  });
});
