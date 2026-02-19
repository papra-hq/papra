import type { Config } from '../../../config/config.types';

export type StoragePatternInterpolationContext = {
  documentId: string;
  documentName: string;
  organizationId: string;
  now: Date;
};

export type StoragePatternExpressionTransformer = (args: { value: unknown; args?: string[] }) => string;

export type StoragePatternConfig = Config['documentsStorage']['pattern'];
