import type { Component } from 'solid-js';
import type { CustomPropertyType } from '../custom-properties.types';
import { A, useParams } from '@solidjs/router';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createSolidTable, flexRender, getCoreRowModel, getSortedRowModel } from '@tanstack/solid-table';
import { For, Show, Suspense } from 'solid-js';
import { RelativeTime } from '@/modules/i18n/components/RelativeTime';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { EmptyState } from '@/modules/ui/components/empty';
import { createToast } from '@/modules/ui/components/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { PROPERTY_TYPE_LABEL_I18N_KEYS } from '../custom-properties.constants';
import {
  deleteCustomPropertyDefinition,
  fetchCustomPropertyDefinitions,
} from '../custom-properties.services';

const TYPE_ICON: Record<CustomPropertyType, string> = {
  text: 'i-tabler-text-size',
  number: 'i-tabler-123',
  date: 'i-tabler-calendar',
  boolean: 'i-tabler-toggle-left',
  select: 'i-tabler-list',
  multi_select: 'i-tabler-list-check',
  user_relation: 'i-tabler-user',
  document_relation: 'i-tabler-file-symlink',
};

export const DeleteCustomPropertyButton: Component<{ organizationId: string; propertyDefinitionId: string; propertyDefinitionName: string }> = (props) => {
  const { confirm } = useConfirmModal();
  const { t } = useI18n();

  const deleteMutation = useMutation(() => ({
    mutationFn: async () => {
      await deleteCustomPropertyDefinition({ organizationId: props.organizationId, propertyDefinitionId: props.propertyDefinitionId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', props.organizationId, 'custom-properties'] });

      createToast({
        message: t('custom-properties.list.delete.success'),
        type: 'success',
      });
    },
    onError: () => {
      createToast({
        message: t('custom-properties.list.delete.error'),
        type: 'error',
      });
    },
  }));

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: t('custom-properties.list.delete.confirm-title'),
      message: t('custom-properties.list.delete.confirm-message', { name: props.propertyDefinitionName }),
      confirmButton: {
        text: t('custom-properties.list.delete.confirm-button'),
        variant: 'destructive',
      },
    });

    if (isConfirmed) {
      deleteMutation.mutate();
    }
  };

  return (
    <Button size="icon" variant="outline" class="size-7 text-red" onClick={handleDelete} disabled={deleteMutation.isPending} aria-label={`Delete custom property ${props.propertyDefinitionName}`}>
      <div class="i-tabler-trash size-4" />
    </Button>
  );
};

export const CustomPropertiesPage: Component = () => {
  const params = useParams();
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'custom-properties'],
    queryFn: () => fetchCustomPropertyDefinitions({ organizationId: params.organizationId }),
  }));

  const table = createSolidTable({
    get data() {
      return query.data?.propertyDefinitions ?? [];
    },
    columns: [
      {
        header: () => t('custom-properties.list.table.name'),
        accessorKey: 'name',
        sortingFn: 'alphanumeric',
        cell: data => (
          <A href={`/organizations/${params.organizationId}/custom-properties/${data.row.original.id}`} class="font-medium hover:underline">{data.getValue<string>()}</A>
        ),
      },
      {
        header: () => t('custom-properties.list.table.type'),
        accessorKey: 'type',
        sortingFn: 'alphanumeric',
        cell: (data) => {
          const type = data.getValue<CustomPropertyType>();
          return (
            <div class="flex items-center gap-1.5 w-fit px-2 py-0.5 rounded bg-muted text-xs font-medium">
              <div class={`${TYPE_ICON[type]} size-3.5 text-muted-foreground`} />
              {t(PROPERTY_TYPE_LABEL_I18N_KEYS[type])}
            </div>
          );
        },
      },
      {
        header: () => t('custom-properties.list.table.description'),
        accessorKey: 'description',
        sortingFn: 'alphanumeric',
        cell: data => (
          <span class="text-wrap">
            {data.getValue<string | null>() || <span class="text-muted-foreground">{t('custom-properties.list.table.no-description')}</span>}
          </span>
        ),
      },
      {
        header: () => t('custom-properties.list.table.created'),
        accessorKey: 'createdAt',
        sortingFn: 'datetime',
        cell: data => (
          <RelativeTime class="text-muted-foreground" date={data.getValue<Date>()} />
        ),
      },
      {
        id: 'actions',
        header: () => <span class="text-right">{t('custom-properties.list.table.actions')}</span>,
        cell: data => (
          <div class="flex gap-2 justify-end">
            <Button
              as={A}
              href={`/organizations/${params.organizationId}/custom-properties/${data.row.original.id}`}
              size="icon"
              variant="outline"
              class="size-7"
              aria-label={`Edit custom property ${data.row.original.name}`}
            >
              <div class="i-tabler-pencil size-4" />
            </Button>
            <DeleteCustomPropertyButton
              organizationId={params.organizationId}
              propertyDefinitionId={data.row.original.id}
              propertyDefinitionName={data.row.original.name}
            />
          </div>
        ),
      },
    ],
    initialState: {
      sorting: [{ id: 'name', desc: false }],
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div class="p-6 mt-4 pb-32 mx-auto max-w-5xl">
      <Suspense>
        <Show when={query.data?.propertyDefinitions}>
          {getPropertyDefinitions => (
            <Show
              when={getPropertyDefinitions().length > 0}
              fallback={(
                <EmptyState
                  title={t('custom-properties.list.empty.title')}
                  icon="i-tabler-forms"
                  description={t('custom-properties.list.empty.description')}
                  cta={(
                    <Button as={A} href={`/organizations/${params.organizationId}/custom-properties/create`}>
                      <div class="i-tabler-plus size-4 mr-2" />
                      {t('custom-properties.list.create-button')}
                    </Button>
                  )}
                />
              )}
            >
              <div class="flex justify-between sm:items-center pb-6 gap-4 flex-col sm:flex-row">
                <div>
                  <h2 class="text-xl font-bold">
                    {t('custom-properties.list.title')}
                  </h2>

                  <p class="text-muted-foreground mt-1">
                    {t('custom-properties.list.description')}
                  </p>
                </div>

                <div class="flex-shrink-0">
                  <Button as={A} href={`/organizations/${params.organizationId}/custom-properties/create`} class="w-full">
                    <div class="i-tabler-plus size-4 mr-2" />
                    {t('custom-properties.list.create-button')}
                  </Button>
                </div>
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
