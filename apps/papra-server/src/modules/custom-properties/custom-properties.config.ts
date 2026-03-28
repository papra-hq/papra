import type { ConfigDefinition } from 'figue';
import { coercedStrictlyPositiveIntegerSchema } from '../shared/schemas/number.schemas';

export const customPropertiesConfig = {
  maxCustomPropertiesPerOrganization: {
    doc: 'The maximum number of custom property definitions an organization can have',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 100,
    env: 'MAX_CUSTOM_PROPERTIES_PER_ORGANIZATION',
  },
} as const satisfies ConfigDefinition;
