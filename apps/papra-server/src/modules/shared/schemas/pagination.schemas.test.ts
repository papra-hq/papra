import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { createQueryPaginationSchemaKeys } from './pagination.schemas';

describe('pagination.schemas', () => {
  describe('createQueryPaginationSchemaKeys', () => {
    describe('start-time guards on options', () => {
      test('it throws if defaultPageSize is less than 1', () => {
        expect(() => createQueryPaginationSchemaKeys({ defaultPageSize: 0 })).toThrow('defaultPageSize must be at least 1');
        expect(() => createQueryPaginationSchemaKeys({ defaultPageSize: -1 })).toThrow('defaultPageSize must be at least 1');
      });

      test('it throws if maxPageSize is less than 1', () => {
        expect(() => createQueryPaginationSchemaKeys({ maxPageSize: 0 })).toThrow('maxPageSize must be at least 1');
        expect(() => createQueryPaginationSchemaKeys({ maxPageSize: -1 })).toThrow('maxPageSize must be at least 1');
      });

      test('it throws if defaultPageSize is greater than maxPageSize', () => {
        expect(() => createQueryPaginationSchemaKeys({ defaultPageSize: 50, maxPageSize: 10 })).toThrow('defaultPageSize cannot be greater than maxPageSize');
      });

      test('it does not throw when defaultPageSize equals maxPageSize', () => {
        expect(() => createQueryPaginationSchemaKeys({ defaultPageSize: 10, maxPageSize: 10 })).not.toThrow();
      });
    });

    describe('validate and coerce string query params about pagination', () => {
      test('a page index should be an integer string greater or equal to 0, defaulting to 0 if not provided', () => {
        const { pageIndex } = createQueryPaginationSchemaKeys();

        expect(v.parse(pageIndex, '0')).toBe(0);
        expect(v.parse(pageIndex, '1')).toBe(1);
        expect(v.parse(pageIndex, '1205')).toBe(1205);
        expect(v.parse(pageIndex, String(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);

        expect(v.parse(pageIndex, undefined)).toBe(0);

        expect(() => v.parse(pageIndex, '-1')).toThrow();
        expect(() => v.parse(pageIndex, '1.5')).toThrow();
        expect(() => v.parse(pageIndex, 1)).toThrow();
        expect(() => v.parse(pageIndex, 'abc')).toThrow();
        expect(() => v.parse(pageIndex, Number.NaN)).toThrow();
        expect(() => v.parse(pageIndex, String(Number.MAX_SAFE_INTEGER + 1))).toThrow();
      });

      test('a page size should be an integer string between 1 and maxPageSize (100 by default), defaulting to defaultPageSize (25 by default) if not provided', () => {
        const { pageSize } = createQueryPaginationSchemaKeys();

        expect(v.parse(pageSize, '1')).toBe(1);
        expect(v.parse(pageSize, '25')).toBe(25);
        expect(v.parse(pageSize, '100')).toBe(100);

        expect(v.parse(pageSize, undefined)).toBe(25);

        expect(() => v.parse(pageSize, '0')).toThrow();
        expect(() => v.parse(pageSize, '101')).toThrow();
        expect(() => v.parse(pageSize, '-1')).toThrow();
        expect(() => v.parse(pageSize, '1.5')).toThrow();
        expect(() => v.parse(pageSize, 1)).toThrow();
        expect(() => v.parse(pageSize, 'abc')).toThrow();
        expect(() => v.parse(pageSize, Number.NaN)).toThrow();
      });

      test('it should be possible to customize maxPageSize and defaultPageSize', () => {
        const { pageSize } = createQueryPaginationSchemaKeys({ maxPageSize: 50, defaultPageSize: 10 });

        expect(v.parse(pageSize, '1')).toBe(1);
        expect(v.parse(pageSize, '10')).toBe(10);
        expect(v.parse(pageSize, '50')).toBe(50);

        expect(v.parse(pageSize, undefined)).toBe(10);

        expect(() => v.parse(pageSize, '0')).toThrow();
        expect(() => v.parse(pageSize, '51')).toThrow();
      });

      test('it\'s possible to build an object schema with the pagination keys and validate an object with them', () => {
        expect(
          v.parse(
            v.strictObject(createQueryPaginationSchemaKeys()),
            { pageIndex: '2', pageSize: '30' },
          ),
        ).toEqual(
          { pageIndex: 2, pageSize: 30 },
        );

        expect(
          v.parse(
            v.strictObject(createQueryPaginationSchemaKeys()),
            {},
          ),
        ).toEqual(
          { pageIndex: 0, pageSize: 25 },
        );

        expect(
          v.parse(
            v.strictObject({ ...createQueryPaginationSchemaKeys() }),
            {},
          ),
        ).toEqual(
          { pageIndex: 0, pageSize: 25 },
        );
      });
    });
  });
});
