import type { Config } from '../config/config.types';
import type { PlansRepository } from '../plans/plans.repository';
import { createInMemoryLoggerTransport } from '@crowlog/logger';
import { asc } from 'drizzle-orm';
import { pick } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createDocumentsRepository } from '../documents/documents.repository';
import { documentsTable } from '../documents/documents.table';
import { createDocumentStorageService } from '../documents/storage/documents.storage.services';
import { PLUS_PLAN_ID } from '../plans/plans.constants';
import { createPlansRepository } from '../plans/plans.repository';
import { createLogger } from '../shared/logger/logger';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { createTaggingRulesRepository } from '../tagging-rules/tagging-rules.repository';
import { createTagsRepository } from '../tags/tags.repository';
import { createDummyTrackingServices } from '../tracking/tracking.services';
import { createWebhookRepository } from '../webhooks/webhook.repository';
import { createIntakeEmailLimitReachedError } from './intake-emails.errors';
import { createIntakeEmailsRepository } from './intake-emails.repository';
import { intakeEmailsTable } from './intake-emails.tables';
import { checkIfOrganizationCanCreateNewIntakeEmail, ingestEmailForRecipient, processIntakeEmailIngestion } from './intake-emails.usecases';

describe('intake-emails usecases', () => {
  describe('ingestEmailForRecipient', () => {
    describe('when a email is forwarded to papra api, we look for the recipient in the intake emails repository and create a papra document for each attachment', () => {
      test(`when an intake email is is configured, enabled and match the recipient, and the sender is allowed, a document is created for each attachment`, async () => {
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org-1', name: 'Organization 1' }],
          intakeEmails: [{ id: 'ie-1', organizationId: 'org-1', allowedOrigins: ['foo@example.fr'], emailAddress: 'email-1@papra.email' }],
        });

        const intakeEmailsRepository = createIntakeEmailsRepository({ db });
        const documentsRepository = createDocumentsRepository({ db });
        const documentsStorageService = await createDocumentStorageService({ config: { documentsStorage: { driver: 'in-memory' } } as Config });
        const plansRepository = createPlansRepository({ config: { organizationPlans: { isFreePlanUnlimited: true } } as Config });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const trackingServices = createDummyTrackingServices();
        const taggingRulesRepository = createTaggingRulesRepository({ db });
        const tagsRepository = createTagsRepository({ db });
        const webhookRepository = createWebhookRepository({ db });

        await ingestEmailForRecipient({
          fromAddress: 'foo@example.fr',
          recipientAddress: 'email-1@papra.email',
          attachments: [
            new File(['content1'], 'file1.txt', { type: 'text/plain' }),
            new File(['content2'], 'file2.txt', { type: 'text/plain' }),
          ],
          intakeEmailsRepository,
          documentsRepository,
          documentsStorageService,
          plansRepository,
          subscriptionsRepository,
          trackingServices,
          taggingRulesRepository,
          tagsRepository,
          webhookRepository,
        });

        const documents = await db.select().from(documentsTable).orderBy(asc(documentsTable.name));

        expect(
          documents.map(doc => pick(doc, ['organizationId', 'name', 'mimeType', 'originalName', 'content'])),
        ).to.eql([
          { organizationId: 'org-1', name: 'file1.txt', mimeType: 'text/plain', originalName: 'file1.txt', content: 'content1' },
          { organizationId: 'org-1', name: 'file2.txt', mimeType: 'text/plain', originalName: 'file2.txt', content: 'content2' },
        ]);
      });

      test(`when the intake email is disabled, nothing happens, only a log is emitted`, async () => {
        const loggerTransport = createInMemoryLoggerTransport();
        const logger = createLogger({ transports: [loggerTransport], namespace: 'test' });

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org-1', name: 'Organization 1' }],
          intakeEmails: [{ id: 'ie-1', organizationId: 'org-1', isEnabled: false, emailAddress: 'email-1@papra.email' }],
        });

        const intakeEmailsRepository = createIntakeEmailsRepository({ db });
        const documentsRepository = createDocumentsRepository({ db });
        const documentsStorageService = await createDocumentStorageService({ config: { documentsStorage: { driver: 'in-memory' } } as Config });
        const plansRepository = createPlansRepository({ config: { organizationPlans: { isFreePlanUnlimited: true } } as Config });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const trackingServices = createDummyTrackingServices();
        const taggingRulesRepository = createTaggingRulesRepository({ db });
        const tagsRepository = createTagsRepository({ db });
        const webhookRepository = createWebhookRepository({ db });

        await ingestEmailForRecipient({
          fromAddress: 'foo@example.fr',
          recipientAddress: 'email-1@papra.email',
          attachments: [new File(['content'], 'file.txt', { type: 'text/plain' })],
          intakeEmailsRepository,
          documentsRepository,
          documentsStorageService,
          plansRepository,
          subscriptionsRepository,
          trackingServices,
          logger,
          taggingRulesRepository,
          tagsRepository,
          webhookRepository,
        });

        expect(loggerTransport.getLogs({ excludeTimestampMs: true })).to.eql([
          { level: 'info', message: 'Intake email is disabled', namespace: 'test', data: {} },
        ]);
        expect(await db.select().from(documentsTable)).to.eql([]);
      });

      test('when no intake email is found for the recipient, nothing happens, only a log is emitted', async () => {
        const loggerTransport = createInMemoryLoggerTransport();
        const logger = createLogger({ transports: [loggerTransport], namespace: 'test' });

        const { db } = await createInMemoryDatabase();

        const intakeEmailsRepository = createIntakeEmailsRepository({ db });
        const documentsRepository = createDocumentsRepository({ db });
        const documentsStorageService = await createDocumentStorageService({ config: { documentsStorage: { driver: 'in-memory' } } as Config });
        const plansRepository = createPlansRepository({ config: { organizationPlans: { isFreePlanUnlimited: true } } as Config });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const trackingServices = createDummyTrackingServices();
        const taggingRulesRepository = createTaggingRulesRepository({ db });
        const tagsRepository = createTagsRepository({ db });
        const webhookRepository = createWebhookRepository({ db });

        await ingestEmailForRecipient({
          fromAddress: 'foo@example.fr',
          recipientAddress: 'bar@example.fr',
          attachments: [new File(['content'], 'file.txt', { type: 'text/plain' })],
          intakeEmailsRepository,
          documentsRepository,
          documentsStorageService,
          plansRepository,
          subscriptionsRepository,
          trackingServices,
          taggingRulesRepository,
          tagsRepository,
          logger,
          webhookRepository,
        });

        expect(loggerTransport.getLogs({ excludeTimestampMs: true })).to.eql([
          { level: 'info', message: 'Intake email not found', namespace: 'test', data: { } },
        ]);
        expect(await db.select().from(documentsTable)).to.eql([]);
      });

      test(`in order to be processed, the emitter of the email must be allowed for the intake email
            it should be registered in the intake email allowed origins
            if not, an error is logged and no document is created`, async () => {
        const loggerTransport = createInMemoryLoggerTransport();
        const logger = createLogger({ transports: [loggerTransport], namespace: 'test' });

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org-1', name: 'Organization 1' }],
          intakeEmails: [{ id: 'ie-1', organizationId: 'org-1', allowedOrigins: ['foo@example.fr'], emailAddress: 'email-1@papra.email' }],
        });

        const intakeEmailsRepository = createIntakeEmailsRepository({ db });
        const documentsRepository = createDocumentsRepository({ db });
        const documentsStorageService = await createDocumentStorageService({ config: { documentsStorage: { driver: 'in-memory' } } as Config });
        const plansRepository = createPlansRepository({ config: { organizationPlans: { isFreePlanUnlimited: true } } as Config });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const trackingServices = createDummyTrackingServices();
        const taggingRulesRepository = createTaggingRulesRepository({ db });
        const tagsRepository = createTagsRepository({ db });
        const webhookRepository = createWebhookRepository({ db });

        await ingestEmailForRecipient({
          fromAddress: 'a-non-allowed-adress@example.fr',
          recipientAddress: 'email-1@papra.email',
          attachments: [new File(['content'], 'file.txt', { type: 'text/plain' })],
          intakeEmailsRepository,
          documentsRepository,
          documentsStorageService,
          plansRepository,
          subscriptionsRepository,
          trackingServices,
          taggingRulesRepository,
          tagsRepository,
          logger,
          webhookRepository,
        });

        expect(loggerTransport.getLogs({ excludeTimestampMs: true })).to.eql([
          {
            level: 'warn',
            message: 'Origin not allowed',
            namespace: 'test',
            data: {
              fromAddress: 'a-non-allowed-adress@example.fr',
            },
          },
        ]);
        expect(await db.select().from(documentsTable)).to.eql([]);
      });
    });
  });

  describe('processIntakeEmailIngestion', () => {
    test(`when an email is send to multiple intake emails from different organization, the attachments are processed for each of them`, async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org-1', name: 'Organization 1' },
          { id: 'org-2', name: 'Organization 2' },
        ],
        intakeEmails: [
          { id: 'ie-1', organizationId: 'org-1', allowedOrigins: ['foo@example.fr'], emailAddress: 'email-1@papra.email' },
          { id: 'ie-2', organizationId: 'org-2', allowedOrigins: ['foo@example.fr'], emailAddress: 'email-2@papra.email' },
        ],
      });

      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = await createDocumentStorageService({ config: { documentsStorage: { driver: 'in-memory' } } as Config });
      const plansRepository = createPlansRepository({ config: { organizationPlans: { isFreePlanUnlimited: true } } as Config });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const trackingServices = createDummyTrackingServices();
      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });

      await processIntakeEmailIngestion({
        fromAddress: 'foo@example.fr',
        recipientsAddresses: ['email-1@papra.email', 'email-2@papra.email'],
        attachments: [
          new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        ],
        intakeEmailsRepository,
        documentsRepository,
        documentsStorageService,
        plansRepository,
        subscriptionsRepository,
        trackingServices,
        taggingRulesRepository,
        tagsRepository,
        webhookRepository,
      });

      const documents = await db.select().from(documentsTable).orderBy(asc(documentsTable.organizationId));

      expect(
        documents.map(doc => pick(doc, ['organizationId', 'name', 'mimeType', 'originalName', 'content'])),
      ).to.eql([
        { organizationId: 'org-1', name: 'file1.txt', mimeType: 'text/plain', originalName: 'file1.txt', content: 'content1' },
        { organizationId: 'org-2', name: 'file1.txt', mimeType: 'text/plain', originalName: 'file1.txt', content: 'content1' },
      ]);
    });
  });

  describe('checkIfOrganizationCanCreateNewIntakeEmail', () => {
    test('the maximum amount of intake emails for an organization is defined by the organization plan, when the limit is reached, an error is thrown', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        intakeEmails: [{ organizationId: 'org-1', emailAddress: 'email-1@papra.email' }],
        organizationSubscriptions: [{
          id: 'os-1',
          organizationId: 'org-1',
          status: 'active',
          seatsCount: 1,
          currentPeriodStart: new Date('2025-03-18T00:00:00.000Z'),
          currentPeriodEnd: new Date('2025-04-18T00:00:00.000Z'),
          customerId: 'sc_123',
          planId: PLUS_PLAN_ID,
        }],
      });

      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const plansRepository = {
        getOrganizationPlanById: async () => ({
          organizationPlan: {
            id: PLUS_PLAN_ID,
            name: 'Plus',
            limits: {
              maxIntakeEmailsCount: 2,
              maxDocumentStorageBytes: 512,
              maxOrganizationsMembersCount: 100,
            },
          },
        }),
      } as unknown as PlansRepository;

      const subscriptionsRepository = createSubscriptionsRepository({ db });

      // no throw as the intake email count is less than the allowed limit
      await checkIfOrganizationCanCreateNewIntakeEmail({
        organizationId: 'org-1',
        plansRepository,
        subscriptionsRepository,
        intakeEmailsRepository,
      });

      await db.insert(intakeEmailsTable).values({
        organizationId: 'org-1',
        emailAddress: 'email-2@papra.email',
      });

      await expect(
        checkIfOrganizationCanCreateNewIntakeEmail({
          organizationId: 'org-1',
          plansRepository,
          subscriptionsRepository,
          intakeEmailsRepository,
        }),
      ).rejects.toThrow(createIntakeEmailLimitReachedError());
    });
  });
});
