import type { StoragePatternInterpolationContext } from './storage-pattern.types';
import { castError } from '@corentinth/chisels';
import { isNil, isNilOrEmptyString } from '../../shared/utils';
import { DUMMY_DOCUMENT_ID, DUMMY_ORGANIZATION_ID } from './storage-pattern.constants';
import { expressionsDefinitions } from './storage-pattern.definitions';
import { evaluateStoragePatternExpression } from './storage-pattern.models';

export function buildStorageKey({
  storageKeyPattern,
  ...context
}: { storageKeyPattern: string } & StoragePatternInterpolationContext) {
  const storageKey = storageKeyPattern.replace(/\{\{(.*?)\}\}(?!\})/g, (_match, rawExpression) => {
    if (isNil(rawExpression) || typeof rawExpression !== 'string') {
      throw new Error('Expression cannot be empty');
    }

    const [expression, ...transformerParts] = rawExpression.split('|').map((part) => part.trim());

    if (isNilOrEmptyString(expression)) {
      throw new Error('Expression cannot be empty');
    }

    const expressionExists = expression in expressionsDefinitions;

    if (!expressionExists) {
      throw new Error(`Unknown expression: ${expression}`);
    }

    const expressionDefinition = expressionsDefinitions[expression];

    if (!expressionDefinition) {
      // This should never happen because of the check above, but for type safety
      throw new Error(`No definition found for expression: ${expression}`);
    }

    return evaluateStoragePatternExpression({ expressionDefinition, context, transformerParts });
  });

  return { storageKey };
}

export function isStoragePatternValid({
  storageKeyPattern,
}: {
  storageKeyPattern: string;
}): { isValid: true } | { isValid: false; error: Error } {
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
