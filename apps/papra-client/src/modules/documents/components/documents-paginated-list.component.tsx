import type { TooltipTriggerProps } from '@kobalte/core/tooltip';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';
import { formatBytes } from '@corentinth/chisels';
import { A } from '@solidjs/router';
import { createQuery, keepPreviousData } from '@tanstack/solid-query';
import { createSolidTable, flexRender, getCoreRowModel, getPaginationRowModel } from '@tanstack/solid-table';
import { type Component, createSignal, For, Match, Show, Switch } from 'solid-js';
import { getDocumentIcon } from '../document.models';
import { fetchOrganizationDocuments } from '../documents.services';
import { DocumentManagementDropdown } from './document-management-dropdown.component';

export const DocumentsPaginatedList: Component<{ organizationId: string }> = (props) => {
  const [getPagination, setPagination] = createSignal({ pageIndex: 0, pageSize: 100 });

  const query = createQuery(() => ({
    queryKey: ['organizations', props.organizationId, 'documents', getPagination()],
    queryFn: () => fetchOrganizationDocuments({
      organizationId: props.organizationId,
      ...getPagination(),
    }),
    placeholderData: keepPreviousData,
  }));

  const table = createSolidTable({
    get data() {
      return query.data?.documents ?? [];
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
                href={`/organizations/${props.organizationId}/documents/${data.row.original.id}`}
                class="font-bold truncate block hover:underline"
              >
                {data.row.original.name.split('.').shift()}
              </A>

              <div class="text-xs text-muted-foreground lh-tight">
                {formatBytes({ bytes: data.row.original.originalSize, base: 1000 })}
                {' '}
                -
                {' '}
                {data.row.original.name.split('.').pop()?.toUpperCase()}
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
      {
        header: 'Created at',
        accessorKey: 'createdAt',
        cell: data => <div class="text-muted-foreground" title={data.getValue<Date>().toLocaleString()}>{timeAgo({ date: data.getValue<Date>() })}</div>,
      },
      {
        header: 'Actions',
        cell: data => (
          <div class="flex items-center justify-end">
            <DocumentManagementDropdown documentId={data.row.original.id} organizationId={props.organizationId} />
          </div>
        ),
      },
    ],
    get rowCount() {
      return query.data?.documentsCount;
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      get pagination() {
        return getPagination();
      },
    },
    manualPagination: true,

  });

  return (
    <div>
      <Switch>
        <Match when={query.data?.documentsCount === 0}>
          <p>No documents found</p>
        </Match>
        <Match when={query.isError}>
          <p>
            Error:
            {query.error?.message}
          </p>
        </Match>
        <Match when={query.isSuccess}>
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
        </Match>
      </Switch>
    </div>
  );
};
