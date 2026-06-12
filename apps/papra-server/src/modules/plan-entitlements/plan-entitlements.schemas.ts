import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import { planEntitlementIdRegex } from './plan-entitlements.constants';
import type { PlanEntitlementType } from './plan-entitlements.registry';
import { planEntitlementsDefinitionFactories } from './plan-entitlements.registry';

export const planEntitlementIdSchema = createRegexSchema(planEntitlementIdRegex);

export const planEntitlementTypeSchema = v.picklist(
  Object.keys(planEntitlementsDefinitionFactories) as PlanEntitlementType[],
);
