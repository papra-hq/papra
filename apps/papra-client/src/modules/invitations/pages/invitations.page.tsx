import type { Component } from 'solid-js';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createSolidTable, flexRender, getCoreRowModel, getPaginationRowModel } from '@tanstack/solid-table';
import { For, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { EmptyState } from '@/modules/ui/components/empty';
import { createToast } from '@/modules/ui/components/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { acceptInvitation, fetchInvitations, rejectInvitation } from '../invitations.services';

export const InvitationsPage: Component = () => {
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['invitations'],
    queryFn: fetchInvitations,
  }));

  const acceptInvitationMutation = useMutation(() => ({
    mutationFn: acceptInvitation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invitations'] });
      await queryClient.invalidateQueries({ queryKey: ['organizations'] });

      createToast({
        message: t('invitations.list.actions.accept.success.message'),
        description: t('invitations.list.actions.accept.success.description'),
      });
    },
  }));

  const rejectInvitationMutation = useMutation(() => ({
    mutationFn: rejectInvitation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invitations'] });

      createToast({
        message: t('invitations.list.actions.reject.success.message'),
        description: t('invitations.list.actions.reject.success.description'),
      });
    },
  }));

  const table = createSolidTable({
    get data() {
      return query.data?.invitations ?? [];
    },
    columns: [
      {
        header: t('invitations.list.headers.organization'),
        accessorKey: 'organization.name',
      },
      {
        header: t('invitations.list.headers.created'),
        accessorKey: 'createdAt',
        cell: data => <time dateTime={data.getValue()}>{timeAgo({ date: data.getValue() })}</time>,
      },
      {
        header: () => <div class="text-right">{t('invitations.list.headers.actions')}</div>,
        id: 'actions',
        cell: data => (
          <div class="flex items-center justify-end gap-2">
            <Button size="sm" onClick={() => acceptInvitationMutation.mutate({ invitationId: data.row.original.id })}>
              {t('invitations.list.actions.accept')}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => rejectInvitationMutation.mutate({ invitationId: data.row.original.id })}>
              {t('invitations.list.actions.reject')}
            </Button>
          </div>
        ),
      },
    ],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  return (
    <div class="p-6 mt-12 pb-32 mx-auto max-w-xl w-full">
      <div class="border-b pb-4 mb-6">
        <h1 class="text-2xl font-semibold mb-1">{t('invitations.list.title')}</h1>
        <p class="text-muted-foreground">{t('invitations.list.description')}</p>
      </div>

      <Show when={query.data?.invitations.length} fallback={<EmptyState title={t('invitations.list.empty.title')} icon="i-tabler-mail" description={t('invitations.list.empty.description')} />}>
        <Table>
          <TableHeader>
            <For each={table.getHeaderGroups()}>
              {headerGroup => (
                <TableRow>
                  <For each={headerGroup.headers}>{header => <TableHead>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>}</For>
                </TableRow>
              )}
            </For>
          </TableHeader>
          <TableBody>
            <For each={table.getRowModel().rows}>
              {row => <TableRow>{row.getVisibleCells().map(cell => <TableCell>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>}
            </For>
          </TableBody>
        </Table>
      </Show>
    </div>
  );
};
