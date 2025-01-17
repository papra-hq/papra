import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const documentsConfig = {
  deletedDocumentsRetentionDays: {
    doc: 'The retention period in days for deleted documents',
    schema: z.coerce.number().int().positive(),
    default: 30,
    env: 'DOCUMENTS_DELETED_DOCUMENTS_RETENTION_DAYS',
  },
} as const satisfies ConfigDefinition;
