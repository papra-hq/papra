import nodemailer from 'nodemailer';
import { createError } from '../../../shared/errors/errors';
import { defineEmailDriverFactory } from '../email-driver.models';

export const SMTP_EMAIL_DRIVER_NAME = 'smtp';

export const smtpEmailDriverFactory = defineEmailDriverFactory(({ config, logger }) => {
  const { fromEmail } = config.emails;
  const { host, port, secure, user, password, rawConfig } = config.emails.drivers.smtp;

  const transporter = nodemailer.createTransport(rawConfig ?? {
    host,
    port,
    secure,
    auth: {
      user,
      pass: password,
    },
  });

  return {
    name: SMTP_EMAIL_DRIVER_NAME,
    sendEmail: async ({ to, subject, html, from }) => {
      try {
        const { messageId } = await transporter.sendMail({
          from: from ?? fromEmail,
          to,
          subject,
          html,
        });

        logger.info({ messageId }, 'Email sent');
      } catch (error) {
        logger.error({ error }, 'Failed to send email');

        throw createError({
          code: 'email.send_failed',
          message: 'Failed to send email',
          statusCode: 500,
          isInternal: true,
        });
      }
    },
  };
});
