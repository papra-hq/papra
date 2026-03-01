import type { StoragePatternInterpolationContext } from './storage-pattern.types';
import { castError } from '@corentinth/chisels';
import { isNil, isNilOrEmptyString } from '../../../shared/utils';
import { DUMMY_DOCUMENT_ID, DUMMY_ORGANIZATION_ID } from './storage-pattern.constants';
import { expressionsDefinitions, expressionTransformers } from './storage-pattern.definitions';
import { tokenizeStringArguments } from './storage-pattern.models';

export function buildStorageKey({ storageKeyPattern, ...context }: { storageKeyPattern: string } & StoragePatternInterpolationContext) {
  const storageKey = storageKeyPattern.replace(/\{\{(.*?)\}\}(?!\})/g, (_match, rawExpression) => {
    if (isNil(rawExpression) || typeof rawExpression !== 'string') {
      throw new Error('Expression cannot be empty');
    }

    const [expression, ...transformerParts] = rawExpression.split('|').map(part => part.trim());

    if (isNilOrEmptyString(expression)) {
      throw new Error('Expression cannot be empty');
    }

    const expressionExists = expression in expressionsDefinitions;

    if (!expressionExists) {
      throw new Error(`Unknown expression: ${expression}`);
    }

    const expressionBuilder = expressionsDefinitions[expression];

    if (!expressionBuilder) {
      // This should never happen because of the check above, but for type safety
      throw new Error(`No builder found for expression: ${expression}`);
    }

    const baseValue = expressionBuilder(context);

    if (transformerParts.length === 0) {
      return String(baseValue);
    }

    return transformerParts.reduce((value, transformerPart) => {
      const [transformerRawName, ...transformerArgsParts] = transformerPart.split(' ');

      const transformerName = transformerRawName?.trim();
      const argumentsString = transformerArgsParts.join(' ').trim();

      const transformer = expressionTransformers[transformerName as keyof typeof expressionTransformers];

      if (!transformer) {
        throw new Error(`Unknown transformer: ${transformerName}`);
      }

      const transformerArguments = tokenizeStringArguments({ argumentsString });

      return transformer({ value, args: transformerArguments });
    }, baseValue);
  });

  return { storageKey };
}

export function isStoragePatternValid({ storageKeyPattern }: { storageKeyPattern: string }): { isValid: true } | { isValid: false; error: Error } {
  const endsWithSlash = storageKeyPattern.endsWith('/');

  if (endsWithSlash) {
    return {
      isValid: false,
      error: new Error('Pattern cannot end with a slash'),
    };
  }

  try {
    buildStorageKey({
      storageKeyPattern,
      documentId: DUMMY_DOCUMENT_ID,
      documentName: 'my-document.pdf',
      organizationId: DUMMY_ORGANIZATION_ID,
      now: new Date(),
    });

    return {
      isValid: true,
    };
  } catch (error) {
    return {
      isValid: false,
      error: castError(error),
    };
  }
}
