import type { Database } from '../app/database/database.types';
import { injectArguments, safely } from '@corentinth/chisels';
import { and, desc, eq } from 'drizzle-orm';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { omitUndefined } from '../shared/utils';
import { createViewAlreadyExistsError } from './views.errors';
import { viewsTable } from './views.table';

export type ViewsRepository = ReturnType<typeof createViewsRepository>;

export function createViewsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getOrganizationViews,
      getViewById,
      createView,
      updateView,
      deleteView,
    },
    { db },
  );
}

async function getOrganizationViews({ organizationId, db }: { organizationId: string; db: Database }) {
  const views = await db
    .select()
    .from(viewsTable)
    .where(eq(viewsTable.organizationId, organizationId))
    .orderBy(desc(viewsTable.createdAt));

  return { views };
}

async function getViewById({ viewId, organizationId, db }: { viewId: string; organizationId: string; db: Database }) {
  const [view] = await db
    .select()
    .from(viewsTable)
    .where(
      and(
        eq(viewsTable.id, viewId),
        eq(viewsTable.organizationId, organizationId),
      ),
    );

  return { view };
}

async function createView({ view, db }: { view: { name: string; query: string; organizationId: string }; db: Database }) {
  const [result, error] = await safely(
    db.insert(viewsTable).values(view).returning(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createViewAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [createdView] = result;
  return { view: createdView };
}

async function updateView({ viewId, name, query, db }: { viewId: string; name?: string; query?: string; db: Database }) {
  const [result, error] = await safely(
    db
      .update(viewsTable)
      .set(omitUndefined({ name, query }))
      .where(eq(viewsTable.id, viewId))
      .returning(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createViewAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [view] = result;
  return { view };
}

async function deleteView({ viewId, db }: { viewId: string; db: Database }) {
  await db.delete(viewsTable).where(eq(viewsTable.id, viewId));
}
