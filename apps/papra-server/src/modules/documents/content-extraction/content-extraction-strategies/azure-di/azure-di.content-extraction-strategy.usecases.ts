import { ofetch } from 'ofetch';
import { IN_MS } from '../../../../shared/units';
import * as v from 'valibot';
import { buildUrl } from '@corentinth/chisels';
import { sleep } from '@papra/std';
import type { Logger } from '../../../../shared/logger/logger';
import { createLogger } from '../../../../shared/logger/logger';

const API_VERSION = '2024-11-30';

export const jobResultResponseSchema = v.variant('status', [
  v.object({
    status: v.picklist(['notStarted', 'running', 'failed']),
  }),
  v.object({
    status: v.literal('succeeded'),
    analyzeResult: v.object({
      content: v.string(),
    }),
  }),
]);

export async function extractTextWithAzureDi({
  file,
  endpoint,
  apiKey,
  pollingAttempts,
  pollingDelayMs,
  logger = createLogger({ namespace: 'azure-di.content-extraction-strategy.usecases' }),
}: {
  file: File;
  endpoint: string;
  apiKey: string;
  pollingAttempts: number;
  pollingDelayMs: number;
  logger?: Logger;
}) {
  const url = buildUrl({
    baseUrl: endpoint,
    path: '/documentintelligence/documentModels/prebuilt-layout:analyze',
    queryParams: {
      'api-version': API_VERSION,
      'outputContentFormat': 'markdown',
    },
  });

  const response = await ofetch.raw<unknown>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Ocp-Apim-Subscription-Key': apiKey,
    },
    timeout: 10 * IN_MS.SECOND,
    body: file,
  });

  const operationLocation = response.headers.get('operation-location');

  if (!operationLocation) {
    throw new Error('Azure DI job creation failed: operation-location header missing');
  }

  logger.debug('Azure DI job created');

  const { text, attempts } = await pollJobResult({
    operationLocation,
    apiKey,
    pollingAttempts,
    pollingDelayMs,
    logger,
  });

  return { text, attempts };
}

export async function pollJobResult({
  operationLocation,
  apiKey,
  pollingAttempts,
  pollingDelayMs,
  logger,
}: {
  operationLocation: string;
  apiKey: string;
  pollingAttempts: number;
  pollingDelayMs: number;
  logger: Logger;
}) {
  for (let attempt = 0; attempt < pollingAttempts; attempt++) {
    const response = await ofetch<unknown>(operationLocation, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      },
      timeout: 10 * IN_MS.SECOND,
    });

    const result = v.parse(jobResultResponseSchema, response);

    logger.debug(
      {
        attempt,
        status: result.status,
      },
      'Azure DI job result polled',
    );

    if (result.status === 'succeeded') {
      return {
        text: result.analyzeResult.content,
        attempts: attempt + 1,
      };
    } else if (result.status === 'failed') {
      throw new Error('Azure DI job failed');
    }

    if (attempt < pollingAttempts - 1) {
      await sleep(pollingDelayMs);
    }
  }

  throw new Error('Azure DI job did not complete in time');
}
