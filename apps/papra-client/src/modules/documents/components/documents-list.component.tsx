import type { Tag } from '@/modules/tags/tags.types';
import type { TooltipTriggerProps } from '@kobalte/core/tooltip';
import type { ColumnDef } from '@tanstack/solid-table';
import type { Document } from '../documents.types';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { cn } from '@/modules/shared/style/cn';
import { TagLink } from '@/modules/tags/components/tag.component';
import { Button } from '@/modules/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';
import { formatBytes } from '@corentinth/chisels';
import { A } from '@solidjs/router';
import { createSolidTable, flexRender, getCoreRowModel, getPaginationRowModel } from '@tanstack/solid-table';
import { type Accessor, type Component, For, Match, type Setter, Show, Switch } from 'solid-js';
import { getDocumentIcon, getDocumentNameExtension, getDocumentNameWithoutExtension } from '../document.models';
import { DocumentManagementDropdown } from './document-management-dropdown.component';

type Pagination = {
  pageIndex: number;
  pageSize: number;
};

export const createdAtColumn: ColumnDef<Document> = {
  header: () => (<span class="hidden sm:block">Created at</span>),
  accessorKey: 'createdAt',
  cell: data => <div class="text-muted-foreground hidden sm:block" title={data.getValue<Date>().toLocaleString()}>{timeAgo({ date: data.getValue<Date>() })}</div>,
};

export const deletedAtColumn: ColumnDef<Document> = {
  header: () => (<span class="hidden sm:block">Deleted at</span>),
  accessorKey: 'deletedAt',
  cell: data => <div class="text-muted-foreground hidden sm:block" title={data.getValue<Date>().toLocaleString()}>{timeAgo({ date: data.getValue<Date>() })}</div>,
};

export const standardActionsColumn: ColumnDef<Document> = {
  header: () => (<span class="block text-right">Actions</span>),
  id: 'actions',
  cell: data => (
    <div class="flex items-center justify-end">
      <DocumentManagementDropdown document={data.row.original} />
    </div>
  ),
};

export const tagsColumn: ColumnDef<Document> = {
  header: () => (<span class="hidden sm:block">Tags</span>),
  accessorKey: 'tags',
  cell: data => (
    <div class="text-muted-foreground hidden sm:flex flex-wrap gap-1">
      <For each={data.getValue<Tag[]>()}>
        {tag => (
          <TagLink {...tag} class="text-xs" />
        )}
      </For>
    </div>
  ),
};

export const DocumentsPaginatedList: Component<{
  documents: Document[];
  documentsCount: number;
  getPagination?: Accessor<Pagination>;
  setPagination?: Setter<Pagination>;
  extraColumns?: ColumnDef<Document>[];
  showPagination?: boolean;
}> = (props) => {
  const table = createSolidTable({
    get data() {
      return props.documents ?? [];
    },
    columns: [
      {
        header: 'File name',
        cell: data => (
          <div class="overflow-hidden flex gap-4 items-center">
            <div class="bg-muted flex items-center justify-center p-2 rounded-lg">
              <div class={cn(getDocumentIcon({ document: data.row.original }), 'size-6 text-primary')}></div>
            </div>

            <div class="flex-1 flex flex-col gap-1 truncate">
              <A
                href={`/organizations/${data.row.original.organizationId}/documents/${data.row.original.id}`}
                class="font-bold truncate block hover:underline"
              >
                {getDocumentNameWithoutExtension({ name: data.row.original.name })}
              </A>

              <div class="text-xs text-muted-foreground lh-tight">
                {[formatBytes({ bytes: data.row.original.originalSize, base: 1000 }), getDocumentNameExtension({ name: data.row.original.name })].filter(Boolean).join(' - ')}
                {' '}
                -
                {' '}
                <Tooltip>
                  <TooltipTrigger as={(tooltipProps: TooltipTriggerProps) => (
                    <span {...tooltipProps}>
                      {timeAgo({ date: data.row.original.createdAt })}
                    </span>
                  )}
                  />
                  <TooltipContent>
                    {data.row.original.createdAt.toLocaleString()}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

        ),
      },
      // {
      //   header: () => (<span class="hidden sm:block">Created at</span>),
      //   accessorKey: 'createdAt',
      //   cell: data => <div class="text-muted-foreground hidden sm:block" title={data.getValue<Date>().toLocaleString()}>{timeAgo({ date: data.getValue<Date>() })}</div>,
      // },
      // {
      //   header: () => (<span class="block text-right">Actions</span>),
      //   id: 'actions',
      //   cell: data => (
      //     <div class="flex items-center justify-end">
      //       <DocumentManagementDropdown documentId={data.row.original.id} organizationId={data.row.original.organizationId} />
      //     </div>
      //   ),
      // },

      ...(props.extraColumns ?? []),
    ],
    get rowCount() {
      return props.documentsCount;
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: props.setPagination,
    state: {
      get pagination() {
        return props.getPagination?.();
      },
    },
    manualPagination: true,

  });

  return (
    <div>
      <Switch>
        <Match when={props.documentsCount > 0}>
          <Table>

            <TableHeader>
              <For each={table.getHeaderGroups()}>
                {headerGroup => (
                  <TableRow>
                    <For each={headerGroup.headers}>
                      {(header) => {
                        return (
                          <TableHead>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        );
                      }}
                    </For>
                  </TableRow>
                )}
              </For>
            </TableHeader>

            <TableBody>
              <Show when={table.getRowModel().rows?.length}>
                <For each={table.getRowModel().rows}>
                  {row => (
                    <TableRow data-state={row.getIsSelected() && 'selected'}>
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
              </Show>
            </TableBody>

          </Table>

          <Show when={props.showPagination ?? true}>
            <div class="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-end mt-4">
              <div class="flex items-center space-x-2">
                <p class="whitespace-nowrap text-sm font-medium">Rows per page</p>
                <Select
                  value={table.getState().pagination.pageSize}
                  onChange={value => value && table.setPageSize(value)}
                  options={[15, 50, 100]}
                  itemComponent={props => (
                    <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
                  )}
                >
                  <SelectTrigger class="h-8 w-[4.5rem]">
                    <SelectValue<string>>
                      {state => state.selectedOption()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
              <div class="flex items-center justify-center whitespace-nowrap text-sm font-medium">
                Page
                {' '}
                {table.getState().pagination.pageIndex + 1}
                {' '}
                of
                {' '}
                {table.getPageCount()}
              </div>
              <div class="flex items-center space-x-2">
                <Button
                  aria-label="Go to first page"
                  variant="outline"
                  class="flex size-8 p-0"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <div class="size-4 i-tabler-chevrons-left" />
                </Button>
                <Button
                  aria-label="Go to previous page"
                  variant="outline"
                  size="icon"
                  class="size-8"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <div class="size-4 i-tabler-chevron-left" />
                </Button>
                <Button
                  aria-label="Go to next page"
                  variant="outline"
                  size="icon"
                  class="size-8"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <div class="size-4 i-tabler-chevron-right" />
                </Button>
                <Button
                  aria-label="Go to last page"
                  variant="outline"
                  size="icon"
                  class="flex size-8"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <div class="size-4 i-tabler-chevrons-right" />
                </Button>
              </div>
            </div>
          </Show>
        </Match>
      </Switch>
    </div>
  );
};
