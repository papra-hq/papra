import { defineApiRoute } from '../api/api.routes';
import type { ApiDependencies } from '../app/server.types';
import { createDocumentsRepository } from '../documents/documents.repository';
import { createOrganizationSettingsRepository } from '../organizations/organization-settings/organization-settings.repository';
import { createResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { enrichDocumentContract } from './document-enrichment.api.contracts';
import { buildScheduleDocumentEnrichment } from './document-enrichment.usecases';

export function buildDocumentEnrichmentApiRoutes(deps: ApiDependencies) {
  return [setupEnrichDocumentRoute(deps)];
}

export function setupEnrichDocumentRoute({
  resolveAuthenticationContext,
  db,
  config,
  taskServices,
}: ApiDependencies) {
  const organizationsRepository = createOrganizationsRepository({ db });
  const scheduleDocumentEnrichment = buildScheduleDocumentEnrichment({
    config,
    taskServices,
    documentsRepository: createDocumentsRepository({ db }),
    resolveOrganizationSettings: createResolveOrganizationSettingsUsecase({
      config,
      organizationSettingsRepository: createOrganizationSettingsRepository({ db }),
    }),
  });

  return defineApiRoute({
    contract: enrichDocumentContract,
    resolveContext: resolveAuthenticationContext({ apiKeyPermissions: ['documents:update'] }),
    handler: async ({
      context: { userId },
      params: { organizationId, documentId },
      body: { capabilities },
    }) => {
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { taskId } = await scheduleDocumentEnrichment({
        organizationId,
        documentId,
        capabilities,
      });

      return {
        status: 202,
        contentType: 'application/json',
        body: { taskId },
      };
    },
  });
}
