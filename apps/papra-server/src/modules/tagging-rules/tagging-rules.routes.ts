import type { RouteDefinitionContext } from '../app/server.types';
import type { TaggingRuleField, TaggingRuleOperator } from './tagging-rules.types';
import { z } from 'zod';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { tagIdRegex } from '../tags/tags.constants';
import { TAGGING_RULE_FIELDS, TAGGING_RULE_OPERATORS } from './tagging-rules.constants';
import { createTaggingRulesRepository } from './tagging-rules.repository';
import { taggingRuleIdSchema } from './tagging-rules.schemas';
import { createTaggingRule } from './tagging-rules.usecases';

export function registerTaggingRulesRoutes(context: RouteDefinitionContext) {
  setupGetOrganizationTaggingRulesRoute(context);
  setupCreateTaggingRuleRoute(context);
  setupDeleteTaggingRuleRoute(context);
  setupGetTaggingRuleRoute(context);
  setupUpdateTaggingRuleRoute(context);
}

function setupGetOrganizationTaggingRulesRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/tagging-rules',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId } = context.req.valid('param');

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { taggingRules } = await taggingRulesRepository.getOrganizationTaggingRules({ organizationId });

      return context.json({
        taggingRules,
      });
    },
  );
}

function setupCreateTaggingRuleRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/tagging-rules',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    validateJsonBody(z.object({
      name: z.string().min(1).max(64),
      description: z.string().max(256).optional(),
      enabled: z.boolean().optional(),
      conditions: z.array(z.object({
        field: z.enum(Object.values(TAGGING_RULE_FIELDS) as [TaggingRuleField, ...TaggingRuleField[]]), // casting since zod require non-empty array
        operator: z.enum(Object.values(TAGGING_RULE_OPERATORS) as [TaggingRuleOperator, ...TaggingRuleOperator[]]), // casting since zod require non-empty array
        value: z.string().min(1).max(256),
      })),
      tagIds: z.array(z.string().regex(tagIdRegex)).min(1),
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId } = context.req.valid('param');
      const { name, description, enabled, conditions, tagIds } = context.req.valid('json');

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await createTaggingRule({ name, description, enabled, conditions, tagIds, organizationId, taggingRulesRepository });

      return context.body(null, 204);
    },
  );
}

function setupDeleteTaggingRuleRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/tagging-rules/:taggingRuleId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      taggingRuleId: taggingRuleIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, taggingRuleId } = context.req.valid('param');

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await taggingRulesRepository.deleteOrganizationTaggingRule({ organizationId, taggingRuleId });

      return context.body(null, 204);
    },
  );
}

function setupGetTaggingRuleRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/tagging-rules/:taggingRuleId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      taggingRuleId: taggingRuleIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, taggingRuleId } = context.req.valid('param');

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { taggingRule } = await taggingRulesRepository.getOrganizationTaggingRule({ organizationId, taggingRuleId });

      return context.json({
        taggingRule,
      });
    },
  );
}

function setupUpdateTaggingRuleRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/tagging-rules/:taggingRuleId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      taggingRuleId: taggingRuleIdSchema,
    })),
    validateJsonBody(z.object({
      name: z.string().min(1).max(64),
      description: z.string().max(256).optional(),
      enabled: z.boolean().optional(),
      conditions: z.array(z.object({
        field: z.enum(Object.values(TAGGING_RULE_FIELDS) as [TaggingRuleField, ...TaggingRuleField[]]), // casting since zod require non-empty array
        operator: z.enum(Object.values(TAGGING_RULE_OPERATORS) as [TaggingRuleOperator, ...TaggingRuleOperator[]]), // casting since zod require non-empty array
        value: z.string().min(1).max(256),
      })).max(10),
      tagIds: z.array(z.string().regex(tagIdRegex)).min(1),
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, taggingRuleId } = context.req.valid('param');
      const { name, description, enabled, conditions, tagIds } = context.req.valid('json');

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await taggingRulesRepository.updateOrganizationTaggingRule({
        organizationId,
        taggingRuleId,
        taggingRule: { name, description, enabled, conditions, tagIds },
      });

      return context.body(null, 204);
    },
  );
}
