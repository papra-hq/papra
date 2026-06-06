import type { Database } from '../app/database/database.types';
import type { DbInsertableShareLink } from './document-share-links.types';
import { injectArguments } from '@corentinth/chisels';
import { and, count, desc, eq, getTableColumns } from 'drizzle-orm';
import { documentsTable } from '../documents/documents.table';
import { createError } from '../shared/errors/errors';
import { omitUndefined } from '../shared/objects';
import { isNil } from '../shared/utils';
import { createShareLinkNotFoundError } from './document-share-links.errors';
import { documentShareLinksTable } from './document-share-links.table';

export type ShareLinksRepository = ReturnType<typeof createShareLinksRepository>;

export function createShareLinksRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      createShareLink,
      getShareLinkByToken,
      getShareLinkById,
      getDocumentShareLinks,
      getOrganizationShareLinks,
      countDocumentShareLinks,
      updateShareLink,
      deleteShareLink,
      touchLastAccessedAt,
    },
    { db },
  );
}

async function createShareLink({ db, ...shareLinkToInsert }: { db: Database } & DbInsertableShareLink) {
  const [shareLink] = await db.insert(documentShareLinksTable).values(shareLinkToInsert).returning();

  if (isNil(shareLink)) {
    // shouldn't happen because of the returning, but for type safety

    throw createError({
      message: 'Error while creating share link',
      code: 'share_link.save_error',
      statusCode: 500,
      isInternal: true,
    });
  }

  return { shareLink };
}

async function getShareLinkByToken({ token, db }: { token: string; db: Database }) {
  const [shareLink] = await db
    .select()
    .from(documentShareLinksTable)
    .where(eq(documentShareLinksTable.token, token));

  return { shareLink };
}

async function getShareLinkById({ shareLinkId, organizationId, db }: { shareLinkId: string; organizationId: string; db: Database }) {
  const [shareLink] = await db
    .select()
    .from(documentShareLinksTable)
    .where(
      and(
        eq(documentShareLinksTable.id, shareLinkId),
        eq(documentShareLinksTable.organizationId, organizationId),
      ),
    );

  return { shareLink };
}

async function getDocumentShareLinks({ documentId, organizationId, db }: { documentId: string; organizationId: string; db: Database }) {
  const shareLinks = await db
    .select()
    .from(documentShareLinksTable)
    .where(
      and(
        eq(documentShareLinksTable.documentId, documentId),
        eq(documentShareLinksTable.organizationId, organizationId),
      ),
    )
    .orderBy(desc(documentShareLinksTable.createdAt));

  return { shareLinks };
}

async function getOrganizationShareLinks({ organizationId, db }: { organizationId: string; db: Database }) {
  // Joins the document name (and trashed state) so the management UI can display it without a second round-trip.
  const shareLinks = await db
    .select({ ...getTableColumns(documentShareLinksTable), documentName: documentsTable.name, isDocumentDeleted: documentsTable.isDeleted })
    .from(documentShareLinksTable)
    .innerJoin(documentsTable, eq(documentShareLinksTable.documentId, documentsTable.id))
    .where(eq(documentShareLinksTable.organizationId, organizationId))
    .orderBy(desc(documentShareLinksTable.createdAt));

  return { shareLinks };
}

async function countDocumentShareLinks({ documentId, organizationId, db }: { documentId: string; organizationId: string; db: Database }) {
  const [record] = await db
    .select({ shareLinksCount: count(documentShareLinksTable.id) })
    .from(documentShareLinksTable)
    .where(
      and(
        eq(documentShareLinksTable.documentId, documentId),
        eq(documentShareLinksTable.organizationId, organizationId),
      ),
    );

  return { shareLinksCount: record?.shareLinksCount ?? 0 };
}

async function updateShareLink({
  shareLinkId,
  organizationId,
  expiresAt,
  passwordHash,
  isEnabled,
  db,
}: {
  shareLinkId: string;
  organizationId: string;
  expiresAt?: Date | null;
  passwordHash?: string | null;
  isEnabled?: boolean;
  db: Database;
}) {
  const [shareLink] = await db
    .update(documentShareLinksTable)
    .set({ ...omitUndefined({ expiresAt, passwordHash, isEnabled }), updatedAt: new Date() })
    .where(
      and(
        eq(documentShareLinksTable.id, shareLinkId),
        eq(documentShareLinksTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (isNil(shareLink)) {
    throw createShareLinkNotFoundError();
  }

  return { shareLink };
}

async function deleteShareLink({ shareLinkId, organizationId, db }: { shareLinkId: string; organizationId: string; db: Database }) {
  const deleted = await db
    .delete(documentShareLinksTable)
    .where(
      and(
        eq(documentShareLinksTable.id, shareLinkId),
        eq(documentShareLinksTable.organizationId, organizationId),
      ),
    )
    .returning({ id: documentShareLinksTable.id });

  if (deleted.length === 0) {
    throw createShareLinkNotFoundError();
  }
}

async function touchLastAccessedAt({ shareLinkId, lastAccessedAt, db }: { shareLinkId: string; lastAccessedAt: Date; db: Database }) {
  await db
    .update(documentShareLinksTable)
    .set({ lastAccessedAt })
    .where(eq(documentShareLinksTable.id, shareLinkId));
}
