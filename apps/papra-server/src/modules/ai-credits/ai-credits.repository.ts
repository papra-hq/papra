import { injectArguments } from '@corentinth/chisels';
import type { Database } from '../app/database/database.types';
import { organizationAiCreditsUsageTable } from './ai-credits.tables';
import type { AiCreditsUsageDetails, AiCreditsUsageSource } from './ai-credits.types';
import { and, eq, gte, sum } from 'drizzle-orm';
import { systemClock } from '../shared/clock/clock';
import type { Clock } from '../shared/clock/clock.types';

export type AiCreditsRepository = ReturnType<typeof createAiCreditsRepository>;

export function createAiCreditsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      registerCreditConsumption,
      getCurrentPeriodOrganizationAiCreditsCount,
    },
    {
      db,
    },
  );
}

async function registerCreditConsumption({
  organizationId,
  creditsConsumed,
  source,
  usage,

  db,
}: {
  organizationId: string;
  creditsConsumed: number;
  source: AiCreditsUsageSource;
  usage: AiCreditsUsageDetails;

  db: Database;
}) {
  await db.insert(organizationAiCreditsUsageTable).values({
    organizationId,
    creditsConsumed,
    source,
    usage,
  });
}

async function getCurrentPeriodOrganizationAiCreditsCount({
  organizationId,
  db,
  clock = systemClock,
}: {
  organizationId: string;
  db: Database;
  clock?: Clock;
}) {
  const startOfMonth = clock
    .now()
    .toZonedDateTimeISO('UTC')
    .with({ day: 1 })
    .startOfDay().epochMilliseconds;

  const result = await db
    .select({
      totalCreditsConsumed: sum(organizationAiCreditsUsageTable.creditsConsumed),
    })
    .from(organizationAiCreditsUsageTable)
    .where(
      and(
        eq(organizationAiCreditsUsageTable.organizationId, organizationId),
        gte(organizationAiCreditsUsageTable.createdAt, new Date(startOfMonth)),
      ),
    );

  const [{ totalCreditsConsumed } = {}] = result;

  return {
    creditsConsumed: Number(totalCreditsConsumed ?? 0),
  };
}
