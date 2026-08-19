import { describe, expect, expectTypeOf, test } from 'vitest';
import { createError, createErrorFactory, formatPublicErrorPayload, isCustomError } from './errors';

describe('errors', () => {
  describe('isCustomError', () => {
    test('type guards to check if an error is a custom error', () => {
      expect(isCustomError(new Error('foo'))).to.eql(false);
      expect(isCustomError({ isCustomError: true })).to.eql(false);
      expect(isCustomError(createError({ message: 'foo', code: 'bar', statusCode: 500 }))).to.eql(
        true,
      );

      expect(isCustomError('foo')).to.eql(false);
      expect(isCustomError(null)).to.eql(false);
      expect(isCustomError(undefined)).to.eql(false);
      expect(isCustomError({})).to.eql(false);
      expect(isCustomError({ message: 'foo', code: 'bar', statusCode: 500 })).to.eql(false);
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

      expect(error.cause).toBe(cause);
    });
  });

  describe('createErrorFactory', () => {
    test('creates a factory with an immutable typed definition', () => {
      const createFooError = createErrorFactory({ message: 'foo', code: 'bar', statusCode: 500 });
      const cause = new Error('cause');

      expect(createFooError()).to.includes({
        message: 'foo',
        code: 'bar',
        statusCode: 500,
      });
      expect(createFooError({ message: 'baz', cause })).to.includes({
        message: 'baz',
        code: 'bar',
        statusCode: 500,
        cause,
      });
      expect(createFooError.definition).to.eql({
        message: 'foo',
        code: 'bar',
        statusCode: 500,
      });
      expect(Object.isFrozen(createFooError.definition)).to.eql(true);
      expectTypeOf(createFooError.definition.code).toEqualTypeOf<'bar'>();
      expectTypeOf(createFooError.definition.statusCode).toEqualTypeOf<500>();

      // @ts-expect-error Error codes are immutable contract discriminants.
      createFooError({ code: 'qux' });

      // @ts-expect-error Error statuses are immutable contract discriminants.
      createFooError({ statusCode: 400 });
    });
  });

  describe('formatPublicError', () => {
    test('simple type safe helper to format an normalize an error for public consumption', () => {
      expect(formatPublicErrorPayload({ message: 'foo', code: 'bar' })).to.eql({
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
