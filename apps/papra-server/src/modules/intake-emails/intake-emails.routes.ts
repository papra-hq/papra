import type { RouteDefinitionContext } from '../app/server.types';
import { verifySignature } from '@owlrelay/webhook';
import { z } from 'zod';
import { createUnauthorizedError } from '../app/auth/auth.errors';
import { getUser } from '../app/auth/auth.models';
import { createDocumentsRepository } from '../documents/documents.repository';
import { createDocumentStorageService } from '../documents/storage/documents.storage.services';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { createPlansRepository } from '../plans/plans.repository';
import { createError } from '../shared/errors/errors';
import { getHeader } from '../shared/headers/headers.models';
import { createLogger } from '../shared/logger/logger';
import { validateFormData, validateJsonBody, validateParams } from '../shared/validation/validation';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { createTaggingRulesRepository } from '../tagging-rules/tagging-rules.repository';
import { createTagsRepository } from '../tags/tags.repository';
import { INTAKE_EMAILS_INGEST_ROUTE } from './intake-emails.constants';
import { createIntakeEmailsRepository } from './intake-emails.repository';
import { intakeEmailIdSchema, intakeEmailsIngestionMetaSchema, parseJson } from './intake-emails.schemas';
import { createIntakeEmailsServices } from './intake-emails.services';
import { createIntakeEmail, deleteIntakeEmail, processIntakeEmailIngestion } from './intake-emails.usecases';

const logger = createLogger({ namespace: 'intake-emails.routes' });

export function registerIntakeEmailsPrivateRoutes(context: RouteDefinitionContext) {
  setupGetOrganizationIntakeEmailsRoute(context);
  setupCreateIntakeEmailRoute(context);
  setupDeleteIntakeEmailRoute(context);
  setupUpdateIntakeEmailRoute(context);
}

export function registerIntakeEmailsPublicRoutes(context: RouteDefinitionContext) {
  setupIngestIntakeEmailRoute(context);
}

function setupGetOrganizationIntakeEmailsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/intake-emails',
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      const intakeEmailsRepository = createIntakeEmailsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { intakeEmails } = await intakeEmailsRepository.getOrganizationIntakeEmails({ organizationId });

      return context.json({ intakeEmails });
    },
  );
}

function setupCreateIntakeEmailRoute({ app, db, config }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/intake-emails',
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const intakeEmailsServices = createIntakeEmailsServices({ config });
      const plansRepository = createPlansRepository({ config });
      const subscriptionsRepository = createSubscriptionsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { intakeEmail } = await createIntakeEmail({
        organizationId,
        intakeEmailsRepository,
        intakeEmailsServices,
        plansRepository,
        subscriptionsRepository,
      });

      return context.json({ intakeEmail });
    },
  );
}

function setupDeleteIntakeEmailRoute({ app, db, config }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/intake-emails/:intakeEmailId',
    validateParams(z.object({
      organizationId: organizationIdSchema,
      intakeEmailId: intakeEmailIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, intakeEmailId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const intakeEmailsServices = createIntakeEmailsServices({ config });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await deleteIntakeEmail({ intakeEmailId, organizationId, intakeEmailsRepository, intakeEmailsServices });

      return context.body(null, 204);
    },
  );
}

function setupUpdateIntakeEmailRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/intake-emails/:intakeEmailId',
    validateParams(z.object({
      organizationId: organizationIdSchema,
      intakeEmailId: intakeEmailIdSchema,
    })),
    validateJsonBody(z.object({
      isEnabled: z.boolean().optional(),
      allowedOrigins: z.array(z.string().email().toLowerCase()).optional(),
    })),
    async (context) => {
      const { userId } = getUser({ context });
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

function setupIngestIntakeEmailRoute({ app, db, config, trackingServices }: RouteDefinitionContext) {
  app.post(
    INTAKE_EMAILS_INGEST_ROUTE,
    validateFormData(z.object({
      // email field is a JSON string
      'email': z.string().transform(parseJson).pipe(intakeEmailsIngestionMetaSchema),
      'attachments[]': z.array(z.instanceof(File)).min(1, 'At least one attachment is required').optional(),
    }), { allowAdditionalFields: true }),
    async (context) => {
      const { email, 'attachments[]': attachments = [] } = context.req.valid('form');

      if (!config.intakeEmails.isEnabled) {
        throw createError({
          message: 'Intake emails are disabled',
          code: 'intake_emails.disabled',
          statusCode: 403,
        });
      }

      const bodyBuffer = await context.req.arrayBuffer();
      const signature = getHeader({ context, name: 'X-Signature' });

      if (!signature) {
        throw createError({
          message: 'Signature header is required',
          code: 'intake_emails.signature_header_required',
          statusCode: 400,
        });
      }

      const isSignatureValid = await verifySignature({
        signature,
        bodyBuffer,
        secret: config.intakeEmails.webhookSecret,
      });

      if (!isSignatureValid) {
        logger.error({ signature }, 'Invalid webhook signature');

        throw createUnauthorizedError();
      }

      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = await createDocumentStorageService({ config });
      const plansRepository = createPlansRepository({ config });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });

      await processIntakeEmailIngestion({
        fromAddress: email.from.address,
        recipientsAddresses: email.to.map(({ address }) => address),
        attachments,
        intakeEmailsRepository,
        documentsRepository,
        documentsStorageService,
        plansRepository,
        subscriptionsRepository,
        trackingServices,
        taggingRulesRepository,
        tagsRepository,
      });

      return context.body(null, 202);
    },
  );
}
