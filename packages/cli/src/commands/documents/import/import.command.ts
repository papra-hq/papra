import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import process from 'node:process';
import * as prompts from '@clack/prompts';
import { safely } from '@corentinth/chisels';
import { createClient } from '@papra/api-sdk';
import { defineCommand } from 'citty';
import mime from 'mime-types';
import { reportClientError } from '../../../client.models';
import { getOrganizationId } from '../../../organizations/organizations.usecases';
import { getConfig } from '../../config/config.services';
import { organizationIdArgument } from '../documents.arguments';

export const importCommand = defineCommand({
  meta: {
    name: 'import',
    description: 'Import a document to Papra',
  },
  args: {
    path: {
      type: 'positional',
      description: 'The path to the document to import',
      valueHint: './document.pdf',
    },
    organizationId: organizationIdArgument,
  },
  run: async ({ args }) => {
    const { apiKey, apiUrl } = await getConfig();

    if (!apiKey) {
      prompts.cancel('No API key provided');

      process.exit(1);
    }

    const apiClient = createClient({
      apiKey,
      apiBaseUrl: apiUrl,
    });

    const { organizationId } = await getOrganizationId({ apiClient, argOrganizationId: args.organizationId });

    await prompts.tasks([
      {
        title: 'Importing document',
        task: async () => {
          const fileBuffer = await readFile(args.path);
          const fileName = basename(args.path);
          const mimeType = mime.lookup(fileName) || 'application/octet-stream';

          const file = new File([fileBuffer as BlobPart], fileName, { type: mimeType });

          const [, error] = await safely(apiClient.uploadDocument({
            organizationId,
            file,
          }));

          if (error) {
            reportClientError(error);

            process.exit(1);
          }

          prompts.log.info('Document imported successfully');
        },
      },
    ]);
  },
});
