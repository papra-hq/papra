import type { RouteDefinitionContext } from '../app/server.types';
import { z } from 'zod';
import { API_KEY_PERMISSIONS } from '../api-keys/api-keys.constants';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import { createDocumentsRepository } from '../documents/documents.repository';
import { documentIdSchema } from '../documents/documents.schemas.legacy';
import { organizationIdSchema } from '../organizations/organization.schemas.legacy';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { legacyValidateJsonBody, legacyValidateParams } from '../shared/validation/validation.legacy';
import { aggregateDocumentCustomPropertyValues } from './custom-properties.models';
import { createCustomPropertiesRepository } from './custom-properties.repository';
import { customPropertyDefinitionIdSchema } from './custom-properties.schemas.legacy';
import { createPropertyDefinition, deleteDocumentCustomPropertyValue, deletePropertyDefinition, ensurePropertyDefinitionExists, setDocumentCustomPropertyValue, updatePropertyDefinition } from './custom-properties.usecases';
import { createPropertyDefinitionBodySchema } from './definitions/custom-property-definition.registry';
import { createCustomPropertiesOptionsRepository } from './options/custom-properties-options.repository';

export function registerCustomPropertiesRoutes(context: RouteDefinitionContext) {
  setupCreatePropertyDefinitionRoute(context);
  setupGetOrganizationPropertyDefinitionsRoute(context);
  setupGetPropertyDefinitionRoute(context);
  setupUpdatePropertyDefinitionRoute(context);
  setupDeletePropertyDefinitionRoute(context);

  setupSetDocumentCustomPropertyValueRoute(context);
  setupDeleteDocumentCustomPropertyValueRoute(context);
  setupGetDocumentCustomPropertyValuesRoute(context);
}

function setupCreatePropertyDefinitionRoute({ app, db, config }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/custom-properties',
    requireAuthentication(),
    legacyValidateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    legacyValidateJsonBody(createPropertyDefinitionBodySchema),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const definition = context.req.valid('json');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { propertyDefinition } = await createPropertyDefinition({
        organizationId,
        definition,
        config,
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });

      return context.json({ propertyDefinition });
    },
  );
}

function setupGetOrganizationPropertyDefinitionsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/custom-properties',
    requireAuthentication(),
    legacyValidateParams(z.object({
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
    legacyValidateParams(z.object({
      organizationId: organizationIdSchema,
      propertyDefinitionId: customPropertyDefinitionIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, propertyDefinitionId } = context.req.valid('param');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { definition } = await ensurePropertyDefinitionExists({
        propertyDefinitionId,
        organizationId,
        customPropertiesRepository,
      });

      return context.json({ definition });
    },
  );
}

function setupUpdatePropertyDefinitionRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/custom-properties/:propertyDefinitionId',
    requireAuthentication(),
    legacyValidateParams(z.object({
      organizationId: organizationIdSchema,
      propertyDefinitionId: customPropertyDefinitionIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, propertyDefinitionId } = context.req.valid('param');
      const rawBody: unknown = await context.req.json();

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { propertyDefinition } = await updatePropertyDefinition({
        propertyDefinitionId,
        organizationId,
        rawDefinition: rawBody,
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });

      return context.json({ propertyDefinition });
    },
  );
}

function setupDeletePropertyDefinitionRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/custom-properties/:propertyDefinitionId',
    requireAuthentication(),
    legacyValidateParams(z.object({
      organizationId: organizationIdSchema,
      propertyDefinitionId: customPropertyDefinitionIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, propertyDefinitionId } = context.req.valid('param');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await deletePropertyDefinition({
        propertyDefinitionId,
        organizationId,
        customPropertiesRepository,
      });

      return context.json({});
    },
  );
}

function setupSetDocumentCustomPropertyValueRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/documents/:documentId/custom-properties/:propertyDefinitionId',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.DOCUMENTS.UPDATE] }),
    legacyValidateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
      propertyDefinitionId: customPropertyDefinitionIdSchema,
    })),
    legacyValidateJsonBody(z.object({
      value: z.unknown(), // validation happens per-type in the use case
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, documentId, propertyDefinitionId } = context.req.valid('param');
      const { value } = context.req.valid('json');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { document } = await documentsRepository.getDocumentById({ documentId, organizationId });

      if (!document) {
        throw createDocumentNotFoundError();
      }

      await setDocumentCustomPropertyValue({
        documentId,
        propertyDefinitionId,
        organizationId,
        value,
        customPropertiesRepository,
        customPropertiesOptionsRepository,
        organizationsRepository,
        documentsRepository,
      });

      return context.body(null, 204);
    },
  );
}

function setupDeleteDocumentCustomPropertyValueRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/documents/:documentId/custom-properties/:propertyDefinitionId',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.DOCUMENTS.UPDATE] }),
    legacyValidateParams(z.object({
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

      const { document } = await documentsRepository.getDocumentById({ documentId, organizationId });

      if (!document) {
        throw createDocumentNotFoundError();
      }

      await deleteDocumentCustomPropertyValue({
        documentId,
        propertyDefinitionId,
        organizationId,
        customPropertiesRepository,
      });

      return context.body(null, 204);
    },
  );
}

function setupGetDocumentCustomPropertyValuesRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/documents/:documentId/custom-properties',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.DOCUMENTS.READ] }),
    legacyValidateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, documentId } = context.req.valid('param');

      const customPropertiesRepository = createCustomPropertiesRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { document } = await documentsRepository.getDocumentById({ documentId, organizationId });

      if (!document) {
        throw createDocumentNotFoundError();
      }

      const { values } = await customPropertiesRepository.getDocumentCustomPropertyValues({ documentId });

      const customProperties = aggregateDocumentCustomPropertyValues({ rawValues: values });

      return context.json({ customProperties });
    },
  );
}
