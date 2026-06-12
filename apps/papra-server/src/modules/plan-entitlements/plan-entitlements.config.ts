import type { AppConfigDefinition } from '../config/config.types';
import { selfhstEntitlementsConfig } from './selfhst/selfhst.plan-entitlements.config';

export const planEntitlementsConfig = {
  selfhst: selfhstEntitlementsConfig,
} as const satisfies AppConfigDefinition;
