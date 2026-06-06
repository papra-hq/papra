import type { Component } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { createSolidTable, flexRender, getCoreRowModel, getSortedRowModel } from '@tanstack/solid-table';
import { For, Show, Suspense } from 'solid-js';
import { RelativeTime } from '@/modules/i18n/components/RelativeTime';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useCopy } from '@/modules/shared/utils/copy';
import { Button } from '@/modules/ui/components/button';
import { EmptyState } from '@/modules/ui/components/empty';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { ShareLinkActions } from '../components/share-link-actions.component';
import { getShareLinkStatus, ShareLinkStatus } from '../components/share-link-status.component';
import { fetchOrganizationShareLinks } from '../document-share-links.services';

const CopyLink: Component<{ url: string }> = (props) => {
  const { copy, getIsJustCopied } = useCopy();

  return (
    <Button class="group gap-1 cursor-pointer bg-transparent! px-0 text-muted-foreground transition max-w-150px" variant="ghost" onClick={() => copy({ text: props.url })}>
      <span class="truncate max-w-full group-hover:text-foreground transition" title={props.url}>
        {new URL(props.url).pathname}

      </span>

      {getIsJustCopied()
        ? (
            <div class="i-tabler-check size-4 opacity-0 group-hover:opacity-100 transition text-green flex-shrink-0" />
          )
        : (
            <div class="i-tabler-copy size-4 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
          )}

    </Button>
  );
};

export const OrganizationShareLinksPage: Component = () => {
  const params = useParams();
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'share-links'],
    queryFn: () => fetchOrganizationShareLinks({ organizationId: params.organizationId }),
  }));

  const table = createSolidTable({
    get data() {
      return query.data?.shareLinks ?? [];
    },
    columns: [
      {
        header: () => t('document-share-links.management.table.document'),
        accessorKey: 'documentName',
        sortingFn: 'alphanumeric',
        cell: data => (
          <div class="max-w-xs flex items-center gap-2">
            <A
              href={`/organizations/${data.row.original.organizationId}/documents/${data.row.original.documentId}`}
              class="font-medium truncate min-w-0 hover:underline"
              title={data.row.original.documentName}
            >
              {data.row.original.documentName}
            </A>
          </div>
        ),
      },
      {
        header: () => t('document-share-links.management.table.link'),
        accessorKey: 'token',
        sortingFn: 'alphanumeric',
        cell: data => (
          <CopyLink url={data.row.original.url} />
        ),
      },
      {
        id: 'status',
        header: () => t('document-share-links.management.table.status'),
        accessorFn: shareLink => getShareLinkStatus({ shareLink }),
        sortingFn: 'alphanumeric',
        cell: data => (
          <ShareLinkStatus status={data.getValue()} />
        ),
      },
      {
        header: () => t('document-share-links.management.table.security'),
        accessorKey: 'isPasswordProtected',
        sortingFn: 'basic',
        cell: data => (
          data.getValue<boolean>()
            ? (
                <div class="inline-flex items-center gap-1 ">
                  <div class="i-tabler-lock size-4" />
                  {t('document-share-links.management.security.password')}
                </div>
              )
            : (
                <div class="inline-flex items-center gap-1 text-muted-foreground">
                  <div class="i-tabler-lock-open size-4" />
                  {t('document-share-links.management.security.public')}
                </div>
              )
        ),
      },
      {
        header: () => t('document-share-links.management.table.expiry'),
        accessorKey: 'expiresAt',
        sortingFn: 'datetime',
        cell: data => (
          <Show
            when={data.getValue<Date | undefined>()}
            fallback={<span class="text-muted-foreground">{t('document-share-links.management.never')}</span>}
          >
            {getExpiresAt => <RelativeTime date={getExpiresAt()} />}
          </Show>
        ),
      },
      {
        header: () => t('document-share-links.management.table.last-accessed'),
        accessorKey: 'lastAccessedAt',
        sortingFn: 'datetime',
        cell: data => (
          <Show
            when={data.getValue<Date | undefined>()}
            fallback={<span class="text-muted-foreground">{t('document-share-links.management.never')}</span>}
          >
            {getLastAccessedAt => <RelativeTime date={getLastAccessedAt()} />}
          </Show>
        ),
      },
      {
        id: 'actions',
        header: () => <div class="text-right">{t('document-share-links.management.table.actions')}</div>,
        enableSorting: false,
        cell: data => (
          <div class="text-right">
            <ShareLinkActions shareLink={data.row.original} />
          </div>
        ),
      },
    ],
    initialState: {
      sorting: [{ id: 'documentName', desc: false }],
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div class="p-6 mt-4 pb-32 ">
      <Suspense>
        <Show when={query.data?.shareLinks}>
          {getShareLinks => (
            <Show
              when={getShareLinks().length > 0}
              fallback={(
                <EmptyState
                  title={t('document-share-links.management.empty.title')}
                  icon="i-tabler-share"
                  description={t('document-share-links.management.empty.description')}
                />
              )}
            >
              <div class="pb-6">
                <h2 class="text-xl font-bold">{t('document-share-links.management.title')}</h2>
                <p class="text-muted-foreground mt-1">{t('document-share-links.management.description')}</p>
              </div>

              <Table>
                <TableHeader>
                  <For each={table.getHeaderGroups()}>
                    {headerGroup => (
                      <TableRow>
                        <For each={headerGroup.headers}>
                          {header => (
                            <TableHead>
                              <Show
                                when={header.column.getCanSort()}
                                fallback={flexRender(header.column.columnDef.header, header.getContext())}
                              >
                                <button
                                  class="flex items-center gap-1 cursor-pointer select-none"
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  <Show when={header.column.getIsSorted() === 'asc'}>
                                    <div class="i-tabler-arrow-down size-3.5" />
                                  </Show>
                                  <Show when={header.column.getIsSorted() === 'desc'}>
                                    <div class="i-tabler-arrow-up size-3.5" />
                                  </Show>
                                  <Show when={!header.column.getIsSorted()}>
                                    <div class="i-tabler-arrows-sort size-3.5 opacity-40" />
                                  </Show>
                                </button>
                              </Show>
                            </TableHead>
                          )}
                        </For>
                      </TableRow>
                    )}
                  </For>
                </TableHeader>
                <TableBody>
                  <For each={table.getRowModel().rows}>
                    {row => (
                      <TableRow>
                        <For each={row.getVisibleCells()}>
                          {cell => (
                            <TableCell>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          )}
                        </For>
                      </TableRow>
                    )}
                  </For>
                </TableBody>
              </Table>
            </Show>
          )}
        </Show>
      </Suspense>
    </div>
  );
};
