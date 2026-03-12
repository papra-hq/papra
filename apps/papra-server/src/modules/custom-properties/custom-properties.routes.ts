import type { RouteDefinitionContext } from '../app/server.types';
import { z } from 'zod';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import { createDocumentsRepository } from '../documents/documents.repository';
import { documentIdSchema } from '../documents/documents.schemas';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createCustomPropertiesRepository } from './custom-properties.repository';
import { createCustomPropertyDefinitionSchema, customPropertyDefinitionIdSchema, setPropertyValueSchema, updateCustomPropertyDefinitionSchema } from './custom-properties.schemas';
import { createPropertyDefinition, getPropertyDefinitionOrThrow, setDocumentPropertyValue, updatePropertyDefinition } from './custom-properties.usecases';

export function registerCustomPropertiesRoutes(context: RouteDefinitionContext) {
  setupCreatePropertyDefinitionRoute(context);
  setupGetOrganizationPropertyDefinitionsRoute(context);
  setupGetPropertyDefinitionRoute(context);
  setupUpdatePropertyDefinitionRoute(context);
  setupDeletePropertyDefinitionRoute(context);
  setupSetDocumentPropertyValueRoute(context);
  setupDeleteDocumentPropertyValueRoute(context);
}

function setupCreatePropertyDefinitionRoute({ app, db, config }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/custom-properties',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    validateJsonBody(createCustomPropertyDefinitionSchema),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { name, description, type, color, isRequired, displayOrder, options } = context.req.valid('json');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { propertyDefinition } = await createPropertyDefinition({
        organizationId,
        name,
        description,
        type,
        color,
        isRequired,
        displayOrder,
        options,
        config,
        customPropertiesRepository,
      });

      return context.json({ propertyDefinition }, 201);
    },
  );
}

function setupGetOrganizationPropertyDefinitionsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/custom-properties',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { propertyDefinitions } = await customPropertiesRepository.getOrganizationPropertyDefinitions({ organizationId });

      return context.json({ propertyDefinitions });
    },
  );
}

function setupGetPropertyDefinitionRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/custom-properties/:propertyDefinitionId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      propertyDefinitionId: customPropertyDefinitionIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, propertyDefinitionId } = context.req.valid('param');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { propertyDefinition } = await getPropertyDefinitionOrThrow({
        propertyDefinitionId,
        organizationId,
        customPropertiesRepository,
      });

      return context.json({ propertyDefinition });
    },
  );
}

function setupUpdatePropertyDefinitionRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/custom-properties/:propertyDefinitionId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      propertyDefinitionId: customPropertyDefinitionIdSchema,
    })),
    validateJsonBody(updateCustomPropertyDefinitionSchema),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, propertyDefinitionId } = context.req.valid('param');
      const { name, description, color, isRequired, displayOrder, options } = context.req.valid('json');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { propertyDefinition } = await updatePropertyDefinition({
        propertyDefinitionId,
        organizationId,
        name,
        description,
        color,
        isRequired,
        displayOrder,
        options,
        customPropertiesRepository,
      });

      return context.json({ propertyDefinition });
    },
  );
}

function setupDeletePropertyDefinitionRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/custom-properties/:propertyDefinitionId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      propertyDefinitionId: customPropertyDefinitionIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, propertyDefinitionId } = context.req.valid('param');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await getPropertyDefinitionOrThrow({
        propertyDefinitionId,
        organizationId,
        customPropertiesRepository,
      });

      await customPropertiesRepository.deletePropertyDefinition({ propertyDefinitionId });

      return context.body(null, 204);
    },
  );
}

function setupSetDocumentPropertyValueRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/documents/:documentId/custom-properties/:propertyDefinitionId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
      propertyDefinitionId: customPropertyDefinitionIdSchema,
    })),
    validateJsonBody(setPropertyValueSchema),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, documentId, propertyDefinitionId } = context.req.valid('param');
      const { value } = context.req.valid('json');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { document } = await documentsRepository.getDocumentById({ organizationId, documentId });

      if (!document) {
        throw createDocumentNotFoundError();
      }

      await setDocumentPropertyValue({
        documentId,
        propertyDefinitionId,
        organizationId,
        value,
        customPropertiesRepository,
      });

      return context.body(null, 204);
    },
  );
}

function setupDeleteDocumentPropertyValueRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/documents/:documentId/custom-properties/:propertyDefinitionId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
      propertyDefinitionId: customPropertyDefinitionIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, documentId, propertyDefinitionId } = context.req.valid('param');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { document } = await documentsRepository.getDocumentById({ organizationId, documentId });

      if (!document) {
        throw createDocumentNotFoundError();
      }

      await customPropertiesRepository.deleteDocumentPropertyValue({
        documentId,
        propertyDefinitionId,
      });

      return context.body(null, 204);
    },
  );
}
