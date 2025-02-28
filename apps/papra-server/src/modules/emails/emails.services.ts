import type { Config } from '../config/config.types';
import { injectArguments } from '@corentinth/chisels';
import { Resend } from 'resend';
import { createError } from '../shared/errors/errors';
import { createLogger } from '../shared/logger/logger';

const logger = createLogger({ namespace: 'emails.services' });

export type EmailsServices = ReturnType<typeof createEmailsServices>;

export function createEmailsServices({ config }: { config: Config }) {
  return injectArguments(
    {
      sendEmail,
    },
    { config },
  );
}

async function sendEmail({ config, ...rest }: { from?: string; to: string | string[]; subject: string; config: Config; html: string }) {
  const { resendApiKey, dryRun, fromEmail } = config.emails;

  if (dryRun) {
    logger.info({ ...rest }, 'Dry run enabled, skipping email sending');
    return { emailId: 'dry-run' };
  }

  const resend = new Resend(resendApiKey);

  const { error, data } = await resend.emails.send({ from: fromEmail, ...rest });

  if (error) {
    logger.error({ error, ...rest }, 'Failed to send email');
    throw createError({
      code: 'email.send_failed',
      message: 'Failed to send email',
      statusCode: 500,
      isInternal: true,
    });
  }

  const { id: emailId } = data ?? {};

  logger.info({ emailId }, 'Email sent');

  return { emailId };
}
