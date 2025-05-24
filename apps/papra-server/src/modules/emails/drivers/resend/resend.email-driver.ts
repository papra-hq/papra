import { Resend } from 'resend';
import { createError } from '../../../shared/errors/errors';
import { defineEmailDriverFactory } from '../email-driver.models';

export const RESEND_EMAIL_DRIVER_NAME = 'resend';

export const resendEmailDriverFactory = defineEmailDriverFactory(({ config, logger }) => {
  const { fromEmail } = config.emails;
  const { resendApiKey } = config.emails.drivers.resend;

  const resendClient = new Resend(resendApiKey);

  return {
    name: RESEND_EMAIL_DRIVER_NAME,
    sendEmail: async ({ to, subject, html, from }) => {
      const { error } = await resendClient.emails.send({
        from: from ?? fromEmail,
        to,
        subject,
        html,
      });

      if (error) {
        logger.error({ error, to, subject, from }, 'Failed to send email with Resend');

        throw createError({
          code: 'email.send_failed',
          message: 'Failed to send email',
          statusCode: 500,
          isInternal: true,
        });
      }

      logger.info({ to, subject, from }, 'Email sent');
    },
  };
});
