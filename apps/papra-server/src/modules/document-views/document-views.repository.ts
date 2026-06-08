import type { Database } from '../app/database/database.types';
import { injectArguments, safely } from '@corentinth/chisels';
import { and, desc, eq } from 'drizzle-orm';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { omitUndefined } from '../shared/objects';
import { createDocumentViewAlreadyExistsError } from './document-views.errors';
import { documentViewsTable } from './document-views.table';

export type DocumentViewsRepository = ReturnType<typeof createDocumentViewsRepository>;

export function createDocumentViewsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getOrganizationDocumentViews,
      getDocumentViewById,
      createDocumentView,
      updateDocumentView,
      deleteDocumentView,
    },
    { db },
  );
}

async function getOrganizationDocumentViews({
  organizationId,
  db,
}: {
  organizationId: string;
  db: Database;
}) {
  const documentViews = await db
    .select()
    .from(documentViewsTable)
    .where(eq(documentViewsTable.organizationId, organizationId))
    .orderBy(desc(documentViewsTable.createdAt));

  return { documentViews };
}

async function getDocumentViewById({
  documentViewId,
  organizationId,
  db,
}: {
  documentViewId: string;
  organizationId: string;
  db: Database;
}) {
  const [documentView] = await db
    .select()
    .from(documentViewsTable)
    .where(
      and(
        eq(documentViewsTable.id, documentViewId),
        eq(documentViewsTable.organizationId, organizationId),
      ),
    );

  return { documentView };
}

async function createDocumentView({
  documentView,
  db,
}: {
  documentView: {
    name: string;
    query: string;
    description?: string | null;
    organizationId: string;
  };
  db: Database;
}) {
  const [result, error] = await safely(
    db.insert(documentViewsTable).values(documentView).returning(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createDocumentViewAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [createdDocumentView] = result;
  return { documentView: createdDocumentView };
}

async function updateDocumentView({
  documentViewId,
  name,
  query,
  description,
  db,
}: {
  documentViewId: string;
  name?: string;
  query?: string;
  description?: string | null;
  db: Database;
}) {
  const [result, error] = await safely(
    db
      .update(documentViewsTable)
      .set(omitUndefined({ name, query, description }))
      .where(eq(documentViewsTable.id, documentViewId))
      .returning(),
  );

  if (isUniqueConstraintError({ error })) {
    throw createDocumentViewAlreadyExistsError();
  }

  if (error) {
    throw error;
  }

  const [documentView] = result;
  return { documentView };
}

async function deleteDocumentView({
  documentViewId,
  db,
}: {
  documentViewId: string;
  db: Database;
}) {
  await db.delete(documentViewsTable).where(eq(documentViewsTable.id, documentViewId));
}
