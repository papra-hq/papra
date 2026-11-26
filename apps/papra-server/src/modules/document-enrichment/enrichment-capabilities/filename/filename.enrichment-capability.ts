import * as v from 'valibot';
import type { Config } from '../../../config/config.types';
import type { DocumentsRepository } from '../../../documents/documents.repository';
import type { EventServices } from '../../../app/events/events.services';
import { defineDocumentEnrichmentCapabilityFactory } from '../enrichment-capabilities-definition';
import { DEFAULT_FILENAME_PROMPT, normalizeGeneratedFilename } from './filename.models';

export const buildFilenameEnrichmentCapability = defineDocumentEnrichmentCapabilityFactory(
  ({
    config,
    documentsRepository,
    eventServices,
  }: {
    config: Pick<Config, 'ai' | 'autoTagging'>;
    documentsRepository: Pick<DocumentsRepository, 'renameDocumentIfUnchanged'>;
    eventServices: Pick<EventServices, 'emitEvent'>;
  }) => ({
    name: 'filename',
    documentInfoRequirements: [],
    isAvailable: ({ organizationSettings }) =>
      config.ai.isEnabled &&
      config.autoTagging.isEnabled &&
      organizationSettings.ai.autoTagging.namingEnabled === true,
    buildSystemPromptFragments: ({ organizationSettings }) => ({
      fragment:
        organizationSettings.ai.autoTagging.filenamePrompt?.trim() || DEFAULT_FILENAME_PROMPT,
    }),
    getResponseSchema: () =>
      v.object({
        filename: v.string(),
      }),
    apply: async ({ document, documentId, organizationId, response }) => {
      const name = normalizeGeneratedFilename({
        filename: response.filename,
        originalName: document.originalName,
      });
      if (!name || name === document.name || !document.content.trim()) {
        return;
      }
      const { document: updatedDocument } = await documentsRepository.renameDocumentIfUnchanged({
        documentId,
        organizationId,
        name,
        expectedName: document.name,
        expectedContent: document.content,
      });
      if (!updatedDocument) {
        return;
      }
      // The standard update event drives storage-key sync, search, activity logs and webhooks.
      eventServices.emitEvent({
        eventName: 'document.updated',
        payload: { document: updatedDocument, changes: { name }, userId: undefined },
      });
    },
  }),
);
