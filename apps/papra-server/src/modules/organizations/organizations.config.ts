import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const organizationsConfig = {
  maxOrganizationCount: {
    doc: 'The maximum number of organizations a standard user can have',
    schema: z.coerce.number().int().positive(),
    default: 10,
    env: 'MAX_ORGANIZATION_COUNT_PER_USER',
  },
} as const satisfies ConfigDefinition;
