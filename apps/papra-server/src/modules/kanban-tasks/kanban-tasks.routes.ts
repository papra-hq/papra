import type { RouteDefinitionContext } from '../app/server.types';
import { z } from 'zod';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createKanbanTaskNotFoundError } from './kanban-tasks.errors';
import { createKanbanTasksRepository } from './kanban-tasks.repository';
import { kanbanTaskIdSchema, kanbanTaskStatusSchema } from './kanban-tasks.schemas';

export function registerKanbanTasksRoutes(context: RouteDefinitionContext) {
  setupGetOrganizationKanbanTasksRoute(context);
  setupCreateKanbanTaskRoute(context);
  setupUpdateKanbanTaskRoute(context);
  setupDeleteKanbanTaskRoute(context);
  setupUpdateKanbanTaskStatusRoute(context);
}

function setupGetOrganizationKanbanTasksRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/kanban-tasks',
    requireAuthentication({}),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),

    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const kanbanTasksRepository = createKanbanTasksRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { tasks } = await kanbanTasksRepository.getOrganizationKanbanTasks({ organizationId });

      return context.json({ tasks });
    },
  );
}

function setupCreateKanbanTaskRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/kanban-tasks',
    requireAuthentication({}),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),

    validateJsonBody(z.object({
      title: z.string().trim().min(1).max(256),
      description: z.string().trim().max(2048).optional(),
      status: kanbanTaskStatusSchema.optional(),
    })),

    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { title, description, status } = context.req.valid('json');

      const kanbanTasksRepository = createKanbanTasksRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { task } = await kanbanTasksRepository.createKanbanTask({
        task: {
          title,
          description,
          status,
          organizationId,
          createdBy: userId,
        },
      });

      return context.json({ task });
    },
  );
}

function setupUpdateKanbanTaskRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/kanban-tasks/:taskId',
    requireAuthentication({}),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      taskId: kanbanTaskIdSchema,
    })),

    validateJsonBody(z.object({
      title: z.string().trim().min(1).max(256).optional(),
      description: z.string().trim().max(2048).optional(),
      status: kanbanTaskStatusSchema.optional(),
      displayOrder: z.number().int().min(0).optional(),
    })),

    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, taskId } = context.req.valid('param');
      const { title, description, status, displayOrder } = context.req.valid('json');

      const kanbanTasksRepository = createKanbanTasksRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { task: existingTask } = await kanbanTasksRepository.getKanbanTaskById({ taskId, organizationId });

      if (!existingTask) {
        throw createKanbanTaskNotFoundError();
      }

      const { task } = await kanbanTasksRepository.updateKanbanTask({ taskId, title, description, status, displayOrder });

      return context.json({ task });
    },
  );
}

function setupDeleteKanbanTaskRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/kanban-tasks/:taskId',
    requireAuthentication({}),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      taskId: kanbanTaskIdSchema,
    })),

    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, taskId } = context.req.valid('param');

      const kanbanTasksRepository = createKanbanTasksRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { task } = await kanbanTasksRepository.getKanbanTaskById({ taskId, organizationId });

      if (!task) {
        throw createKanbanTaskNotFoundError();
      }

      await kanbanTasksRepository.deleteKanbanTask({ taskId });

      return context.json({});
    },
  );
}

function setupUpdateKanbanTaskStatusRoute({ app, db }: RouteDefinitionContext) {
  app.patch(
    '/api/organizations/:organizationId/kanban-tasks/:taskId/status',
    requireAuthentication({}),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      taskId: kanbanTaskIdSchema,
    })),

    validateJsonBody(z.object({
      status: kanbanTaskStatusSchema,
      displayOrder: z.number().int().min(0),
    })),

    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, taskId } = context.req.valid('param');
      const { status, displayOrder } = context.req.valid('json');

      const kanbanTasksRepository = createKanbanTasksRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { task: existingTask } = await kanbanTasksRepository.getKanbanTaskById({ taskId, organizationId });

      if (!existingTask) {
        throw createKanbanTaskNotFoundError();
      }

      const { task } = await kanbanTasksRepository.updateKanbanTaskStatus({ taskId, status, displayOrder });

      return context.json({ task });
    },
  );
}
