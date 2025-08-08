import { sql } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { setupDatabase } from '../../modules/app/database/database';
import { initialSchemaSetupMigration } from './0001-initial-schema-setup.migration';

describe('0001-initial-schema-setup migration', () => {
  describe('initialSchemaSetupMigration', () => {
    test('the up setup some default tables', async () => {
      const { db } = setupDatabase({ url: ':memory:' });
      await initialSchemaSetupMigration.up({ db });

      const { rows: existingTables } = await db.run(sql`SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'`);

      expect(existingTables.map(({ name }) => name)).to.eql([
        'documents',
        'documents_organization_id_is_deleted_created_at_index',
        'documents_organization_id_is_deleted_index',
        'documents_organization_id_original_sha256_hash_unique',
        'documents_original_sha256_hash_index',
        'documents_organization_id_size_index',
        'organization_invitations',
        'organization_members',
        'organization_members_user_organization_unique',
        'organizations',
        'user_roles',
        'user_roles_role_index',
        'user_roles_user_id_role_unique_index',
        'documents_tags',
        'tags',
        'tags_organization_id_name_unique',
        'users',
        'users_email_unique',
        'users_email_index',
        'auth_accounts',
        'auth_sessions',
        'auth_sessions_token_index',
        'auth_verifications',
        'auth_verifications_identifier_index',
        'intake_emails',
        'intake_emails_email_address_unique',
        'organization_subscriptions',
      ]);

      await initialSchemaSetupMigration.down({ db });

      const { rows: existingTablesAfterDown } = await db.run(sql`SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'`);

      expect(existingTablesAfterDown.map(({ name }) => name)).to.eql([]);
    });
  });
});
