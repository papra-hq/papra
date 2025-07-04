import { describe, expect, test } from 'vitest';
import { createError, createErrorFactory, formatPublicErrorPayload, isCustomError } from './errors';

describe('errors', () => {
  describe('isCustomError', () => {
    test('type guards to check if an error is a custom error', () => {
      expect(isCustomError(new Error('foo'))).to.eql(false);
      expect(isCustomError({ isCustomError: true })).to.eql(false);

      expect(isCustomError(createError({ message: 'foo', code: 'bar', statusCode: 500 }))).to.eql(true);
    });
  });

  describe('createError', () => {
    test('permits to create a custom error, extending the native Error class with custom properties', () => {
      const error = createError({ message: 'foo', code: 'bar', statusCode: 500 });

      expect(error).toBeInstanceOf(Error);
      expect(error.message).to.eql('foo');
      expect(error.code).to.eql('bar');
      expect(error.statusCode).to.eql(500);
      expect(error.isInternal).to.eql(false);
    });

    test('accepts an optional cause property to attach the original error that caused the custom error', () => {
      const cause = new Error('original error');
      const error = createError({ message: 'foo', code: 'bar', statusCode: 500, cause });

      expect(error.cause).toBeInstanceOf(Error);
      expect(error.cause?.message).to.eql('original error');
    });
  });

  describe('createErrorFactory', () => {
    test('creates a factory function to create custom errors with an extendable base configuration', () => {
      const createFooError = createErrorFactory({ message: 'foo', code: 'bar', statusCode: 500 });

      expect(
        createFooError(),
      ).to.includes({
        message: 'foo',
        code: 'bar',
        statusCode: 500,
      });

      expect(
        createFooError({ message: 'baz' }),
      ).to.includes({
        message: 'baz',
        code: 'bar',
        statusCode: 500,
      });

      expect(
        createFooError({ code: 'qux' }),
      ).to.includes({
        message: 'foo',
        code: 'qux',
        statusCode: 500,
      });

      expect(
        createFooError({ statusCode: 400 }),
      ).to.includes({
        message: 'foo',
        code: 'bar',
        statusCode: 400,
      });

      expect(
        createFooError({ message: 'baz', code: 'qux', statusCode: 400 }),
      ).to.includes({
        message: 'baz',
        code: 'qux',
        statusCode: 400,
      });
    });
  });

  describe('formatPublicError', () => {
    test('simple type safe helper to format an normalize an error for public consumption', () => {
      expect(
        formatPublicErrorPayload({ message: 'foo', code: 'bar' }),
      ).to.eql({
        error: {
          message: 'foo',
          code: 'bar',
        },
      });

      expect(
        formatPublicErrorPayload(createError({ message: 'baz', code: 'qux', statusCode: 500 })),
      ).to.eql({
        error: {
          message: 'baz',
          code: 'qux',
        },
      });
    });
  });
});
