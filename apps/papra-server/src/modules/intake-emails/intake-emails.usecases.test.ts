import type { PlansRepository } from '../plans/plans.repository';
import type { IntakeEmailsServices } from './drivers/intake-emails.drivers.models';
import { createInMemoryLoggerTransport, createLogger } from '@crowlog/logger';
import { asc, eq } from 'drizzle-orm';
import { describe, expect, test, vi } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestEventServices } from '../app/events/events.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { documentsTable } from '../documents/documents.table';
import { createDocumentCreationUsecase } from '../documents/documents.usecases';
import { createInMemoryDocumentStorageServices } from '../documents/storage/documents.storage.services.test-utils';
import { PLUS_PLAN_ID } from '../plans/plans.constants';
import { pick } from '../shared/objects';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { createInMemoryTaskServices } from '../tasks/tasks.test-utils';
import {
  createIntakeEmailLimitReachedError,
  createIntakeEmailUsernameDeniedError,
  createIntakeEmailUsernameNotAcceptedByStrategyError,
  createIntakeEmailUsernameRequiredByStrategyError,
  createIntakeEmailUsernameUpdateNotSupportedError,
} from './intake-emails.errors';
import { createIntakeEmailsRepository } from './intake-emails.repository';
import { intakeEmailsTable } from './intake-emails.tables';
import {
  checkIfOrganizationCanCreateNewIntakeEmail,
  createIntakeEmail,
  ingestEmailForRecipient,
  processIntakeEmailIngestion,
  updateIntakeEmail,
} from './intake-emails.usecases';
import { randomIntakeEmailUsernameDriverFactory } from './username-drivers/random/random.intake-email-username-driver';
import { userDefinedIntakeEmailUsernameDriverFactory } from './username-drivers/user-defined/user-defined.intake-email-username-driver';

describe('intake-emails usecases', () => {
  describe('ingestEmailForRecipient', () => {
    describe('when a email is forwarded to papra api, we look for the recipient in the intake emails repository and create a papra document for each attachment', () => {
      test(`when an intake email is is configured, enabled and match the recipient, and the sender is allowed, a document is created for each attachment`, async () => {
        const taskServices = createInMemoryTaskServices();
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org-1', name: 'Organization 1' }],
          intakeEmails: [{ id: 'ie-1', organizationId: 'org-1', allowedOrigins: ['foo@example.fr'], emailAddress: 'email-1@papra.email' }],
        });

        const intakeEmailsRepository = createIntakeEmailsRepository({ db });

        const createDocument = createDocumentCreationUsecase({
          db,
          taskServices,
          documentsStorageService: createInMemoryDocumentStorageServices(),
          config: overrideConfig({
            organizationPlans: { isFreePlanUnlimited: true },
          }),
          eventServices: createTestEventServices(),
        });

        await ingestEmailForRecipient({
          fromAddress: 'foo@example.fr',
          recipientAddress: 'email-1@papra.email',
          attachments: [
            new File(['content1'], 'file1.txt', { type: 'text/plain' }),
            new File(['content2'], 'file2.txt', { type: 'text/plain' }),
          ],
          intakeEmailsRepository,
          createDocument,
        });

        const documents = await db.select().from(documentsTable).orderBy(asc(documentsTable.name));

        expect(
          documents.map(doc => pick(doc, ['organizationId', 'name', 'mimeType', 'originalName'])),
        ).to.eql([
          { organizationId: 'org-1', name: 'file1.txt', mimeType: 'text/plain', originalName: 'file1.txt' },
          { organizationId: 'org-1', name: 'file2.txt', mimeType: 'text/plain', originalName: 'file2.txt' },
        ]);
      });

      test(`when the intake email is disabled, nothing happens, only a log is emitted`, async () => {
        const loggerTransport = createInMemoryLoggerTransport();
        const logger = createLogger({ transports: [loggerTransport], namespace: 'test' });

        const taskServices = createInMemoryTaskServices();
        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org-1', name: 'Organization 1' }],
          intakeEmails: [{ id: 'ie-1', organizationId: 'org-1', isEnabled: false, emailAddress: 'email-1@papra.email' }],
        });

        const intakeEmailsRepository = createIntakeEmailsRepository({ db });

        const createDocument = createDocumentCreationUsecase({
          db,
          taskServices,
          documentsStorageService: createInMemoryDocumentStorageServices(),
          config: overrideConfig({
            organizationPlans: { isFreePlanUnlimited: true },
          }),
          eventServices: createTestEventServices(),
        });

        await ingestEmailForRecipient({
          fromAddress: 'foo@example.fr',
          recipientAddress: 'email-1@papra.email',
          attachments: [new File(['content'], 'file.txt', { type: 'text/plain' })],
          intakeEmailsRepository,
          createDocument,
          logger,
        });

        expect(loggerTransport.getLogs({ excludeTimestampMs: true })).to.eql([
          { level: 'info', message: 'Intake email is disabled', namespace: 'test', data: {} },
        ]);
        expect(await db.select().from(documentsTable)).to.eql([]);
      });

      test('when no intake email is found for the recipient, nothing happens, only a log is emitted', async () => {
        const taskServices = createInMemoryTaskServices();
        const loggerTransport = createInMemoryLoggerTransport();
        const logger = createLogger({ transports: [loggerTransport], namespace: 'test' });

        const { db } = await createInMemoryDatabase();

        const intakeEmailsRepository = createIntakeEmailsRepository({ db });

        const createDocument = createDocumentCreationUsecase({
          db,
          taskServices,
          documentsStorageService: createInMemoryDocumentStorageServices(),
          config: overrideConfig({
            organizationPlans: { isFreePlanUnlimited: true },
          }),
          eventServices: createTestEventServices(),
        });

        await ingestEmailForRecipient({
          fromAddress: 'foo@example.fr',
          recipientAddress: 'bar@example.fr',
          attachments: [new File(['content'], 'file.txt', { type: 'text/plain' })],
          intakeEmailsRepository,
          createDocument,
          logger,
        });

        expect(loggerTransport.getLogs({ excludeTimestampMs: true })).to.eql([
          { level: 'info', message: 'Intake email not found', namespace: 'test', data: { recipientAddress: 'bar@example.fr' } },
        ]);
        expect(await db.select().from(documentsTable)).to.eql([]);
      });

      test(`in order to be processed, the emitter of the email must be allowed for the intake email
            it should be registered in the intake email allowed origins
            if not, an error is logged and no document is created`, async () => {
        const taskServices = createInMemoryTaskServices();
        const loggerTransport = createInMemoryLoggerTransport();
        const logger = createLogger({ transports: [loggerTransport], namespace: 'test' });

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org-1', name: 'Organization 1' }],
          intakeEmails: [{ id: 'ie-1', organizationId: 'org-1', allowedOrigins: ['foo@example.fr'], emailAddress: 'email-1@papra.email' }],
        });

        const intakeEmailsRepository = createIntakeEmailsRepository({ db });

        const createDocument = createDocumentCreationUsecase({
          db,
          taskServices,
          documentsStorageService: createInMemoryDocumentStorageServices(),
          config: overrideConfig({
            organizationPlans: { isFreePlanUnlimited: true },
          }),
          eventServices: createTestEventServices(),
        });

        await ingestEmailForRecipient({
          fromAddress: 'a-non-allowed-adress@example.fr',
          recipientAddress: 'email-1@papra.email',
          attachments: [new File(['content'], 'file.txt', { type: 'text/plain' })],
          intakeEmailsRepository,
          createDocument,
          logger,
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
      const taskServices = createInMemoryTaskServices();
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

      const createDocument = createDocumentCreationUsecase({
        db,
        taskServices,
        documentsStorageService: createInMemoryDocumentStorageServices(),
        config: overrideConfig({
          organizationPlans: { isFreePlanUnlimited: true },
        }),
        eventServices: createTestEventServices(),
      });

      await processIntakeEmailIngestion({
        fromAddress: 'foo@example.fr',
        recipientsAddresses: ['email-1@papra.email', 'email-2@papra.email'],
        attachments: [
          new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        ],
        intakeEmailsRepository,
        createDocument,
      });

      const documents = await db.select().from(documentsTable).orderBy(asc(documentsTable.organizationId));

      expect(
        documents.map(doc => pick(doc, ['organizationId', 'name', 'mimeType', 'originalName'])),
      ).to.eql([
        { organizationId: 'org-1', name: 'file1.txt', mimeType: 'text/plain', originalName: 'file1.txt' },
        { organizationId: 'org-2', name: 'file1.txt', mimeType: 'text/plain', originalName: 'file1.txt' },
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
          seatsCount: 10,
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

  describe('createIntakeEmail (with username strategies)', () => {
    const buildPlansRepository = (maxIntakeEmailsCount = 10) => ({
      getOrganizationPlanById: async () => ({
        organizationPlan: {
          id: PLUS_PLAN_ID,
          name: 'Plus',
          limits: {
            maxIntakeEmailsCount,
            maxDocumentStorageBytes: 1024,
            maxOrganizationsMembersCount: 100,
          },
        },
      }),
    } as unknown as PlansRepository);

    const buildIntakeEmailsServices = (overrides: Partial<IntakeEmailsServices> = {}): IntakeEmailsServices => ({
      name: 'test',
      createEmailAddress: async ({ username }) => ({ emailAddress: `${username}@papra.email` }),
      updateEmailAddress: async ({ newUsername }) => ({ emailAddress: `${newUsername}@papra.email` }),
      deleteEmailAddress: async () => {},
      ...overrides,
    });

    test('the random strategy generates a username and rejects user-provided usernames', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        users: [{ id: 'user-1', email: 'user@example.com', name: 'User' }],
      });

      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const intakeEmailsServices = buildIntakeEmailsServices();
      const intakeEmailUsernameServices = randomIntakeEmailUsernameDriverFactory({
        config: overrideConfig(),
        usersRepository: {} as never,
        organizationsRepository: {} as never,
      });

      await expect(
        createIntakeEmail({
          userId: 'user-1',
          organizationId: 'org-1',
          username: 'custom',
          intakeEmailsRepository,
          intakeEmailsServices,
          plansRepository: buildPlansRepository(),
          subscriptionsRepository: createSubscriptionsRepository({ db }),
          intakeEmailUsernameServices,
        }),
      ).rejects.toThrow(createIntakeEmailUsernameNotAcceptedByStrategyError());

      const { intakeEmail } = await createIntakeEmail({
        userId: 'user-1',
        organizationId: 'org-1',
        intakeEmailsRepository,
        intakeEmailsServices,
        plansRepository: buildPlansRepository(),
        subscriptionsRepository: createSubscriptionsRepository({ db }),
        intakeEmailUsernameServices,
      });

      expect(intakeEmail.emailAddress).to.match(/@papra\.email$/);
    });

    test('the user-defined strategy accepts a valid username and stores the resulting address', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        users: [{ id: 'user-1', email: 'user@example.com', name: 'User' }],
      });

      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const intakeEmailsServices = buildIntakeEmailsServices();
      const intakeEmailUsernameServices = userDefinedIntakeEmailUsernameDriverFactory({
        config: overrideConfig({ intakeEmails: { username: { drivers: { userDefined: { disableDenyList: false } } } } }),
        usersRepository: {} as never,
        organizationsRepository: {} as never,
      });

      const { intakeEmail } = await createIntakeEmail({
        userId: 'user-1',
        organizationId: 'org-1',
        username: 'My-Mailbox',
        intakeEmailsRepository,
        intakeEmailsServices,
        plansRepository: buildPlansRepository(),
        subscriptionsRepository: createSubscriptionsRepository({ db }),
        intakeEmailUsernameServices,
      });

      expect(intakeEmail.emailAddress).to.equal('my-mailbox@papra.email');
    });

    test('the user-defined strategy requires a username, rejects denied names', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        users: [{ id: 'user-1', email: 'user@example.com', name: 'User' }],
      });

      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const intakeEmailsServices = buildIntakeEmailsServices();
      const intakeEmailUsernameServices = userDefinedIntakeEmailUsernameDriverFactory({
        config: overrideConfig(),
        usersRepository: {} as never,
        organizationsRepository: {} as never,
      });

      const baseArgs = {
        userId: 'user-1',
        organizationId: 'org-1',
        intakeEmailsRepository,
        intakeEmailsServices,
        plansRepository: buildPlansRepository(),
        subscriptionsRepository: createSubscriptionsRepository({ db }),
        intakeEmailUsernameServices,
      };

      await expect(createIntakeEmail(baseArgs)).rejects.toThrow(createIntakeEmailUsernameRequiredByStrategyError());
      await expect(createIntakeEmail({ ...baseArgs, username: 'admin' })).rejects.toThrow(createIntakeEmailUsernameDeniedError());
    });

    test('the deny list can be disabled via configuration', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        users: [{ id: 'user-1', email: 'user@example.com', name: 'User' }],
      });

      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const intakeEmailsServices = buildIntakeEmailsServices();
      const intakeEmailUsernameServices = userDefinedIntakeEmailUsernameDriverFactory({
        config: overrideConfig({ intakeEmails: { username: { drivers: { userDefined: { disableDenyList: true } } } } }),
        usersRepository: {} as never,
        organizationsRepository: {} as never,
      });

      const { intakeEmail } = await createIntakeEmail({
        userId: 'user-1',
        organizationId: 'org-1',
        username: 'admin',
        intakeEmailsRepository,
        intakeEmailsServices,
        plansRepository: buildPlansRepository(),
        subscriptionsRepository: createSubscriptionsRepository({ db }),
        intakeEmailUsernameServices,
      });

      expect(intakeEmail.emailAddress).to.equal('admin@papra.email');
    });
  });

  describe('updateIntakeEmail', () => {
    test('updating the username calls the email driver, persists the new address and uses the validated username', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        intakeEmails: [{ id: 'ie-1', organizationId: 'org-1', emailAddress: 'old@papra.email' }],
        users: [{ id: 'user-1', email: 'user@example.com', name: 'User' }],
      });

      const updateEmailAddress = vi.fn(async ({ newUsername }: { currentEmailAddress: string; newUsername: string }) => ({
        emailAddress: `${newUsername}@papra.email`,
      }));

      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const intakeEmailsServices: IntakeEmailsServices = {
        name: 'test',
        createEmailAddress: async () => ({ emailAddress: '' }),
        updateEmailAddress,
        deleteEmailAddress: async () => {},
      };
      const intakeEmailUsernameServices = userDefinedIntakeEmailUsernameDriverFactory({
        config: overrideConfig(),
        usersRepository: {} as never,
        organizationsRepository: {} as never,
      });

      const { intakeEmail } = await updateIntakeEmail({
        userId: 'user-1',
        intakeEmailId: 'ie-1',
        organizationId: 'org-1',
        username: 'New-Name',
        intakeEmailsRepository,
        intakeEmailsServices,
        intakeEmailUsernameServices,
      });

      expect(updateEmailAddress).toHaveBeenCalledWith({ currentEmailAddress: 'old@papra.email', newUsername: 'new-name' });
      expect(intakeEmail.emailAddress).to.equal('new-name@papra.email');

      const [persisted] = await db.select().from(intakeEmailsTable).where(eq(intakeEmailsTable.id, 'ie-1'));
      expect(persisted?.emailAddress).to.equal('new-name@papra.email');
    });

    test('updating the username is rejected when the configured strategy does not accept user-defined usernames', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        intakeEmails: [{ id: 'ie-1', organizationId: 'org-1', emailAddress: 'old@papra.email' }],
      });

      const intakeEmailsRepository = createIntakeEmailsRepository({ db });
      const intakeEmailsServices: IntakeEmailsServices = {
        name: 'test',
        createEmailAddress: async () => ({ emailAddress: '' }),
        updateEmailAddress: async () => ({ emailAddress: '' }),
        deleteEmailAddress: async () => {},
      };
      const intakeEmailUsernameServices = randomIntakeEmailUsernameDriverFactory({
        config: overrideConfig(),
        usersRepository: {} as never,
        organizationsRepository: {} as never,
      });

      await expect(
        updateIntakeEmail({
          userId: 'user-1',
          intakeEmailId: 'ie-1',
          organizationId: 'org-1',
          username: 'something',
          intakeEmailsRepository,
          intakeEmailsServices,
          intakeEmailUsernameServices,
        }),
      ).rejects.toThrow(createIntakeEmailUsernameUpdateNotSupportedError());
    });
  });
});
