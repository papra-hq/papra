import type { RouteDefinitionContext } from '../app/server.types';
import * as v from 'valibot';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { createError } from '../shared/errors/errors';
import { isNil } from '../shared/utils';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createTaggingRulesRepository } from './tagging-rules.repository';
import { taggingRuleBodySchema, taggingRuleIdSchema } from './tagging-rules.schemas';
import { createTaggingRule } from './tagging-rules.usecases';

export function registerTaggingRulesRoutes(context: RouteDefinitionContext) {
  setupGetOrganizationTaggingRulesRoute(context);
  setupCreateTaggingRuleRoute(context);
  setupDeleteTaggingRuleRoute(context);
  setupGetTaggingRuleRoute(context);
  setupUpdateTaggingRuleRoute(context);
  setupApplyTaggingRuleRoute(context);
}

function setupGetOrganizationTaggingRulesRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/tagging-rules',
    requireAuthentication(),
    validateParams(v.strictObject({
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
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
    })),
    validateJsonBody(taggingRuleBodySchema),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId } = context.req.valid('param');
      const { name, description, enabled, conditionMatchMode, conditions, tagIds } = context.req.valid('json');

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await createTaggingRule({ name, description, enabled, conditionMatchMode, conditions, tagIds, organizationId, taggingRulesRepository });

      return context.body(null, 204);
    },
  );
}

function setupDeleteTaggingRuleRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/tagging-rules/:taggingRuleId',
    requireAuthentication(),
    validateParams(v.strictObject({
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
    validateParams(v.strictObject({
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
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
      taggingRuleId: taggingRuleIdSchema,
    })),
    validateJsonBody(taggingRuleBodySchema),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, taggingRuleId } = context.req.valid('param');
      const { name, description, enabled, conditionMatchMode, conditions, tagIds } = context.req.valid('json');

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await taggingRulesRepository.updateOrganizationTaggingRule({
        organizationId,
        taggingRuleId,
        taggingRule: { name, description, enabled, conditionMatchMode, conditions, tagIds },
      });

      return context.body(null, 204);
    },
  );
}

function setupApplyTaggingRuleRoute({ app, db, taskServices }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/tagging-rules/:taggingRuleId/apply',
    requireAuthentication(),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
      taggingRuleId: taggingRuleIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, taggingRuleId } = context.req.valid('param');

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      // Verify the tagging rule exists before enqueuing the task
      const { taggingRule } = await taggingRulesRepository.getOrganizationTaggingRule({ organizationId, taggingRuleId });

      if (isNil(taggingRule)) {
        throw createError({
          message: 'Tagging rule not found',
          code: 'tagging-rules.not-found',
          statusCode: 404,
        });
      }

      // Enqueue background task
      const { jobId: taskId } = await taskServices.scheduleJob({
        taskName: 'apply-tagging-rule-to-documents',
        data: {
          organizationId,
          taggingRuleId,
        },
      });

      return context.json({ taskId }, 202);
    },
  );
}
