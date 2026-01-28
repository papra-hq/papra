import type { Migration } from '../migrations.types';
import { asc, eq, isNull, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createBatchedIterator } from '../../modules/app/database/database.usecases';
import { createLogger } from '../../modules/shared/logger/logger';
import { normalizeTagName } from '../../modules/tags/tags.repository.models';
import { tagsTable } from '../../modules/tags/tags.table';

export function createTagNameNormalizer({ maxAttempts = 1000, generateCollisionProofSuffix = () => nanoid(24) }: { maxAttempts?: number; generateCollisionProofSuffix?: () => string } = {}) {
  const tagsSet = new Set<string>();
  const createSuffix = (count: number) => (count === 0 ? '' : ` (${count + 1})`);

  return ({ name, organizationId }: { name: string; organizationId: string }) => {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const suffix = createSuffix(attempts);
      const nameWithSuffix = `${name}${suffix}`;
      const normalizedNameBase = normalizeTagName({ name: nameWithSuffix });
      const key = [organizationId, normalizedNameBase].join('|');

      if (!tagsSet.has(key)) {
        tagsSet.add(key);
        return {
          normalizedName: normalizedNameBase,
          name: nameWithSuffix,
        };
      }

      attempts++;
    }

    const hardSuffix = generateCollisionProofSuffix(); // Fuck it
    const nameWithHardSuffix = `${name} ${hardSuffix}`;
    const normalizedName = normalizeTagName({ name: nameWithHardSuffix });

    const key = [organizationId, normalizedName].join('|');
    tagsSet.add(key);

    return {
      normalizedName,
      name: nameWithHardSuffix,
    };
  };
}

const logger = createLogger({ namespace: 'migrations.caseInsensitiveTagNameUniqConstraint' });

export const caseInsensitiveTagNameUniqConstraintMigration = {
  name: 'case-insensitive-tag-name-uniq-constraint',

  up: async ({ db }) => {
    const tableInfo = await db.run(sql`PRAGMA table_info(tags)`);
    const existingColumns = tableInfo.rows.map(row => row.name);
    const hasColumn = (columnName: string) => existingColumns.includes(columnName);

    if (!hasColumn('normalized_name')) {
      await db.run(sql`ALTER TABLE tags ADD COLUMN "normalized_name" text`);

      const normalizer = createTagNameNormalizer();

      const iterator = createBatchedIterator({
        batchSize: 200,
        getBatch: async ({ limit }) => db
          .select()
          .from(tagsTable)
          .where(isNull(tagsTable.normalizedName))
          .orderBy(asc(tagsTable.id))
          .limit(limit), // No offset as where clause ensures we only get unprocessed rows

      });

      for await (const tag of iterator) {
        const { normalizedName, name } = normalizer({ name: tag.name, organizationId: tag.organizationId });

        await db
          .update(tagsTable)
          .set({ normalizedName, name })
          .where(eq(tagsTable.id, tag.id));

        logger.debug({ tagId: tag.id, oldName: tag.name, newName: name, normalizedName }, 'Updated tag with normalized name');
      }
    }

    await db.batch([
      db.run(sql`DROP INDEX IF EXISTS tags_organization_id_name_unique`),
      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS tags_organization_id_normalized_name_unique ON tags (organization_id, normalized_name)`),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP INDEX IF EXISTS tags_organization_id_normalized_name_unique`),
      db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "tags_organization_id_name_unique" ON "tags" ("organization_id","name")`),
      db.run(sql`ALTER TABLE tags DROP COLUMN normalized_name`),
    ]);
  },
} satisfies Migration;
