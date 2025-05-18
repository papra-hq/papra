import type { Component } from 'solid-js';
import type { OrganizationMemberRole } from '../organizations.types';
import { A, useParams } from '@solidjs/router';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { createSolidTable, flexRender, getCoreRowModel, getPaginationRowModel } from '@tanstack/solid-table';
import { For } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/modules/ui/components/dropdown-menu';
import { createToast } from '@/modules/ui/components/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { ORGANIZATION_ROLES } from '../organizations.constants';
import { fetchOrganizationMembers, removeOrganizationMember } from '../organizations.services';

const MemberList: Component = () => {
  const params = useParams();
  const { t } = useI18n();
  const { confirm } = useConfirmModal();
  const query = createQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'members'],
    queryFn: () => fetchOrganizationMembers({ organizationId: params.organizationId }),
  }));

  const removeMemberMutation = createMutation(() => ({
    mutationFn: ({ memberId }: { memberId: string }) => removeOrganizationMember({ organizationId: params.organizationId, memberId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', params.organizationId, 'members'] });

      createToast({
        message: t('organizations.members.delete.success'),
      });
    },
  }));

  const handleDelete = async ({ memberId }: { memberId: string }) => {
    const confirmed = await confirm({
      title: t('organizations.members.delete.confirm.title'),
      message: t('organizations.members.delete.confirm.message'),
      confirmButton: {
        text: t('organizations.members.delete.confirm.confirm-button'),
        variant: 'destructive',
      },
      cancelButton: {
        text: t('organizations.members.delete.confirm.cancel-button'),
      },
    });

    if (!confirmed) {
      return;
    }

    removeMemberMutation.mutate({ memberId });
  };

  const table = createSolidTable({
    get data() {
      return query.data?.members ?? [];
    },
    columns: [
      { header: 'Name', accessorKey: 'user.name' },
      { header: 'Email', accessorKey: 'user.email' },
      { header: 'Role', accessorKey: 'role', cell: data => t(`organizations.members.roles.${data.getValue<OrganizationMemberRole>()}`) },
      { header: 'Actions', id: 'actions', cell: data => (
        <div class="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger as={Button} variant="ghost" size="icon">
              <div class="i-tabler-dots-vertical size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => handleDelete({ memberId: data.row.original.id })}
                disabled={data.row.original.role === ORGANIZATION_ROLES.OWNER}
              >
                <div class="i-tabler-user-x size-4 mr-2" />
                {t('organizations.members.remove-from-organization')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) },
    ],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
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
    </div>
  );
};
export const MembersPage: Component = () => {
  const { t } = useI18n();
  const params = useParams();

  return (
    <div class="p-6 max-w-screen-md mx-auto mt-4">
      <div class="border-b mb-6 pb-4 flex justify-between items-center">
        <div>
          <h1 class="text-xl font-bold">
            {t('organizations.members.title')}
          </h1>
          <p class="text-sm text-muted-foreground">
            {t('organizations.members.description')}
          </p>
        </div>
        <Button as={A} href={`/organizations/${params.organizationId}/invite`}>
          <div class="i-tabler-plus size-4 mr-2" />
          {t('organizations.members.invite-member')}
        </Button>
      </div>

      <MemberList />
    </div>
  );
};
