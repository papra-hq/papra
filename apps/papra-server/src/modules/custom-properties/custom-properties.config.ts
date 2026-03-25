import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const customPropertiesConfig = {
  maxCustomPropertiesPerOrganization: {
    doc: 'The maximum number of custom property definitions an organization can have',
    schema: z.coerce.number().int().positive(),
    default: 100,
    env: 'MAX_CUSTOM_PROPERTIES_PER_ORGANIZATION',
  },
} as const satisfies ConfigDefinition;
