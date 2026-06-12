import { injectArguments } from '@corentinth/chisels';
import type {
  PlanEntitlementDriver,
  PlanEntitlementDriverFactoryParams,
} from './plan-entitlements.types';
import { selfhstPlanEntitlementsFactory } from './selfhst/selfhst.plan-entitlements';
import { SELFHST_ENTITLEMENT_NAME } from './selfhst/selfhst.plan-entitlements.constants';

export const planEntitlementsDefinitionFactories = {
  [SELFHST_ENTITLEMENT_NAME]: selfhstPlanEntitlementsFactory,
};

export type PlanEntitlementType = keyof typeof planEntitlementsDefinitionFactories;

export type PlanEntitlementDefinitionRegistry = ReturnType<
  typeof createPlanEntitlementDefinitionRegistry
>;

type PlanEntitlementDefinitionRegistryLookup = Record<PlanEntitlementType, PlanEntitlementDriver>;

export function createPlanEntitlementDefinitionRegistry(
  params: PlanEntitlementDriverFactoryParams,
) {
  const registry: PlanEntitlementDefinitionRegistryLookup = Object.entries(
    planEntitlementsDefinitionFactories,
  ).reduce(
    (registry, [type, factory]) => ({
      ...registry,
      [type]: factory(params),
    }),
    {} as PlanEntitlementDefinitionRegistryLookup,
  );

  return injectArguments({ getPlanEntitlementDriver }, { registry });
}

function getPlanEntitlementDriver({
  type,
  registry,
}: {
  type: PlanEntitlementType;
  registry: PlanEntitlementDefinitionRegistryLookup;
}): { planEntitlementDriver: PlanEntitlementDriver | undefined } {
  const planEntitlementDriver = registry[type];

  return {
    planEntitlementDriver,
  };
}
