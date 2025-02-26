import type { ServerInstance } from '../app/server.types';
import { z } from 'zod';
import { createUnauthorizedError } from '../app/auth/auth.errors';
import { getUser } from '../app/auth/auth.models';
import { getDb } from '../app/database/database.models';
import { getConfig } from '../config/config.models';
import { createDocumentsRepository } from '../documents/documents.repository';
import { createDocumentStorageService } from '../documents/storage/documents.storage.services';
import { organizationIdRegex } from '../organizations/organizations.constants';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { createError } from '../shared/errors/errors';
import { getAuthorizationHeader } from '../shared/headers/headers.models';
import { createLogger } from '../shared/logger/logger';
import { validateFormData, validateJsonBody, validateParams } from '../shared/validation/validation';
import { getIsIntakeEmailWebhookSecretValid } from './intake-emails.models';
import { createIntakeEmailsRepository } from './intake-emails.repository';
import { intakeEmailsIngestionMetaSchema, parseJson } from './intake-emails.schemas';
import { createIntakeEmailsServices } from './intake-emails.services';
import { createIntakeEmail, processIntakeEmailIngestion } from './intake-emails.usecases';

const logger = createLogger({ namespace: 'intake-emails.routes' });

export function registerIntakeEmailsPrivateRoutes({ app }: { app: ServerInstance }) {
  setupGetOrganizationIntakeEmailsRoute({ app });
  setupCreateIntakeEmailRoute({ app });
  setupDeleteIntakeEmailRoute({ app });
  setupUpdateIntakeEmailRoute({ app });
}

export function registerIntakeEmailsPublicRoutes({ app }: { app: ServerInstance }) {
  setupIngestIntakeEmailRoute({ app });
}

export function setupGetOrganizationIntakeEmailsRoute({ app }: { app: ServerInstance }) {
  app.get(
    '/api/organizations/:organizationId/intake-emails',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { db } = getDb({ context });

      const organizationsRepository = createOrganizationsRepository({ db });
      const intakeEmailsRepository = createIntakeEmailsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { intakeEmails } = await intakeEmailsRepository.getOrganizationIntakeEmails({ organizationId });

      return context.json({ intakeEmails });
    },
  );
}

export function setupCreateIntakeEmailRoute({ app }: { app: ServerInstance }) {
  app.post(
    '/api/organizations/:organizationId/intake-emails',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { db } = getDb({ context });
      const { config } = getConfig({ context });

      const organizationsRepository = createOrganizationsRepository({ db });
      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const intakeEmailsServices = createIntakeEmailsServices({ config });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { intakeEmail } = await createIntakeEmail({ organizationId, intakeEmailsRepository, intakeEmailsServices });

      return context.json({ intakeEmail });
    },
  );
}

export function setupDeleteIntakeEmailRoute({ app }: { app: ServerInstance }) {
  app.delete(
    '/api/organizations/:organizationId/intake-emails/:intakeEmailId',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
      intakeEmailId: z.string(),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, intakeEmailId } = context.req.valid('param');
      const { db } = getDb({ context });

      const organizationsRepository = createOrganizationsRepository({ db });
      const intakeEmailsRepository = createIntakeEmailsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await intakeEmailsRepository.deleteIntakeEmail({ intakeEmailId, organizationId });

      return context.body(null, 204);
    },
  );
}

export function setupUpdateIntakeEmailRoute({ app }: { app: ServerInstance }) {
  app.put(
    '/api/organizations/:organizationId/intake-emails/:intakeEmailId',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
      intakeEmailId: z.string(),
    })),
    validateJsonBody(z.object({
      isEnabled: z.boolean().optional(),
      allowedOrigins: z.array(z.string().email().toLowerCase()).optional(),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { db } = getDb({ context });
      const { organizationId, intakeEmailId } = context.req.valid('param');
      const { isEnabled, allowedOrigins } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      const intakeEmailsRepository = createIntakeEmailsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { intakeEmail } = await intakeEmailsRepository.updateIntakeEmail({
        intakeEmailId,
        organizationId,
        isEnabled,
        allowedOrigins,
      });

      return context.json({ intakeEmail });
    },
  );
}

export function setupIngestIntakeEmailRoute({ app }: { app: ServerInstance }) {
  app.post(
    '/api/intake-emails/ingest',
    validateFormData(z.object({
      // meta is a JSON string, but it can also be parsed as an object in case of multipart/form-data json section
      'meta': z.string().transform(parseJson).pipe(intakeEmailsIngestionMetaSchema),
      'attachments[]': z.array(z.instanceof(File)).min(1, 'At least one attachment is required').optional(),
    }), { allowAdditionalFields: true }),
    async (context) => {
      const { db } = getDb({ context });
      const { config } = getConfig({ context });
      const { meta, 'attachments[]': attachments = [] } = context.req.valid('form');
      const { authorizationHeader } = getAuthorizationHeader({ context });

      if (!config.intakeEmails.isEnabled) {
        throw createError({
          message: 'Intake emails are disabled',
          code: 'intake_emails.disabled',
          statusCode: 403,
        });
      }

      const isIntakeEmailWebhookSecretValid = getIsIntakeEmailWebhookSecretValid({
        authorizationHeader,
        secret: config.intakeEmails.webhookSecret,
      });

      if (!isIntakeEmailWebhookSecretValid) {
        logger.error('Invalid webhook secret');

        throw createUnauthorizedError();
      }

      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = await createDocumentStorageService({ config });

      await processIntakeEmailIngestion({
        fromAddress: meta.from.address,
        recipientsAddresses: meta.to.map(({ address }) => address),
        attachments,
        intakeEmailsRepository,
        documentsRepository,
        documentsStorageService,
      });

      return context.body(null, 202);
    },
  );
}
