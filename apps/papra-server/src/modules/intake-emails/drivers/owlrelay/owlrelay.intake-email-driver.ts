import { buildUrl, safely } from '@corentinth/chisels';
import { generateId as generateHumanReadableId } from '@corentinth/friendly-ids';
import { createClient } from '@owlrelay/api-sdk';
import { getServerBaseUrl } from '../../../config/config.models';
import { createLogger } from '../../../shared/logger/logger';
import { INTAKE_EMAILS_INGEST_ROUTE } from '../../intake-emails.constants';
import { buildEmailAddress } from '../../intake-emails.models';
import { defineIntakeEmailDriver } from '../intake-emails.drivers.models';

export const OWLRELAY_INTAKE_EMAIL_DRIVER_NAME = 'owlrelay';

const logger = createLogger({ namespace: 'intake-emails.drivers.owlrelay' });

export const owlrelayIntakeEmailDriverFactory = defineIntakeEmailDriver(({ config }) => {
  const { serverBaseUrl } = getServerBaseUrl({ config });
  const { webhookSecret } = config.intakeEmails;
  const { owlrelayApiKey, webhookUrl: configuredWebhookUrl } = config.intakeEmails.drivers.owlrelay;

  const client = createClient({
    apiKey: owlrelayApiKey,
  });

  const webhookUrl = configuredWebhookUrl ?? buildUrl({ baseUrl: serverBaseUrl, path: INTAKE_EMAILS_INGEST_ROUTE });

  return {
    name: OWLRELAY_INTAKE_EMAIL_DRIVER_NAME,
    generateEmailAddress: async () => {
      const { domain, username, id: owlrelayEmailId } = await client.createEmail({
        username: generateHumanReadableId(),
        webhookUrl,
        webhookSecret,
      });

      const emailAddress = buildEmailAddress({ username, domain });

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
