import { describe, expect, test, vi } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestEventServices } from '../app/events/events.test-utils';
import type { AiServices } from '../ai/ai.services';
import { overrideConfig } from '../config/config.test-utils';
import { createDocumentsRepository } from '../documents/documents.repository';
import type { ResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { autoNameDocument } from './auto-naming.usecases';
import type { AutoNamingResponse } from './auto-naming.models';

function createTestResolveOrganizationSettings(
  autoNaming: Partial<{ isEnabled: boolean; modelId: string }> = {},
): ResolveOrganizationSettingsUsecase {
  return async () => ({
    organizationSettings: {
      ai: {
        autoTagging: {
          isEnabled: true,
          canCreateNewTags: false,
          maxTags: 5,
          modelId: 'openai://gpt-4o-mini',
        },
        autoNaming: {
          isEnabled: true,
          modelId: 'openai://gpt-4o-mini',
          ...autoNaming,
        },
      },
    },
  });
}

function createTestAiServices({ response }: { response: AutoNamingResponse }) {
  const generateStructuredData = vi.fn().mockResolvedValue(response);

  return {
    aiServices: { generateStructuredData } as AiServices,
    generateStructuredData,
  };
}

async function createTestDeps(seedOptions: Parameters<typeof createInMemoryDatabase>[0]) {
  const { db } = await createInMemoryDatabase(seedOptions);

  return {
    db,
    documentsRepository: createDocumentsRepository({ db }),
    eventServices: createTestEventServices(),
    config: overrideConfig({ autoNaming: { maxTitleLength: 120 } }),
  };
}

const baseDocument = {
  id: 'doc_1',
  organizationId: 'org_1',
  name: 'scan.pdf',
  originalName: 'scan.pdf',
  originalStorageKey: 'doc_1',
  originalSha256Hash: 'doc_1',
  mimeType: 'text/plain',
  content: 'Invoice from Acme Corp for March 2026',
};

describe('auto-naming usecases', () => {
  describe('autoNameDocument', () => {
    test('when auto-naming is disabled in the organization settings, the document is not renamed and the AI is not called', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { title: 'Invoice - Acme Corp - March 2026' },
      });

      await autoNameDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings({ isEnabled: false }),
      });

      const { document } = await deps.documentsRepository.getDocumentById({
        documentId: 'doc_1',
        organizationId: 'org_1',
      });

      expect(generateStructuredData).not.toHaveBeenCalled();
      expect(document?.name).to.eql('scan.pdf');
    });

    test('when the AI generates a title, the document is renamed and a document.updated event is emitted', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [baseDocument],
      });
      const { aiServices, generateStructuredData } = createTestAiServices({
        response: { title: 'Invoice - Acme Corp - March 2026' },
      });

      await autoNameDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings(),
      });

      const { document } = await deps.documentsRepository.getDocumentById({
        documentId: 'doc_1',
        organizationId: 'org_1',
      });
      const emittedEvents = deps.eventServices.getEmittedEvents();

      expect(generateStructuredData).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: 'openai://gpt-4o-mini',
          organizationId: 'org_1',
          source: 'auto-naming',
          userPrompt: [
            'Current document name: scan.pdf',
            'Document content:',
            'Invoice from Acme Corp for March 2026',
          ].join('\n'),
        }),
      );
      expect(document?.name).to.eql('Invoice - Acme Corp - March 2026');
      expect(emittedEvents).toMatchObject([
        {
          eventName: 'document.updated',
          payload: {
            userId: undefined,
            changes: { name: 'Invoice - Acme Corp - March 2026' },
            document: { id: 'doc_1', name: 'Invoice - Acme Corp - March 2026' },
          },
        },
      ]);
    });

    test('when the generated title matches the current name, the document is not updated', async () => {
      const { logger } = createTestLogger();
      const deps = await createTestDeps({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [{ ...baseDocument, name: 'Invoice - Acme Corp' }],
      });
      const { aiServices } = createTestAiServices({
        response: { title: 'Invoice - Acme Corp' },
      });

      await autoNameDocument({
        ...deps,
        aiServices,
        logger,
        documentId: 'doc_1',
        organizationId: 'org_1',
        resolveOrganizationSettings: createTestResolveOrganizationSettings(),
      });

      expect(deps.eventServices.getEmittedEvents()).to.eql([]);
    });
  });
});
