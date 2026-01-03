import type { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { createSolidTable, flexRender, getCoreRowModel, getPaginationRowModel } from '@tanstack/solid-table';
import { createSignal, For, Show } from 'solid-js';
import { RelativeTime } from '@/modules/i18n/components/RelativeTime';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { TextField, TextFieldRoot } from '@/modules/ui/components/textfield';
import { listOrganizations } from '../organizations.services';

export const AdminListOrganizationsPage: Component = () => {
  const { t } = useI18n();
  const [search, setSearch] = createSignal('');
  const [pagination, setPagination] = createSignal({ pageIndex: 0, pageSize: 25 });

  const query = useQuery(() => ({
    queryKey: ['admin', 'organizations', search(), pagination()],
    queryFn: () => listOrganizations({
      search: search() || undefined,
      pageIndex: pagination().pageIndex,
      pageSize: pagination().pageSize,
    }),
  }));

  const table = createSolidTable({
    get data() {
      return query.data?.organizations ?? [];
    },
    columns: [
      {
        header: t('admin.organizations.table.id'),
        accessorKey: 'id',
        cell: data => (
          <A
            href={`/admin/organizations/${data.getValue<string>()}`}
            class="font-mono hover:underline text-primary"
          >
            {data.getValue<string>()}
          </A>
        ),
      },
      {
        header: t('admin.organizations.table.name'),
        accessorKey: 'name',
        cell: data => (
          <div class="font-medium">
            {data.getValue<string>()}
          </div>
        ),
      },
      {
        header: t('admin.organizations.table.members'),
        accessorKey: 'memberCount',
        cell: data => (
          <div class="text-center">
            {data.getValue<number>()}
          </div>
        ),
      },
      {
        header: t('admin.organizations.table.created'),
        accessorKey: 'createdAt',
        cell: data => <RelativeTime class="text-muted-foreground text-sm" date={new Date(data.getValue<string>())} />,
      },
      {
        header: t('admin.organizations.table.updated'),
        accessorKey: 'updatedAt',
        cell: data => <RelativeTime class="text-muted-foreground text-sm" date={new Date(data.getValue<string>())} />,
      },
    ],
    get rowCount() {
      return query.data?.totalCount ?? 0;
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      get pagination() {
        return pagination();
      },
    },
    manualPagination: true,
  });

  const handleSearch = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setSearch(target.value);
    setPagination({ pageIndex: 0, pageSize: pagination().pageSize });
  };

  return (
    <div class="p-6">
      <div class="border-b mb-6 pb-4">
        <h1 class="text-xl font-bold mb-1">
          {t('admin.organizations.title')}
        </h1>
        <p class="text-sm text-muted-foreground">
          {t('admin.organizations.description')}
        </p>
      </div>

      <div class="mb-4">
        <TextFieldRoot class="max-w-sm">
          <TextField
            type="text"
            placeholder={t('admin.organizations.search-placeholder')}
            value={search()}
            onInput={handleSearch}
          />
        </TextFieldRoot>
      </div>

      <Show
        when={!query.isLoading}
        fallback={<div class="text-center py-8 text-muted-foreground">{t('admin.organizations.loading')}</div>}
      >
        <Show
          when={(query.data?.organizations.length ?? 0) > 0}
          fallback={(
            <div class="text-center py-8 text-muted-foreground">
              {search() ? t('admin.organizations.no-results') : t('admin.organizations.empty')}
            </div>
          )}
        >
          <div class="border-y">
            <Table>
              <TableHeader>
                <For each={table.getHeaderGroups()}>
                  {headerGroup => (
                    <TableRow>
                      <For each={headerGroup.headers}>
                        {header => (
                          <TableHead>
                            {flexRender(header.column.columnDef.header, header.getContext())}
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
          </div>

          <div class="flex items-center justify-between mt-4">
            <div class="text-sm text-muted-foreground">
              {t('admin.organizations.pagination.info', {
                start: table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1,
                end: Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, query.data?.totalCount ?? 0),
                total: query.data?.totalCount ?? 0,
              })}
            </div>
            <div class="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                class="size-8"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <div class="size-4 i-tabler-chevrons-left" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <div class="size-4 i-tabler-chevron-left" />
              </Button>
              <div class="text-sm whitespace-nowrap">
                {t('admin.organizations.pagination.page-info', {
                  current: table.getState().pagination.pageIndex + 1,
                  total: table.getPageCount(),
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                class="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <div class="size-4 i-tabler-chevron-right" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="size-8"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <div class="size-4 i-tabler-chevrons-right" />
              </Button>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default AdminListOrganizationsPage;
