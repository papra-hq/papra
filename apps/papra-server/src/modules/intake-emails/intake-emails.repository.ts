import type { DatabaseClient } from '../app/database/database.types';
import { injectArguments, safely } from '@corentinth/chisels';
import { sql } from 'kysely';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { createError } from '../shared/errors/errors';
import { omitUndefined } from '../shared/utils';
import { createIntakeEmailAlreadyExistsError, createIntakeEmailNotFoundError } from './intake-emails.errors';
import { dbToIntakeEmail, intakeEmailToDb } from './intake-emails.models';

export type IntakeEmailsRepository = ReturnType<typeof createIntakeEmailsRepository>;

export function createIntakeEmailsRepository({ db }: { db: DatabaseClient }) {
  return injectArguments(
    {
      createIntakeEmail,
      updateIntakeEmail,
      getIntakeEmail,
      getOrganizationIntakeEmails,
      getIntakeEmailByEmailAddress,
      deleteIntakeEmail,
      getOrganizationIntakeEmailsCount,
    },
    { db },
  );
}

async function createIntakeEmail({ organizationId, emailAddress, db }: { organizationId: string; emailAddress: string; db: DatabaseClient }) {
  const [result, error] = await safely(
    db
      .insertInto('intake_emails')
      .values(intakeEmailToDb({ organizationId, emailAddress }))
      .returningAll()
      .executeTakeFirst(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createIntakeEmailAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const intakeEmail = dbToIntakeEmail(result);

  if (!intakeEmail) {
    // Very unlikely to happen as the insertion should throw an issue, it's for type safety
    throw createError({
      message: 'Error while creating intake email',
      code: 'intake-emails.create_error',
      statusCode: 500,
      isInternal: true,
    });
  }

  return { intakeEmail };
}

async function updateIntakeEmail({ intakeEmailId, organizationId, isEnabled, allowedOrigins, db }: { intakeEmailId: string; organizationId: string; isEnabled?: boolean; allowedOrigins?: string[]; db: DatabaseClient }) {
  const updates: { is_enabled?: number; allowed_origins?: string } = {};

  if (isEnabled !== undefined) {
    updates.is_enabled = isEnabled ? 1 : 0;
  }

  if (allowedOrigins !== undefined) {
    updates.allowed_origins = JSON.stringify(allowedOrigins);
  }

  const dbIntakeEmail = await db
    .updateTable('intake_emails')
    .set(omitUndefined(updates))
    .where('id', '=', intakeEmailId)
    .where('organization_id', '=', organizationId)
    .returningAll()
    .executeTakeFirst();

  const intakeEmail = dbToIntakeEmail(dbIntakeEmail);

  if (!intakeEmail) {
    throw createIntakeEmailNotFoundError();
  }

  return { intakeEmail };
}

async function getIntakeEmail({ intakeEmailId, organizationId, db }: { intakeEmailId: string; organizationId: string; db: DatabaseClient }) {
  const dbIntakeEmail = await db
    .selectFrom('intake_emails')
    .where('id', '=', intakeEmailId)
    .where('organization_id', '=', organizationId)
    .selectAll()
    .executeTakeFirst();

  const intakeEmail = dbToIntakeEmail(dbIntakeEmail);

  return { intakeEmail };
}

async function getIntakeEmailByEmailAddress({ emailAddress, db }: { emailAddress: string; db: DatabaseClient }) {
  const dbIntakeEmail = await db
    .selectFrom('intake_emails')
    .where('email_address', '=', emailAddress)
    .selectAll()
    .executeTakeFirst();

  const intakeEmail = dbToIntakeEmail(dbIntakeEmail);

  return { intakeEmail };
}

async function getOrganizationIntakeEmails({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const dbIntakeEmails = await db
    .selectFrom('intake_emails')
    .where('organization_id', '=', organizationId)
    .selectAll()
    .execute();

  const intakeEmails = dbIntakeEmails.map(dbEmail => dbToIntakeEmail(dbEmail)).filter((email): email is NonNullable<typeof email> => email !== undefined);

  return { intakeEmails };
}

async function deleteIntakeEmail({ intakeEmailId, organizationId, db }: { intakeEmailId: string; organizationId: string; db: DatabaseClient }) {
  await db
    .deleteFrom('intake_emails')
    .where('id', '=', intakeEmailId)
    .where('organization_id', '=', organizationId)
    .execute();
}

async function getOrganizationIntakeEmailsCount({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const result = await db
    .selectFrom('intake_emails')
    .select(sql<number>`count(*)`.as('intake_email_count'))
    .where('organization_id', '=', organizationId)
    .executeTakeFirst();

  if (!result) {
    throw createIntakeEmailNotFoundError();
  }

  const { intake_email_count: intakeEmailCount } = result;

  return { intakeEmailCount };
}
