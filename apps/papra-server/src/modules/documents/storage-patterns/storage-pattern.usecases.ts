import type { OrganizationsRepository } from '../../organizations/organizations.repository';
import type {
  ResolveStoragePatternContext,
  StoragePatternInterpolationContext,
} from './storage-pattern.types';
import { castError } from '@corentinth/chisels';
import { createOrganizationNotFoundError } from '../../organizations/organizations.errors';
import { DUMMY_DOCUMENT_ID, DUMMY_ORGANIZATION_ID } from './storage-pattern.constants';
import { expressionsDefinitions } from './storage-pattern.definitions';
import { evaluateStoragePatternExpression, parseStoragePattern } from './storage-pattern.models';

export function buildResolveStoragePatternContext({
  organizationsRepository,
}: {
  organizationsRepository: Pick<OrganizationsRepository, 'getOrganizationById'>;
}): ResolveStoragePatternContext {
  return async ({ storageKeyPattern, ...context }) => {
    const { expressionIds } = parseStoragePattern({ storageKeyPattern });

    if (!expressionIds.has('organization.name')) {
      return context;
    }

    const { organization } = await organizationsRepository.getOrganizationById({
      organizationId: context.organizationId,
    });

    if (!organization) {
      throw createOrganizationNotFoundError();
    }

    return { ...context, organizationName: organization.name };
  };
}

export function buildStorageKey({
  storageKeyPattern,
  ...context
}: { storageKeyPattern: string } & StoragePatternInterpolationContext) {
  const { parts } = parseStoragePattern({ storageKeyPattern });
  const storageKey = parts
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }

      return evaluateStoragePatternExpression({
        expressionDefinition: expressionsDefinitions[part.expressionId]!,
        context,
        transformerParts: part.transformerParts,
      });
    })
    .join('');

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
      documentDate: new Date(),
      documentCreatedAt: new Date(),
      organizationId: DUMMY_ORGANIZATION_ID,
      organizationName: 'My Organization',
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
