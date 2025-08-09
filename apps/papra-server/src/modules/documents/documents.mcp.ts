import type { RouteDefinitionContext } from '../app/server.types';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createDocumentsRepository } from './documents.repository';
import { createDocumentCreationUsecase, createDocumentGetterUsecase } from './documents.usecases';

export function registerDocumentMcp(context: RouteDefinitionContext) {
  setupDocumentResource(context);
  setupDocumentsResource(context);
  setupCreateDocumentTool(context);
}

export function setupDocumentResource({ mcp, db }: RouteDefinitionContext) {
  mcp.registerResource(
    'document',
    new ResourceTemplate('document://{organizationId}/{documentId}', { list: undefined }),
    {
      title: 'Document',
      description: 'Document information',
    },
    async (uri, { organizationId, documentId }) => {
      const getDocument = await createDocumentGetterUsecase({
        db,
      });

      const { document } = await getDocument({ documentId: documentId as string, organizationId: organizationId as string });

      return ({
        contents: [{
          uri: uri.href,
          text: JSON.stringify(document),
        }],
      });
    },
  );
}

export function setupDocumentsResource({ mcp, db }: RouteDefinitionContext) {
  mcp.registerResource('documents', new ResourceTemplate('documents://{organizationId}/{pageIndex}/{pageSize}', { list: undefined }), {
    title: 'Documents',
    description: 'List of documents',
  }, async (_uri, { organizationId, pageIndex, pageSize }) => {
    const pageIndexNumber = Number(pageIndex);
    const pageSizeNumber = Number(pageSize);

    const documentsRepository = createDocumentsRepository({ db });

    const { documents } = await documentsRepository.getOrganizationDocuments({ organizationId: organizationId as string, pageIndex: pageIndexNumber, pageSize: pageSizeNumber });

    return ({
      contents: documents.map(({ id, name, organizationId }) => ({
        uri: `document://${organizationId}/${id}`,
        text: name,
      })),
    });
  });
}

export function setupCreateDocumentTool({ mcp, db, config, taskServices, trackingServices }: RouteDefinitionContext) {
  mcp.registerTool('create-document', {
    title: 'Create document',
    description: 'Create a new document',
  }, async () => {
    const createDocument = await createDocumentCreationUsecase({
      db,
      config,
      taskServices,
      trackingServices,
    });

    // TODO: fix
    const { document } = await createDocument({
      file: new File(['content'], 'file.txt', { type: 'text/plain' }),
      userId: 'user-1',
      organizationId: 'organization-1',
    });

    return {
      content: [{
        name: document.name,
        uri: `document://${document.organizationId}/${document.id}`,
        type: 'resource_link',
      }],
    };
  });
}
