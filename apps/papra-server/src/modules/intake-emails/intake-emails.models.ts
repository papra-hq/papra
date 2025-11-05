import type { DbInsertableIntakeEmail, DbSelectableIntakeEmail, InsertableIntakeEmail, IntakeEmail } from './intake-emails.new.tables';
import { createError } from '../shared/errors/errors';
import { generateId } from '../shared/random/ids';
import { isDefined, isNil } from '../shared/utils';
import { INTAKE_EMAIL_ID_PREFIX } from './intake-emails.constants';

const generateIntakeEmailId = () => generateId({ prefix: INTAKE_EMAIL_ID_PREFIX });

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

  if (isNil(username)) {
    throw createError({
      message: 'Badly formatted email address',
      code: 'intake_emails.badly_formatted_email_address',
      statusCode: 400,
    });
  }

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

// DB <-> Business model transformers

export function dbToIntakeEmail(dbIntakeEmail?: DbSelectableIntakeEmail): IntakeEmail | undefined {
  if (!dbIntakeEmail) {
    return undefined;
  }

  return {
    id: dbIntakeEmail.id,
    emailAddress: dbIntakeEmail.email_address,
    organizationId: dbIntakeEmail.organization_id,
    allowedOrigins: JSON.parse(dbIntakeEmail.allowed_origins) as string[],
    isEnabled: dbIntakeEmail.is_enabled === 1,
    createdAt: new Date(dbIntakeEmail.created_at),
    updatedAt: new Date(dbIntakeEmail.updated_at),
  };
}

export function intakeEmailToDb(
  intakeEmail: InsertableIntakeEmail,
  {
    now = new Date(),
    generateId = generateIntakeEmailId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableIntakeEmail {
  return {
    id: intakeEmail.id ?? generateId(),
    email_address: intakeEmail.emailAddress,
    organization_id: intakeEmail.organizationId,
    allowed_origins: JSON.stringify(intakeEmail.allowedOrigins ?? []),
    is_enabled: intakeEmail.isEnabled === true ? 1 : 0,
    created_at: intakeEmail.createdAt?.getTime() ?? now.getTime(),
    updated_at: intakeEmail.updatedAt?.getTime() ?? now.getTime(),
  };
}
