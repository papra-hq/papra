import type { Database } from '../app/database/database.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq } from 'drizzle-orm';
import { omitUndefined } from '../shared/utils';
import { intakeEmailsTable } from './intake-emails.tables';

export type IntakeEmailsRepository = ReturnType<typeof createIntakeEmailsRepository>;

export function createIntakeEmailsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      createIntakeEmail,
      updateIntakeEmail,
      getIntakeEmail,
      getOrganizationIntakeEmails,
      deleteIntakeEmail,
    },
    { db },
  );
}

async function createIntakeEmail({ organizationId, db }: { organizationId: string; db: Database }) {
  const [intakeEmail] = await db.insert(intakeEmailsTable).values({ organizationId }).returning();

  return { intakeEmail };
}

async function updateIntakeEmail({ intakeEmailId, organizationId, isEnabled, allowedOrigins, db }: { intakeEmailId: string; organizationId: string; isEnabled?: boolean; allowedOrigins?: string[]; db: Database }) {
  const [intakeEmail] = await db
    .update(intakeEmailsTable)
    .set(
      omitUndefined({
        isEnabled,
        allowedOrigins,
      }),
    )
    .where(
      and(
        eq(intakeEmailsTable.id, intakeEmailId),
        eq(intakeEmailsTable.organizationId, organizationId),
      ),
    )
    .returning();

  return { intakeEmail };
}

async function getIntakeEmail({ intakeEmailId, db }: { intakeEmailId: string; db: Database }) {
  const [intakeEmail] = await db
    .select()
    .from(intakeEmailsTable)
    .where(
      eq(intakeEmailsTable.id, intakeEmailId),
    );

  return { intakeEmail };
}

async function getOrganizationIntakeEmails({ organizationId, db }: { organizationId: string; db: Database }) {
  const intakeEmails = await db
    .select()
    .from(intakeEmailsTable)
    .where(
      eq(intakeEmailsTable.organizationId, organizationId),
    );

  return { intakeEmails };
}

async function deleteIntakeEmail({ intakeEmailId, organizationId, db }: { intakeEmailId: string; organizationId: string; db: Database }) {
  await db
    .delete(intakeEmailsTable)
    .where(
      and(
        eq(intakeEmailsTable.id, intakeEmailId),
        eq(intakeEmailsTable.organizationId, organizationId),
      ),
    );
}
