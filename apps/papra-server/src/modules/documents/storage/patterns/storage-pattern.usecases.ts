import type { StoragePatternInterpolationContext } from './storage-pattern.types';
import { isNil } from '../../../shared/utils';
import { expressionsDefinitions, expressionTransformers } from './storage-pattern.definitions';

function parseTransformerArgs(raw: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < raw.length) {
    const char = raw[i];

    // Escaped quotes
    if (char === '\\' && i + 1 < raw.length && raw[i + 1] === '"') {
      current += '"';
      i += 2;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (char === ' ' && !inQuotes) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
      i++;
      continue;
    }

    current += char;
    i++;
  }

  if (current.length > 0) {
    args.push(current);
  }

  return args;
}

export function buildStoragePath({ pattern, context }: { pattern: string; context: StoragePatternInterpolationContext }) {
  const storagePath = pattern.replace(/\{\{(.*?)\}\}(?!\})/g, (match, rawExpression) => {
    if (isNil(rawExpression) || typeof rawExpression !== 'string') {
      return match;
    }

    const [expression, ...transformerParts] = rawExpression.split('|').map(part => part.trim());

    const expressionBuilder = expressionsDefinitions[expression as keyof typeof expressionsDefinitions];

    if (!expressionBuilder) {
      return match;
    }

    const baseValue = expressionBuilder(context);

    if (transformerParts.length === 0) {
      return String(baseValue);
    }

    return transformerParts.reduce((value, transformerPart) => {
      const [transformerRawName, ...transformerArgsSplitted] = transformerPart.split(' ');

      const transformerName = transformerRawName?.trim();
      const transformerArgsRaw = transformerArgsSplitted.join(' ').trim();

      const transformer = expressionTransformers[transformerName as keyof typeof expressionTransformers];

      if (!transformer) {
        return value;
      }

      const transformerArgs = transformerArgsRaw.length > 0 ? parseTransformerArgs(transformerArgsRaw) : undefined;

      return transformer({ value, args: transformerArgs });
    }, baseValue);
  });

  return { storagePath };
}
