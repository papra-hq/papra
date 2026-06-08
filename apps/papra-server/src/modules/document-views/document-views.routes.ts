import type { RouteDefinitionContext } from '../app/server.types';
import * as v from 'valibot';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { searchDocumentsQuerySchema } from '../documents/documents.schemas';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createDocumentViewNotFoundError } from './document-views.errors';
import { createDocumentViewsRepository } from './document-views.repository';
import {
  documentViewDescriptionSchema,
  documentViewIdSchema,
  documentViewNameSchema,
} from './document-views.schemas';

export function registerDocumentViewsRoutes(context: RouteDefinitionContext) {
  setupCreateDocumentViewRoute(context);
  setupGetOrganizationDocumentViewsRoute(context);
  setupUpdateDocumentViewRoute(context);
  setupDeleteDocumentViewRoute(context);
}

function setupCreateDocumentViewRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/document-views',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    validateJsonBody(
      v.strictObject({
        name: documentViewNameSchema,
        query: searchDocumentsQuerySchema,
        description: v.optional(documentViewDescriptionSchema),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { name, query, description } = context.req.valid('json');

      const documentViewsRepository = createDocumentViewsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { documentView } = await documentViewsRepository.createDocumentView({
        documentView: { organizationId, name, query, description },
      });

      return context.json({ documentView });
    },
  );
}

function setupGetOrganizationDocumentViewsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/document-views',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const documentViewsRepository = createDocumentViewsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { documentViews } = await documentViewsRepository.getOrganizationDocumentViews({
        organizationId,
      });

      return context.json({ documentViews });
    },
  );
}

function setupUpdateDocumentViewRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/document-views/:documentViewId',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
        documentViewId: documentViewIdSchema,
      }),
    ),
    validateJsonBody(
      v.strictObject({
        name: documentViewNameSchema,
        query: searchDocumentsQuerySchema,
        description: v.optional(documentViewDescriptionSchema),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, documentViewId } = context.req.valid('param');
      const { name, query, description } = context.req.valid('json');

      const documentViewsRepository = createDocumentViewsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { documentView: existingDocumentView } =
        await documentViewsRepository.getDocumentViewById({ documentViewId, organizationId });

      if (!existingDocumentView) {
        throw createDocumentViewNotFoundError();
      }

      const { documentView } = await documentViewsRepository.updateDocumentView({
        documentViewId,
        name,
        query,
        description,
      });

      return context.json({ documentView });
    },
  );
}

function setupDeleteDocumentViewRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/document-views/:documentViewId',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
        documentViewId: documentViewIdSchema,
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, documentViewId } = context.req.valid('param');

      const documentViewsRepository = createDocumentViewsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { documentView: existingDocumentView } =
        await documentViewsRepository.getDocumentViewById({ documentViewId, organizationId });

      if (!existingDocumentView) {
        throw createDocumentViewNotFoundError();
      }

      await documentViewsRepository.deleteDocumentView({ documentViewId });

      return context.body(null, 204);
    },
  );
}
