import { createError } from '../shared/errors/errors';
import { isDefined, isNil } from '../shared/utils';

export function buildEmailAddress({
  username,
  domain,
  plusPart,
}: {
  username: string;
  domain: string;
  plusPart?: string;
}) {
  return `${username}${isDefined(plusPart) ? `+${plusPart}` : ''}@${domain}`;
}

export function parseEmailAddress({ email }: { email: string }) {
  const [fullUsername, domain] = email.split('@');

  if (isNil(fullUsername) || isNil(domain)) {
    throw createError({
      message: 'Invalid email address',
      code: 'intake_emails.invalid_email_address',
      statusCode: 400,
    });
  }

  const [username, ...plusParts] = fullUsername.split('+');
  const plusPart = plusParts.length > 0 ? plusParts.join('+') : undefined;

  return { username, domain, plusPart };
}

export function getEmailUsername({ email }: { email: string | undefined }) {
  if (isNil(email)) {
    return { username: undefined };
  }

  return {
    username: email.split('@')[0],
  };
}

export function getIsFromAllowedOrigin({
  origin,
  allowedOrigins,
}: {
  origin: string;
  allowedOrigins: string[];
}) {
  return allowedOrigins
    .map(allowedOrigin => allowedOrigin.toLowerCase())
    .includes(origin.toLowerCase());
}
