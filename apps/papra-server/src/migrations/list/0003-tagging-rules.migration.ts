import type { Migration } from '../migrations.types';

export const taggingRulesMigration = {
  name: 'tagging-rules',

  up: async ({ db }) => {
    // Create tagging_rules table first (depends on organizations)
    await db.schema
      .createTable('tagging_rules')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('organization_id', 'text', col => col.notNull().references('organizations.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('name', 'text', col => col.notNull())
      .addColumn('description', 'text')
      .addColumn('enabled', 'integer', col => col.notNull().defaultTo(1))
      .execute();

    // Create tagging_rule_conditions table (depends on tagging_rules)
    await db.schema
      .createTable('tagging_rule_conditions')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('tagging_rule_id', 'text', col => col.notNull().references('tagging_rules.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('field', 'text', col => col.notNull())
      .addColumn('operator', 'text', col => col.notNull())
      .addColumn('value', 'text', col => col.notNull())
      .addColumn('is_case_sensitive', 'integer', col => col.notNull().defaultTo(0))
      .execute();

    // Create tagging_rule_actions table (depends on tagging_rules and tags)
    await db.schema
      .createTable('tagging_rule_actions')
      .ifNotExists()
      .addColumn('id', 'text', col => col.primaryKey().notNull())
      .addColumn('created_at', 'integer', col => col.notNull())
      .addColumn('updated_at', 'integer', col => col.notNull())
      .addColumn('tagging_rule_id', 'text', col => col.notNull().references('tagging_rules.id').onDelete('cascade').onUpdate('cascade'))
      .addColumn('tag_id', 'text', col => col.notNull().references('tags.id').onDelete('cascade').onUpdate('cascade'))
      .execute();
  },

  down: async ({ db }) => {
    await db.schema.dropTable('tagging_rule_actions').ifExists().execute();
    await db.schema.dropTable('tagging_rule_conditions').ifExists().execute();
    await db.schema.dropTable('tagging_rules').ifExists().execute();
  },
} satisfies Migration;
