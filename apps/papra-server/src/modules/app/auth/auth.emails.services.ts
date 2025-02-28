import type { User } from 'better-auth';
import type { EmailsServices } from '../../emails/emails.services';
import { injectArguments } from '@corentinth/chisels';
import { createLogger } from '../../shared/logger/logger';

const logger = createLogger({ namespace: 'auth.emails.services' });

export type AuthEmailsServices = ReturnType<typeof createAuthEmailsServices>;

export function createAuthEmailsServices({ emailsServices }: { emailsServices: EmailsServices }) {
  return injectArguments(
    {
      sendVerificationEmail,
      sendPasswordResetEmail,
    },
    { emailsServices },
  );
}

export async function sendVerificationEmail({ user, url, emailsServices }: { user: User; url: string; token: string; emailsServices: EmailsServices }) {
  logger.info({ userId: user.id }, 'Sending verification email');

  await emailsServices.sendEmail({
    to: user.email,
    subject: 'Verify your email',
    html: `
<p>Hello ${user.name},</p>
<p>Verify your email by clicking <a href="${url}">here</a></p>
<p>Or by pasting the following link into your browser: ${url}</p>
<p style="color: #888;">Best regards,</p>
<p style="color: #888;">The Papra team</p>
`.trim(),
  });
}

export async function sendPasswordResetEmail({ user, url, emailsServices }: { user: User; url: string; token: string; emailsServices: EmailsServices }) {
  logger.info({ userId: user.id }, 'Sending password reset email');

  await emailsServices.sendEmail({
    to: user.email,
    subject: 'Reset your password',
    html: `
<p>Hello ${user.name},</p>
<p>Reset your password by clicking <a href="${url}">here</a></p>
<p>Or by pasting the following link into your browser: ${url}</p>
<p style="color: #888;">Best regards,</p>
<p style="color: #888;">The Papra team</p>
`.trim(),
  });
}
