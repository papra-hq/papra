import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import process from 'node:process';
import * as prompts from '@clack/prompts';
import { safely } from '@corentinth/chisels';
import { createClient } from '@papra/api-sdk';
import { defineCommand } from 'citty';
import mime from 'mime-types';
import { reportClientError } from '../../../client.models';
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
    const { apiKey, apiUrl, defaultOrganizationId } = await getConfig();

    const orgId = args.organizationId ?? defaultOrganizationId;

    if (!orgId) {
      prompts.cancel('No organization ID provided');

      process.exit(1);
    }

    if (!apiKey) {
      prompts.cancel('No API key provided');

      process.exit(1);
    }

    const client = createClient({
      apiKey,
      apiBaseUrl: apiUrl,
    });

    await prompts.tasks([
      {
        title: 'Importing document',
        task: async () => {
          const fileBuffer = await readFile(args.path);
          const fileName = basename(args.path);
          const mimeType = mime.lookup(fileName) || 'application/octet-stream';

          const file = new File([fileBuffer], fileName, { type: mimeType });

          const [, error] = await safely(client.uploadDocument({
            organizationId: orgId,
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
