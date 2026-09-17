import type {
  StoragePatternExpressionDefinition,
  StoragePatternInterpolationContext,
} from './storage-pattern.types';
import { isNilOrEmptyString } from '../../shared/utils';
import { expressionTransformers } from './storage-pattern.definitions';

export function evaluateStoragePatternExpression({
  expressionDefinition,
  context,
  transformerParts,
}: {
  expressionDefinition: StoragePatternExpressionDefinition;
  context: StoragePatternInterpolationContext;
  transformerParts: string[];
}): string {
  const value = transformerParts.reduce((value, transformerPart) => {
    const [transformerRawName, ...transformerArgsParts] = transformerPart.split(' ');
    const transformerName = transformerRawName?.trim();
    const argumentsString = transformerArgsParts.join(' ').trim();

    if (isNilOrEmptyString(transformerName)) {
      throw new Error('Transformer name cannot be empty');
    }

    const transformer = expressionTransformers[transformerName];

    if (!transformer) {
      throw new Error(`Unknown transformer: ${transformerName}`);
    }

    // Preserve missing values until the fallback is applied, but still validate transformers.
    if (isNilOrEmptyString(value)) {
      return value;
    }

    const transformerArguments = tokenizeStringArguments({ argumentsString });

    return transformer({ value, args: transformerArguments });
  }, expressionDefinition.resolve(context));

  if (isNilOrEmptyString(value)) {
    if (expressionDefinition.fallback === undefined) {
      throw new Error('Expression resolved to an empty value');
    }

    return expressionDefinition.fallback;
  }

  return value;
}

export function tokenizeStringArguments({
  argumentsString,
}: {
  argumentsString: string | undefined;
}): string[] {
  if (isNilOrEmptyString(argumentsString)) {
    return [];
  }

  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < argumentsString.length) {
    const char = argumentsString[i];

    // Escaped quotes
    if (char === '\\' && i + 1 < argumentsString.length && argumentsString[i + 1] === '"') {
      current += '"';
      i += 2;
      continue;
    }

    if (char === '"') {
      if (!inQuotes && current.length > 0) {
        args.push(current);
        current = '';
      }
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
