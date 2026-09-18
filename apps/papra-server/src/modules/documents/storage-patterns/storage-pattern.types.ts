import type { Config } from '../../config/config.types';

export type StoragePatternInterpolationContext = {
  documentId: string;
  documentName: string;
  documentDate: Date | null;
  documentCreatedAt: Date;
  organizationId: string;
  organizationName?: string;
  now: Date;
};

export type StoragePatternPart = string | { expressionId: string; transformerParts: string[] };

export type ResolveStoragePatternContext = (
  args: { storageKeyPattern: string } & Omit<
    StoragePatternInterpolationContext,
    'organizationName'
  >,
) => Promise<StoragePatternInterpolationContext>;

export type StoragePatternExpressionDefinition = {
  resolve: (context: StoragePatternInterpolationContext) => string | null | undefined;
  fallback?: string;
};

export type StoragePatternExpressionTransformer = (args: {
  value: unknown;
  args?: string[];
}) => string;

export type StoragePatternConfig = Config['documentsStorage']['pattern'];
