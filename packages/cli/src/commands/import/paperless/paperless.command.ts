import * as prompts from '@clack/prompts';
import { createClient } from '@papra/api-sdk';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import { fileExists } from '../../../fs';
import { getOrganizationId } from '../../../organizations/organizations.usecases';
import { exit } from '../../../prompts/utils';
import { getConfig } from '../../config/config.services';
import { organizationIdArgument } from '../../documents/documents.arguments';
import { analyzeAndHandleTags, analyzeExport, displayImportSummary, importDocuments, selectDocumentStrategy } from './paperless.wizard';

export const paperlessCommand = defineCommand({
  meta: {
    name: 'paperless',
    description: 'Import documents from a Paperless NGX export',
  },
  args: {
    organizationId: organizationIdArgument,
    archivePath: {
      type: 'positional',
      description: 'The path to the Paperless NGX export archive',
      valueHint: './export.zip',
      required: true,
    },
  },
  run: async ({ args }) => {
    const { apiKey, apiUrl } = await getConfig();

    if (!apiKey) {
      exit(`API key not found. Please create an api key in your Papra account and set it using the ${pc.bold('papra config init')} command.`);
    }

    if (!fileExists(args.archivePath)) {
      exit(`Archive file not found: ${args.archivePath}`);
    }

    const apiClient = createClient({
      apiKey,
      apiBaseUrl: apiUrl,
    });

    prompts.intro('Paperless NGX Import');

    const { manifest, analysis } = await analyzeExport({ archivePath: args.archivePath });

    if (analysis.documentCount === 0) {
      prompts.outro('No documents found in export');
      return;
    }

    const { organizationId } = await getOrganizationId({
      apiClient,
      argOrganizationId: args.organizationId,
    });

    const { tagMapping } = await analyzeAndHandleTags({
      manifest,
      organizationId,
      apiClient,
    });

    const documentStrategy = await selectDocumentStrategy();

    if (documentStrategy === 'skip') {
      prompts.outro('Import cancelled');
      return;
    }

    const stats = await importDocuments({
      manifest,
      archivePath: args.archivePath,
      organizationId,
      apiClient,
      tagMapping,
      applyTags: documentStrategy === 'import-with-tags',
    });

    displayImportSummary({ stats });

    prompts.outro('Import finished');
  },
});
