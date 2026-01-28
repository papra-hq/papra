import { asc, sql } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { setupDatabase } from '../../modules/app/database/database';
import { isNil } from '../../modules/shared/utils';
import { documentsTagsTable, tagsTable } from '../../modules/tags/tags.table';
import { initialSchemaSetupMigration } from './0001-initial-schema-setup.migration';
import { caseInsensitiveTagNameUniqConstraintMigration, createTagNameNormalizer } from './0016-case-insensitive-tag-name-uniq-constraint.migration';

describe('0016-case-insensitive-tag-name-uniq-constraint migration', () => {
  describe('createTagNameNormalizer', () => {
    test('utility that normalizes and deduplicates tag names per organization by appending a suffix', () => {
      const normalizeTagName = createTagNameNormalizer();

      expect(normalizeTagName({ name: 'Important', organizationId: 'org_1' })).to.eql({ name: 'Important', normalizedName: 'important' });
      expect(normalizeTagName({ name: 'important', organizationId: 'org_1' })).to.eql({ name: 'important (2)', normalizedName: 'important (2)' });
      expect(normalizeTagName({ name: 'IMPORTANT', organizationId: 'org_1' })).to.eql({ name: 'IMPORTANT (3)', normalizedName: 'important (3)' });

      expect(normalizeTagName({ name: 'Important', organizationId: 'org_2' })).to.eql({ name: 'Important', normalizedName: 'important' });
      expect(normalizeTagName({ name: 'important', organizationId: 'org_2' })).to.eql({ name: 'important (2)', normalizedName: 'important (2)' });
      expect(normalizeTagName({ name: 'Other Tag', organizationId: 'org_1' })).to.eql({ name: 'Other Tag', normalizedName: 'other tag' });
      expect(normalizeTagName({ name: 'Other Tag', organizationId: 'org_2' })).to.eql({ name: 'Other Tag', normalizedName: 'other tag' });
    });

    test('if the generated name with suffix collides, it continues incrementing the suffix until unique', () => {
      const normalizeTagName = createTagNameNormalizer();

      expect(normalizeTagName({ name: 'tag', organizationId: 'org_1' })).to.eql({ name: 'tag', normalizedName: 'tag' });
      expect(normalizeTagName({ name: 'tag (2)', organizationId: 'org_1' })).to.eql({ name: 'tag (2)', normalizedName: 'tag (2)' });
      expect(normalizeTagName({ name: 'tag', organizationId: 'org_1' })).to.eql({ name: 'tag (3)', normalizedName: 'tag (3)' });
      expect(normalizeTagName({ name: 'tag (2)', organizationId: 'org_1' })).to.eql({ name: 'tag (2) (2)', normalizedName: 'tag (2) (2)' });
      expect(normalizeTagName({ name: 'tag', organizationId: 'org_1' })).to.eql({ name: 'tag (4)', normalizedName: 'tag (4)' });
    });

    test('after many collisions, it appends a random suffix to avoid infinite loops and long processing times', () => {
      const normalizeTagName = createTagNameNormalizer({ maxAttempts: 5, generateCollisionProofSuffix: () => 'my-super-random-suffix' });

      expect(normalizeTagName({ name: 'tag', organizationId: 'org_1' })).to.eql({ name: 'tag', normalizedName: 'tag' });
      expect(normalizeTagName({ name: 'tag', organizationId: 'org_1' })).to.eql({ name: 'tag (2)', normalizedName: 'tag (2)' });
      expect(normalizeTagName({ name: 'tag', organizationId: 'org_1' })).to.eql({ name: 'tag (3)', normalizedName: 'tag (3)' });
      expect(normalizeTagName({ name: 'tag', organizationId: 'org_1' })).to.eql({ name: 'tag (4)', normalizedName: 'tag (4)' });
      expect(normalizeTagName({ name: 'tag', organizationId: 'org_1' })).to.eql({ name: 'tag (5)', normalizedName: 'tag (5)' });
      expect(normalizeTagName({ name: 'tag', organizationId: 'org_1' })).to.eql({
        name: 'tag my-super-random-suffix',
        normalizedName: 'tag my-super-random-suffix',
      });
    });
  });

  describe('caseInsensitiveTagNameUniqConstraintMigration', () => {
    test('adds normalized_name column and migrates existing tags', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      // Create initial schema without the normalized_name column yet
      await initialSchemaSetupMigration.up({ db });

      await db.batch([
        db.run(sql`INSERT INTO organizations(id, name, created_at, updated_at) VALUES ('org_1', 'Org 1', 1737936000000, 1737936000000)`),
        db.run(sql`INSERT INTO organizations(id, name, created_at, updated_at) VALUES ('org_2', 'Org 2', 1737936000000, 1737936000000)`),

        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES ('tag_1', 1737936000000, 1737936000000, 'org_1', 'Important', '#ff0000', NULL)`),
        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES ('tag_2', 1737936000000, 1737936000000, 'org_1', 'IMPORTANT', '#00ff00', NULL)`),
        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES ('tag_3', 1737936000000, 1737936000000, 'org_1', 'important', '#0000ff', NULL)`),
        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES ('tag_4', 1737936000000, 1737936000000, 'org_2', 'Important', '#ffff00', NULL)`),
        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES ('tag_5', 1737936000000, 1737936000000, 'org_1', 'Work', '#ff00ff', 'Work related')`),
        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES ('tag_6', 1737936000000, 1737936000000, 'org_2', 'work', '#00ffff', NULL)`),
      ]);

      await caseInsensitiveTagNameUniqConstraintMigration.up({ db });

      const tags = await db.select().from(tagsTable).orderBy(tagsTable.id);

      expect(tags).toHaveLength(6);

      expect(tags.at(0)).toMatchObject({ id: 'tag_1', organizationId: 'org_1', name: 'Important', normalizedName: 'important' });
      expect(tags.at(1)).toMatchObject({ id: 'tag_2', organizationId: 'org_1', name: 'IMPORTANT (2)', normalizedName: 'important (2)' });
      expect(tags.at(2)).toMatchObject({ id: 'tag_3', organizationId: 'org_1', name: 'important (3)', normalizedName: 'important (3)' });
      expect(tags.at(4)).toMatchObject({ id: 'tag_5', organizationId: 'org_1', name: 'Work', normalizedName: 'work', description: 'Work related' });

      expect(tags.at(3)).toMatchObject({ id: 'tag_4', organizationId: 'org_2', name: 'Important', normalizedName: 'important' });
      expect(tags.at(5)).toMatchObject({ id: 'tag_6', organizationId: 'org_2', name: 'work', normalizedName: 'work' });
    });

    test('creates unique index on normalized_name and organization_id', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await initialSchemaSetupMigration.up({ db });

      await db.batch([
        db.run(sql`INSERT INTO organizations(id, name, created_at, updated_at) VALUES ('org_1', 'Org 1', 1737936000000, 1737936000000)`),
        db.run(sql`INSERT INTO organizations(id, name, created_at, updated_at) VALUES ('org_2', 'Org 2', 1737936000000, 1737936000000)`),
        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES ('tag_1', 1737936000000, 1737936000000, 'org_1', 'Test', '#ff0000', NULL)`),
      ]);

      await caseInsensitiveTagNameUniqConstraintMigration.up({ db });

      await expect(
        db.run(sql`
          INSERT INTO tags (id, created_at, updated_at, organization_id, name, normalized_name, color)
          VALUES ('tag_2', 1737936000000, 1737936000000, 'org_1', 'TEST', 'test', '#00ff00')
        `),
      ).rejects.toThrow();

      await db.run(sql`
        INSERT INTO tags (id, created_at, updated_at, organization_id, name, normalized_name, color)
        VALUES ('tag_3', 1737936000000, 1737936000000, 'org_2', 'TEST', 'test', '#0000ff')
      `);

      const tags = await db.select().from(tagsTable).orderBy(tagsTable.id);
      expect(tags).toHaveLength(2);

      expect(tags.at(0)).toMatchObject({ id: 'tag_1', name: 'Test', normalizedName: 'test' });
      expect(tags.at(1)).toMatchObject({ id: 'tag_3', name: 'TEST', normalizedName: 'test' });
    });

    test('migration is idempotent - running twice does not break', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await initialSchemaSetupMigration.up({ db });

      await db.batch([
        db.run(sql`INSERT INTO organizations(id, name, created_at, updated_at) VALUES ('org_1', 'Org 1', 1737936000000, 1737936000000)`),
        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES ('tag_1', 1737936000000, 1737936000000, 'org_1', 'Test', '#ff0000', NULL)`),
      ]);

      await caseInsensitiveTagNameUniqConstraintMigration.up({ db });

      const tagsAfterFirst = await db.select().from(tagsTable);
      expect(tagsAfterFirst).toHaveLength(1);
      expect(tagsAfterFirst[0]?.normalizedName).to.eql('test');

      await caseInsensitiveTagNameUniqConstraintMigration.up({ db });

      const tagsAfterSecond = await db.select().from(tagsTable);
      expect(tagsAfterSecond).toHaveLength(1);
      expect(tagsAfterSecond[0]?.normalizedName).to.eql('test');
    });

    test('preserves all existing data during migration', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await initialSchemaSetupMigration.up({ db });

      await db.batch([
        db.run(sql`INSERT INTO organizations(id, name, created_at, updated_at) VALUES ('org_1', 'Org 1', 1737936000000, 1737936000000)`),
        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES ('tag_1', 1737936000000, 1737936000000, 'org_1', 'Tag One', '#ff0000', 'First tag')`),
        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES ('tag_2', 1737936000000, 1737936000000, 'org_1', 'Tag Two', '#00ff00', NULL)`),
      ]);

      await caseInsensitiveTagNameUniqConstraintMigration.up({ db });

      const tags = await db.select().from(tagsTable).orderBy(tagsTable.id);

      expect(tags).to.eql([
        {
          id: 'tag_1',
          createdAt: new Date('2025-01-27'),
          updatedAt: new Date('2025-01-27'),
          organizationId: 'org_1',
          name: 'Tag One',
          normalizedName: 'tag one',
          color: '#ff0000',
          description: 'First tag',
        },
        {
          id: 'tag_2',
          createdAt: new Date('2025-01-27'),
          updatedAt: new Date('2025-01-27'),
          organizationId: 'org_1',
          name: 'Tag Two',
          normalizedName: 'tag two',
          color: '#00ff00',
          description: null,
        },
      ]);
    });

    test('the migration preserves pre-existing relations and foreign keys', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await initialSchemaSetupMigration.up({ db });

      await db.batch([
        db.run(sql`INSERT INTO organizations(id, name, created_at, updated_at) VALUES ('org_1', 'Org 1', 1737936000000, 1737936000000)`),
        db.run(sql`INSERT INTO documents(id, organization_id, original_name, name, mime_type, original_storage_key, original_sha256_hash, content, created_at, updated_at) VALUES
          ('doc1', 'org_1', 'Test Document', 'Test Document', 'text/plain', 'key1', 'hash1', 'This is a sample document content about testing.',0,0),
          ('doc2', 'org_1', 'Another Document', 'Another Document', 'text/plain', 'key2', 'hash2', 'This document discusses database migrations.',0,0)
        `),
        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES 
          ('tag_1', 1737936000000, 1737936000000, 'org_1', 'Tag One', '#ff0000', NULL),
          ('tag_2', 1737936000000, 1737936000000, 'org_1', 'Tag Two', '#00ff00', 'Tag two description')
        `),
        db.run(sql`INSERT INTO documents_tags (document_id, tag_id) VALUES 
          ('doc1', 'tag_1'),
          ('doc1', 'tag_2'),
          ('doc2', 'tag_2')
        `),
      ]);

      expect(
        await db
          .select()
          .from(documentsTagsTable)
          .orderBy(
            asc(documentsTagsTable.documentId),
            asc(documentsTagsTable.tagId),
          ),
      ).to.eql([
        { documentId: 'doc1', tagId: 'tag_1' },
        { documentId: 'doc1', tagId: 'tag_2' },
        { documentId: 'doc2', tagId: 'tag_2' },
      ]);

      await caseInsensitiveTagNameUniqConstraintMigration.up({ db });

      expect(
        await db
          .select()
          .from(documentsTagsTable)
          .orderBy(
            asc(documentsTagsTable.documentId),
            asc(documentsTagsTable.tagId),
          ),
      ).to.eql([
        { documentId: 'doc1', tagId: 'tag_1' },
        { documentId: 'doc1', tagId: 'tag_2' },
        { documentId: 'doc2', tagId: 'tag_2' },
      ]);
    });

    test('if the migration fucks up, the tags can live with their normalized_name empty', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await initialSchemaSetupMigration.up({ db });
      await caseInsensitiveTagNameUniqConstraintMigration.up({ db });

      await db.batch([
        db.run(sql`INSERT INTO organizations(id, name, created_at, updated_at) VALUES ('org_1', 'Org 1', 1737936000000, 1737936000000)`),
        db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, normalized_name, color, description) VALUES 
          ('tag_1', 1737936000000, 1737936000000, 'org_1', 'Tag One', NULL, '#ff0000', NULL),
          ('tag_2', 1737936000000, 1737936000000, 'org_1', 'Tag One', NULL, '#ff0000', NULL)
        `),
      ]);

      const tags = await db.select().from(tagsTable).orderBy(tagsTable.id);

      expect(tags).toHaveLength(2);
      expect(tags.at(0)).toMatchObject({ id: 'tag_1', name: 'Tag One', normalizedName: null });
      expect(tags.at(1)).toMatchObject({ id: 'tag_2', name: 'Tag One', normalizedName: null });
    });

    test('processes tags in batches correctly with pagination', async () => {
      const { db } = setupDatabase({ url: ':memory:' });

      await initialSchemaSetupMigration.up({ db });

      await db.run(sql`INSERT INTO organizations(id, name, created_at, updated_at) VALUES ('org_1', 'Test Org', 1737936000000, 1737936000000)`);

      for (let i = 1; i <= 500; i++) {
        const name = `Tag ${i}`;
        const id = `tag_${i.toString().padStart(4, '0')}`;

        await db.run(sql`INSERT INTO tags (id, created_at, updated_at, organization_id, name, color, description) VALUES 
          (${id}, 1737936000000, 1737936000000, 'org_1', ${name}, '#ff0000', NULL)
        `);
      }

      // Verify all tags are inserted without normalized_name
      const { rows: tagsBeforeMigration } = await db.run(sql`SELECT * FROM tags ORDER BY id`);
      expect(tagsBeforeMigration).toHaveLength(500);
      expect(tagsBeforeMigration.every(tag => isNil(tag.normalizedName))).toBe(true);

      await caseInsensitiveTagNameUniqConstraintMigration.up({ db });

      const tagsAfterMigration = await db.select().from(tagsTable).orderBy(tagsTable.id);
      expect(tagsAfterMigration).toHaveLength(500);

      expect(tagsAfterMigration.every(tag => !isNil(tag.normalizedName))).toBe(true);
    });
  });
});
