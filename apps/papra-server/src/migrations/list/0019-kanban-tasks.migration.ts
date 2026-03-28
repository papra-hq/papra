import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const kanbanTasksMigration = {
  name: 'kanban-tasks',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql`
        CREATE TABLE IF NOT EXISTS "kanban_tasks" (
          "id" text PRIMARY KEY NOT NULL,
          "created_at" integer NOT NULL,
          "updated_at" integer NOT NULL,
          "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "created_by" text REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          "title" text NOT NULL,
          "description" text,
          "status" text NOT NULL DEFAULT 'todo',
          "display_order" integer NOT NULL DEFAULT 0
        )
      `),

      db.run(sql`
        CREATE INDEX IF NOT EXISTS "kanban_tasks_organization_id_status_index"
        ON "kanban_tasks" ("organization_id", "status")
      `),

      db.run(sql`
        CREATE INDEX IF NOT EXISTS "kanban_tasks_organization_id_display_order_index"
        ON "kanban_tasks" ("organization_id", "display_order")
      `),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql`DROP TABLE IF EXISTS "kanban_tasks"`),
    ]);
  },
} satisfies Migration;
