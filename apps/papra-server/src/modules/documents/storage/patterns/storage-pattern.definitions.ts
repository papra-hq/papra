import type { StoragePatternExpressionTransformer, StoragePatternInterpolationContext } from './storage-pattern.types';
import { formatDate, isValidDate } from '../../../shared/date';

export const expressionsDefinitions: Record<string, (context: StoragePatternInterpolationContext) => string> = {
  'document.id': context => context.documentId,
  'document.name': context => context.documentName,
  'organization.id': context => context.organizationId,
  'currentDate': context => context.now.toISOString(),
  'random': () => Math.random().toString(36).substring(2, 10),
  ...[
    'yyyy',
    'MM',
    'dd',
    'HH',
    'mm',
    'ss',
    'SSS',
  ].reduce((acc, token) => ({
    ...acc,
    [`currentDate.${token}`]: (context: StoragePatternInterpolationContext) => formatDate(context.now, `{${token}}`),
  }), {}),
};

export const expressionTransformers: Record<string, StoragePatternExpressionTransformer> = {
  uppercase: ({ value }) => String(value).toUpperCase(),
  lowercase: ({ value }) => String(value).toLowerCase(),
  formatDate: ({ value, args }) => {
    if (!(value instanceof Date || typeof value === 'string' || typeof value === 'number')) {
      throw new TypeError(`Value must be a date or a date-ish string, got: ${String(value)}`);
    }

    const date = new Date(value);

    if (!isValidDate(date)) {
      throw new Error(`Invalid date value: ${String(value)}`);
    }

    const format = args?.[0] ?? '{yyyy}-{MM}-{dd}';

    return formatDate(date, format);
  },

  padStart: ({ value, args }) => {
    const targetLength = Number.parseInt(args?.[0] ?? '0', 10);
    const padString = args?.[1] ?? ' ';

    return String(value).padStart(targetLength, padString);
  },

  padEnd: ({ value, args }) => {
    const targetLength = Number.parseInt(args?.[0] ?? '0', 10);
    const padString = args?.[1] ?? ' ';

    return String(value).padEnd(targetLength, padString);
  },
};
