import type { Migration } from '../migrations.types';

export const initialSchemaSetupMigration = {
  name: 'initial-schema-setup',
  description: 'Creation of the base tables for the application',

  up: async ({ db }) => {
    // Create users table first (no dependencies)
    await db.schema
      .createTable('users')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('email', 'text', col => col.notNull())
      .addColumn('email_verified', 'integer', col => col.notNull().defaultTo(0))
      .addColumn('name', 'text')
      .addColumn('image', 'text')
      .addColumn('max_organization_count', 'integer')
      .execute();

    await db.schema
      .createIndex('users_email_unique')
      .unique()
      .ifNotExists()
      .on('users')
      .column('email')
      .execute();

    await db.schema
      .createIndex('users_email_index')
      .ifNotExists()
      .on('users')
      .column('email')
      .execute();

    // Create organizations table (no dependencies)
    await db.schema
      .createTable('organizations')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('name', 'text', col => col.notNull())
      .addColumn('customer_id', 'text')
      .execute();

    // Create organization_members table (depends on users and organizations)
    await db.schema
      .createTable('organization_members')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('organization_id', 'text', col => col.notNull().references('organizations.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('user_id', 'text', col => col.notNull().references('users.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('role', 'text', col => col.notNull())
      .execute();

    await db.schema
      .createIndex('organization_members_user_organization_unique')
      .unique()
      .ifNotExists()
      .on('organization_members')
      .columns(['organization_id', 'user_id'])
      .execute();

    // Create organization_invitations table (depends on users and organizations)
    await db.schema
      .createTable('organization_invitations')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('organization_id', 'text', col => col.notNull().references('organizations.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('email', 'text', col => col.notNull())
      .addColumn('role', 'text')
      .addColumn('status', 'text', col => col.notNull())
      .addColumn('expires_at', 'integer', col => col.notNull())
      .addColumn('inviter_id', 'text', col => col.notNull().references('users.id').onDelete('cascade').onUpdate('cascade'))
      .execute();

    // Create documents table (depends on users and organizations)
    await db.schema
      .createTable('documents')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('is_deleted', 'integer', col => col.notNull().defaultTo(0))
      .addColumn('deleted_at', 'integer')
      .addColumn('organization_id', 'text', col => col.notNull().references('organizations.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('created_by', 'text', col => col.references('users.id').onDelete('set null').onUpdate('cascade'))
      .addColumn('deleted_by', 'text', col => col.references('users.id').onDelete('set null').onUpdate('cascade'))
      .addColumn('original_name', 'text', col => col.notNull())
      .addColumn('original_size', 'integer', col => col.notNull().defaultTo(0))
      .addColumn('original_storage_key', 'text', col => col.notNull())
      .addColumn('original_sha256_hash', 'text', col => col.notNull())
      .addColumn('name', 'text', col => col.notNull())
      .addColumn('mime_type', 'text', col => col.notNull())
      .addColumn('content', 'text', col => col.notNull().defaultTo(''))
      .execute();

    await db.schema
      .createIndex('documents_organization_id_is_deleted_created_at_index')
      .ifNotExists()
      .on('documents')
      .columns(['organization_id', 'is_deleted', 'created_at'])
      .execute();

    await db.schema
      .createIndex('documents_organization_id_is_deleted_index')
      .ifNotExists()
      .on('documents')
      .columns(['organization_id', 'is_deleted'])
      .execute();

    await db.schema
      .createIndex('documents_organization_id_original_sha256_hash_unique')
      .unique()
      .ifNotExists()
      .on('documents')
      .columns(['organization_id', 'original_sha256_hash'])
      .execute();

    await db.schema
      .createIndex('documents_original_sha256_hash_index')
      .ifNotExists()
      .on('documents')
      .column('original_sha256_hash')
      .execute();

    await db.schema
      .createIndex('documents_organization_id_size_index')
      .ifNotExists()
      .on('documents')
      .columns(['organization_id', 'original_size'])
      .execute();

    // Create tags table (depends on organizations)
    await db.schema
      .createTable('tags')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('organization_id', 'text', col => col.notNull().references('organizations.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('name', 'text', col => col.notNull())
      .addColumn('color', 'text', col => col.notNull())
      .addColumn('description', 'text')
      .execute();

    await db.schema
      .createIndex('tags_organization_id_name_unique')
      .unique()
      .ifNotExists()
      .on('tags')
      .columns(['organization_id', 'name'])
      .execute();

    // Create documents_tags junction table (depends on documents and tags)
    await db.schema
      .createTable('documents_tags')
      .ifNotExists()
      .addColumn('document_id', 'text', col => col.notNull().references('documents.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('tag_id', 'text', col => col.notNull().references('tags.id').onDelete('cascade').onUpdate('cascade'))
      .addPrimaryKeyConstraint('documents_tags_pkey', ['document_id', 'tag_id'])
      .execute();

    // Create user_roles table (depends on users)
    await db.schema
      .createTable('user_roles')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('user_id', 'text', col => col.notNull().references('users.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('role', 'text', col => col.notNull())
      .execute();

    await db.schema
      .createIndex('user_roles_role_index')
      .ifNotExists()
      .on('user_roles')
      .column('role')
      .execute();

    await db.schema
      .createIndex('user_roles_user_id_role_unique_index')
      .unique()
      .ifNotExists()
      .on('user_roles')
      .columns(['user_id', 'role'])
      .execute();

    // Create auth_accounts table (depends on users)
    await db.schema
      .createTable('auth_accounts')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('user_id', 'text', col => col.references('users.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('account_id', 'text', col => col.notNull())
      .addColumn('provider_id', 'text', col => col.notNull())
      .addColumn('access_token', 'text')
      .addColumn('refresh_token', 'text')
      .addColumn('access_token_expires_at', 'integer')
      .addColumn('refresh_token_expires_at', 'integer')
      .addColumn('scope', 'text')
      .addColumn('id_token', 'text')
      .addColumn('password', 'text')
      .execute();

    // Create auth_sessions table (depends on users and organizations)
    await db.schema
      .createTable('auth_sessions')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('token', 'text', col => col.notNull())
      .addColumn('user_id', 'text', col => col.references('users.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('expires_at', 'integer', col => col.notNull())
      .addColumn('ip_address', 'text')
      .addColumn('user_agent', 'text')
      .addColumn('active_organization_id', 'text', col => col.references('organizations.id').onDelete('set null').onUpdate('cascade'))
      .execute();

    await db.schema
      .createIndex('auth_sessions_token_index')
      .ifNotExists()
      .on('auth_sessions')
      .column('token')
      .execute();

    // Create auth_verifications table
    await db.schema
      .createTable('auth_verifications')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('identifier', 'text', col => col.notNull())
      .addColumn('value', 'text', col => col.notNull())
      .addColumn('expires_at', 'integer', col => col.notNull())
      .execute();

    await db.schema
      .createIndex('auth_verifications_identifier_index')
      .ifNotExists()
      .on('auth_verifications')
      .column('identifier')
      .execute();

    // Create intake_emails table (depends on organizations)
    await db.schema
      .createTable('intake_emails')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('email_address', 'text', col => col.notNull())
      .addColumn('organization_id', 'text', col => col.notNull().references('organizations.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('allowed_origins', 'text', col => col.notNull().defaultTo('[]'))
      .addColumn('is_enabled', 'integer', col => col.notNull().defaultTo(1))
      .execute();

    await db.schema
      .createIndex('intake_emails_email_address_unique')
      .unique()
      .ifNotExists()
      .on('intake_emails')
      .column('email_address')
      .execute();

    // Create organization_subscriptions table (depends on organizations)
    await db.schema
      .createTable('organization_subscriptions')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('customer_id', 'text', col => col.notNull())
      .addColumn('organization_id', 'text', col => col.notNull().references('organizations.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('plan_id', 'text', col => col.notNull())
      .addColumn('status', 'text', col => col.notNull())
      .addColumn('seats_count', 'integer', col => col.notNull())
      .addColumn('current_period_end', 'integer', col => col.notNull())
      .addColumn('current_period_start', 'integer', col => col.notNull())
      .addColumn('cancel_at_period_end', 'integer', col => col.notNull().defaultTo(0))
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .execute();
  },

  down: async ({ db }) => {
    // Drop tables in reverse order of creation (respecting foreign key constraints)
    await db.schema.dropTable('organization_subscriptions').ifExists().execute();
    await db.schema.dropTable('intake_emails').ifExists().execute();
    await db.schema.dropTable('auth_verifications').ifExists().execute();
    await db.schema.dropTable('auth_sessions').ifExists().execute();
    await db.schema.dropTable('auth_accounts').ifExists().execute();
    await db.schema.dropTable('user_roles').ifExists().execute();
    await db.schema.dropTable('documents_tags').ifExists().execute();
    await db.schema.dropTable('tags').ifExists().execute();
    await db.schema.dropTable('documents').ifExists().execute();
    await db.schema.dropTable('organization_invitations').ifExists().execute();
    await db.schema.dropTable('organization_members').ifExists().execute();
    await db.schema.dropTable('organizations').ifExists().execute();
    await db.schema.dropTable('users').ifExists().execute();

    await db.schema.dropIndex('users_email_unique').ifExists().execute();
    await db.schema.dropIndex('users_email_index').ifExists().execute();
    await db.schema.dropIndex('organization_members_user_organization_unique').ifExists().execute();
    await db.schema.dropIndex('documents_organization_id_is_deleted_created_at_index').ifExists().execute();
    await db.schema.dropIndex('documents_organization_id_is_deleted_index').ifExists().execute();
    await db.schema.dropIndex('documents_organization_id_original_sha256_hash_unique').ifExists().execute();
    await db.schema.dropIndex('documents_original_sha256_hash_index').ifExists().execute();
    await db.schema.dropIndex('documents_organization_id_size_index').ifExists().execute();
    await db.schema.dropIndex('tags_organization_id_name_unique').ifExists().execute();
    await db.schema.dropIndex('user_roles_role_index').ifExists().execute();
    await db.schema.dropIndex('user_roles_user_id_role_unique_index').ifExists().execute();
    await db.schema.dropIndex('auth_sessions_token_index').ifExists().execute();
    await db.schema.dropIndex('auth_verifications_identifier_index').ifExists().execute();
    await db.schema.dropIndex('intake_emails_email_address_unique').ifExists().execute();
  },
} satisfies Migration;
