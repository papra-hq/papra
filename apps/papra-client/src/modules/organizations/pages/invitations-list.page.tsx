import type { Component } from 'solid-js';
import type { OrganizationInvitation, OrganizationInvitationStatus, OrganizationMemberRole } from '../organizations.types';
import { A, useNavigate, useParams } from '@solidjs/router';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createSolidTable, flexRender, getCoreRowModel, getPaginationRowModel } from '@tanstack/solid-table';
import { For, Match, onMount, Show, Switch } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { cancelInvitation, resendInvitation } from '@/modules/invitations/invitations.services';
import { useConfirmModal } from '@/modules/shared/confirm';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { queryClient } from '@/modules/shared/query/query-client';
import { Badge } from '@/modules/ui/components/badge';
import { Button } from '@/modules/ui/components/button';
import { EmptyState } from '@/modules/ui/components/empty';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { useCurrentUserRole } from '../organizations.composables';
import { ORGANIZATION_INVITATION_STATUS } from '../organizations.constants';
import { fetchOrganizationInvitations } from '../organizations.services';

const InvitationStatusBadge: Component<{ status: OrganizationInvitationStatus }> = (props) => {
  const { t } = useI18n();

  const getStatus = () => t(`organizations.invitations.status.${props.status}`);
  const getVariant = () => ({
    [ORGANIZATION_INVITATION_STATUS.PENDING]: 'default',
    [ORGANIZATION_INVITATION_STATUS.ACCEPTED]: 'default',
    [ORGANIZATION_INVITATION_STATUS.REJECTED]: 'destructive',
    [ORGANIZATION_INVITATION_STATUS.EXPIRED]: 'destructive',
    [ORGANIZATION_INVITATION_STATUS.CANCELLED]: 'destructive',
  } as const)[props.status] ?? 'default';

  return <Badge variant={getVariant()}>{getStatus()}</Badge>;
};

const InvitationActions: Component<{ invitation: OrganizationInvitation }> = (props) => {
  const { t } = useI18n();
  const { confirm } = useConfirmModal();

  const cancelMutation = useMutation(() => ({
    mutationFn: (invitationId: string) => cancelInvitation({ invitationId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', props.invitation.organizationId, 'invitations'] });
    },
  }));

  const resendMutation = useMutation(() => ({
    mutationFn: (invitationId: string) => resendInvitation({ invitationId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', props.invitation.organizationId, 'invitations'] });
    },
  }));

  const handleCancel = async () => {
    const isConfirmed = await confirm({
      title: t('organizations.invitations.cancel.title'),
      message: t('organizations.invitations.cancel.description'),
      confirmButton: {
        text: t('organizations.invitations.cancel.confirm'),
        variant: 'destructive',
      },
      cancelButton: {
        text: t('organizations.invitations.cancel.cancel'),
      },
    });

    if (!isConfirmed) {
      return;
    }

    cancelMutation.mutate(props.invitation.id);
  };

  const handleResend = async () => {
    const isConfirmed = await confirm({
      title: t('organizations.invitations.resend.title'),
      message: t('organizations.invitations.resend.description'),
      confirmButton: {
        text: t('organizations.invitations.resend.confirm'),
        variant: 'default',
      },
      cancelButton: {
        text: t('organizations.invitations.resend.cancel'),
      },
    });

    if (!isConfirmed) {
      return;
    }

    resendMutation.mutate(props.invitation.id);
  };

  return (
    <Switch>
      <Match when={props.invitation.status === ORGANIZATION_INVITATION_STATUS.PENDING}>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={cancelMutation.isPending}
        >
          <div class="i-tabler-x size-4 mr-2" />
          {t('organizations.invitations.cancel.confirm')}
        </Button>
      </Match>

      <Match when={([
        ORGANIZATION_INVITATION_STATUS.REJECTED,
        ORGANIZATION_INVITATION_STATUS.EXPIRED,
        ORGANIZATION_INVITATION_STATUS.CANCELLED,
      ] as OrganizationInvitationStatus[]).includes(props.invitation.status)}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={handleResend}
          disabled={resendMutation.isPending}
        >
          <div class="i-tabler-refresh size-4 mr-2" />
          {t('organizations.invitations.resend')}
        </Button>
      </Match>

    </Switch>
  );
};

const InvitationsList: Component = () => {
  const params = useParams();
  const { t } = useI18n();
  const query = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'invitations'],
    queryFn: () => fetchOrganizationInvitations({ organizationId: params.organizationId }),
  }));

  const table = createSolidTable({
    get data() {
      return query.data?.invitations.filter(invitation => !([ORGANIZATION_INVITATION_STATUS.ACCEPTED] as OrganizationInvitationStatus[]).includes(invitation.status)) ?? [];
    },
    columns: [
      { header: t('organizations.members.table.headers.email'), accessorKey: 'email' },
      { header: t('organizations.members.table.headers.role'), accessorKey: 'role', cell: data => t(`organizations.members.roles.${data.getValue<OrganizationMemberRole>()}`) },
      {
        header: t('invitations.list.headers.status'),
        accessorKey: 'status',
        cell: data => <InvitationStatusBadge status={data.getValue()} />,
      },
      {
        header: t('organizations.members.table.headers.created'),
        accessorKey: 'createdAt',
        cell: data => <span title={data.getValue<Date>().toLocaleString()} class="text-muted-foreground">{timeAgo({ date: data.getValue<Date>() })}</span>,
      },
      {
        header: '',
        id: 'actions',
        cell: data => (
          <div class="flex items-center justify-end">
            <InvitationActions invitation={data.row.original} />
          </div>
        ),
      },
    ],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>

      <Show when={query.data?.invitations.length === 0}>
        <EmptyState
          title={t('organizations.invitations.list.empty.title')}
          description={t('organizations.invitations.list.empty.description')}
          icon="i-tabler-mail"
          cta={(
            <Button as={A} href={`/organizations/${params.organizationId}/invite`} variant="outline">
              <div class="i-tabler-plus size-4 mr-2" />
              {t('organizations.invitations.list.cta')}
            </Button>
          )}
        />
      </Show>

      <Show when={query.data?.invitations.length}>
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

export const InvitationsListPage: Component = () => {
  const { t } = useI18n();
  const params = useParams();
  const navigate = useNavigate();
  const { getIsAtLeastAdmin } = useCurrentUserRole({ organizationId: params.organizationId });

  onMount(() => {
    if (!getIsAtLeastAdmin()) {
      navigate(`/organizations/${params.organizationId}/members`);
    }
  });

  return (
    <div class="p-6 max-w-screen-md mx-auto mt-4 ">
      <div class="border-b mb-6 pb-4">

        <div>
          <Button as={A} href={`/organizations/${params.organizationId}/members`} variant="ghost" class="ml--4 text-muted-foreground">
            <div class="i-tabler-arrow-left size-4 mr-2" />
            {t('organizations.members.title')}
          </Button>
        </div>
        <h1 class="text-xl font-bold">
          {t('organizations.invitations.title')}
        </h1>
        <p class="text-sm text-muted-foreground">
          {t('organizations.invitations.description')}
        </p>
      </div>

      <InvitationsList />
    </div>
  );
};
