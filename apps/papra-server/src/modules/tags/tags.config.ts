import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const tagsConfig = {
  maxTagsPerOrganization: {
    doc: 'The maximum number of tags an organization can have',
    schema: z.coerce.number().int().positive(),
    default: 200,
    env: 'MAX_TAGS_PER_ORGANIZATION',
  },
} as const satisfies ConfigDefinition;
