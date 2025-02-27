import { buildUrl } from '@corentinth/chisels';
import { generateId as generateHumanReadableId } from '@corentinth/friendly-ids';
import { createClient } from '@owlrelay/api-sdk';
import { buildEmailAddress } from '../../intake-emails.models';
import { defineIntakeEmailDriver } from '../intake-emails.drivers.models';

export const OWLRELAY_INTAKE_EMAIL_DRIVER_NAME = 'owlrelay';

export const owlrelayIntakeEmailDriverFactory = defineIntakeEmailDriver(({ config }) => {
  const { baseUrl } = config.server;
  const { owlrelayApiKey, webhookUrl: configuredWebhookUrl } = config.intakeEmails.drivers.owlrelay;

  const client = createClient({
    apiKey: owlrelayApiKey,
  });

  const webhookUrl = configuredWebhookUrl ?? buildUrl({ baseUrl, path: '/api/intake-emails/owlrelay' });

  return {
    name: OWLRELAY_INTAKE_EMAIL_DRIVER_NAME,
    generateEmailAddress: async () => {
      const { domain, username } = await client.createEmail({
        username: generateHumanReadableId(),
        webhookUrl,
      });

      const emailAddress = buildEmailAddress({ username, domain });

      return {
        emailAddress,
      };
    },
  };
});
