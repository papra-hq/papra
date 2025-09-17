import { buildUrl, safely } from '@corentinth/chisels';
import { createClient } from '@owlrelay/api-sdk';
import { getServerBaseUrl } from '../../../config/config.models';
import { createError } from '../../../shared/errors/errors';
import { createLogger } from '../../../shared/logger/logger';
import { INTAKE_EMAILS_INGEST_ROUTE } from '../../intake-emails.constants';
import { buildEmailAddress } from '../../intake-emails.models';
import { defineIntakeEmailDriver } from '../intake-emails.drivers.models';

export const OWLRELAY_INTAKE_EMAIL_DRIVER_NAME = 'owlrelay';

const logger = createLogger({ namespace: 'intake-emails.drivers.owlrelay' });

export const owlrelayIntakeEmailDriverFactory = defineIntakeEmailDriver(({ config }) => {
  const { serverBaseUrl } = getServerBaseUrl({ config });
  const { webhookSecret } = config.intakeEmails;
  const { owlrelayApiKey, webhookUrl: configuredWebhookUrl, domain } = config.intakeEmails.drivers.owlrelay;

  const client = createClient({ apiKey: owlrelayApiKey });

  const webhookUrl = configuredWebhookUrl ?? buildUrl({ baseUrl: serverBaseUrl, path: INTAKE_EMAILS_INGEST_ROUTE });

  return {
    name: OWLRELAY_INTAKE_EMAIL_DRIVER_NAME,
    createEmailAddress: async ({ username }) => {
      const [result, error] = await safely(client.createEmail({
        username,
        webhookUrl,
        webhookSecret,
        domain,
      }));

      if (error) {
        logger.error({ error, username }, 'Failed to create email address in OwlRelay');

        throw createError({
          code: 'intake_emails.create_email_address_failed',
          message: 'Failed to create email address in OwlRelay',
          statusCode: 500,
          isInternal: true,
        });
      }

      const { id: owlrelayEmailId, username: createdAddressUsername, domain: createdAddressDomain } = result;
      const emailAddress = buildEmailAddress({ username: createdAddressUsername, domain: createdAddressDomain });

      logger.info({ emailAddress, owlrelayEmailId }, 'Created email address in OwlRelay');

      return {
        emailAddress,
      };
    },
    deleteEmailAddress: async ({ emailAddress }) => {
      const [, error] = await safely(client.deleteEmail({ emailAddress }));

      if (error) {
        logger.error({ error }, 'Failed to delete email address in OwlRelay');
        return;
      }

      logger.info({ emailAddress }, 'Deleted email address in OwlRelay');
    },
  };
});
