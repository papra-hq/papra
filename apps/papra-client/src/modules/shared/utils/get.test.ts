import { describe, expect, test } from 'vitest';
import { get } from './get';

describe('get', () => {
  test('gets value from simple path', () => {
    const obj = { user: { name: 'John', age: 30 } };

    expect(get(obj, ['user', 'name'])).toBe('John');
    expect(get(obj, ['user', 'age'])).toBe(30);
  });

  test('returns undefined for missing path', () => {
    const obj = { user: { name: 'John' } };

    expect(get(obj, ['user', 'missing'])).toBeUndefined();
    expect(get(obj, ['missing', 'path'])).toBeUndefined();
  });

  test('returns undefined for null/undefined objects', () => {
    expect(get(null, ['any'])).toBeUndefined();
    expect(get(undefined, ['any'])).toBeUndefined();
  });

  test('returns undefined for non-object values', () => {
    expect(get('string', ['any'])).toBeUndefined();
    expect(get(123, ['any'])).toBeUndefined();
    expect(get(true, ['any'])).toBeUndefined();
  });

  test('handles deeply nested paths', () => {
    const obj = {
      level1: {
        level2: {
          level3: {
            value: 'deep',
          },
        },
      },
    };

    expect(get(obj, ['level1', 'level2', 'level3', 'value'])).toBe('deep');
  });

  test('returns first non-undefined value from multiple paths', () => {
    const obj = {
      primary: undefined,
      secondary: 'fallback',
      tertiary: 'another',
    };

    expect(get(obj, ['missing'], ['secondary'])).toBe('fallback');
    expect(get(obj, ['primary'], ['secondary'])).toBe('fallback');
    expect(get(obj, ['missing'], ['another-missing'], ['tertiary'])).toBe('another');
  });

  test('returns undefined if all paths are undefined', () => {
    const obj = { a: 1, b: 2 };

    expect(get(obj, ['x'], ['y'], ['z'])).toBeUndefined();
  });

  test('handles paths with undefined intermediate values', () => {
    const obj = {
      user: {
        profile: undefined,
      },
    };

    expect(get(obj, ['user', 'profile', 'name'])).toBeUndefined();
  });

  test('handles arrays in paths', () => {
    const obj = {
      users: [
        { name: 'John' },
        { name: 'Jane' },
      ],
    };

    expect(get(obj, ['users', '0', 'name'])).toBe('John');
    expect(get(obj, ['users', '1', 'name'])).toBe('Jane');
  });

  test('handles empty path array', () => {
    const obj = { value: 'test' };

    expect(get(obj, [])).toBe(obj);
  });

  test('works with numeric keys', () => {
    const obj = {
      123: { value: 'numeric key' },
    };

    expect(get(obj, ['123', 'value'])).toBe('numeric key');
  });

  test('handles objects with null prototype', () => {
    const obj = Object.create(null);
    obj.key = 'value';

    expect(get(obj, ['key'])).toBe('value');
  });

  test('returns value even if it is falsy (but not undefined)', () => {
    const obj = {
      zero: 0,
      emptyString: '',
      false: false,
      null: null,
    };

    expect(get(obj, ['zero'])).toBe(0);
    expect(get(obj, ['emptyString'])).toBe('');
    expect(get(obj, ['false'])).toBe(false);
    expect(get(obj, ['null'])).toBe(null);
  });

  test('stops at first non-undefined value in fallback chain', () => {
    const obj = {
      first: undefined,
      second: null, // null is not undefined
      third: 'value',
    };

    expect(get(obj, ['first'], ['second'], ['third'])).toBe(null);
  });

  test('handles complex real-world scenario', () => {
    const apiResponse = {
      data: {
        user: {
          profile: {
            contact: {
              email: 'user@example.com',
            },
          },
        },
      },
      meta: {
        fallbackEmail: 'admin@example.com',
      },
    };

    // Try to get user email, fallback to admin email
    expect(
      get(apiResponse, ['data', 'user', 'profile', 'contact', 'email'], ['meta', 'fallbackEmail']),
    ).toBe('user@example.com');

    // If user email is missing, get admin email
    const apiResponseWithoutUserEmail = {
      data: { user: {} },
      meta: { fallbackEmail: 'admin@example.com' },
    };

    expect(
      get(apiResponseWithoutUserEmail, ['data', 'user', 'profile', 'contact', 'email'], ['meta', 'fallbackEmail']),
    ).toBe('admin@example.com');
  });
});
