import { booleanishSchema } from '../../config/config.schemas';
import type { AppConfigDefinition } from '../../config/config.types';

export const selfhstEntitlementsConfig = {
  isEnabledForNewClaims: {
    doc: 'Whether the selfhst free plan entitlements is enabled for new claims.',
    schema: booleanishSchema,
    default: true,
    env: 'SELFHST_ENTITLEMENTS_IS_ENABLED_FOR_NEW_CLAIMS',
  },
} as const satisfies AppConfigDefinition;
