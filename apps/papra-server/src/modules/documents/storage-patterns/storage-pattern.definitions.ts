import type {
  StoragePatternExpressionDefinition,
  StoragePatternExpressionTransformer,
  StoragePatternInterpolationContext,
} from './storage-pattern.types';
import { formatDate, isValidDate } from '../../shared/date';
import { generateRandomString } from '../../shared/random/random.services';
import { isNilOrEmptyString } from '../../shared/utils';
import { ensureSafeFileName } from '../documents.models';

export const expressionsDefinitions: Record<string, StoragePatternExpressionDefinition> = {
  'document.id': { resolve: (context) => context.documentId },
  'document.name': { resolve: (context) => ensureSafeFileName(context.documentName) },
  'document.date': {
    resolve: (context) => context.documentDate?.toISOString(),
    fallback: 'no-date',
  },
  'document.createdAt': { resolve: (context) => context.documentCreatedAt.toISOString() },
  'organization.id': { resolve: (context) => context.organizationId },
  'currentDate': { resolve: (context) => context.now.toISOString() },
  'random': { resolve: () => generateRandomString({ length: 8 }) },
  ...['yyyy', 'MM', 'dd', 'HH', 'mm', 'ss', 'SSS'].reduce(
    (acc, token) => ({
      ...acc,
      [`currentDate.${token}`]: {
        resolve: (context: StoragePatternInterpolationContext) =>
          formatDate(context.now, `{${token}}`),
      },
    }),
    {},
  ),
};

export const expressionTransformers: Record<string, StoragePatternExpressionTransformer> = {
  default: ({ value, args }) => {
    const fallback = args?.[0];

    if (isNilOrEmptyString(fallback)) {
      throw new Error('The default transformer requires a non-empty fallback argument');
    }

    const stringValue = String(value);

    return isNilOrEmptyString(value) ? fallback : stringValue;
  },
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
