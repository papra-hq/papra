import * as v from 'valibot';

export function createQueryPaginationSchemaKeys({ maxPageSize = 100, defaultPageSize = 25 }: { maxPageSize?: number; defaultPageSize?: number } = {}) {
  if (defaultPageSize < 1) {
    throw new Error('defaultPageSize must be at least 1');
  }

  if (maxPageSize < 1) {
    throw new Error('maxPageSize must be at least 1');
  }

  if (defaultPageSize > maxPageSize) {
    throw new Error('defaultPageSize cannot be greater than maxPageSize');
  }

  return {
    pageIndex: v.optional(v.pipe(v.string(), v.toNumber(), v.safeInteger(), v.minValue(0)), '0'),
    pageSize: v.optional(v.pipe(v.string(), v.toNumber(), v.safeInteger(), v.minValue(1), v.maxValue(maxPageSize)), String(defaultPageSize)),
  };
}
