import type { Component } from 'solid-js';
import { safely } from '@corentinth/chisels';
import { A, useNavigate, useParams } from '@solidjs/router';
import { useQuery, useQueryClient } from '@tanstack/solid-query';
import { createSignal, For, Show } from 'solid-js';
import { RelativeTime } from '@/modules/i18n/components/RelativeTime';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { Badge } from '@/modules/ui/components/badge';
import { Button } from '@/modules/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/modules/ui/components/card';
import { createToast } from '@/modules/ui/components/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/ui/components/table';
import { useCurrentUser } from '@/modules/users/composables/useCurrentUser';
import { GrantPlanEntitlementDialog } from '../components/grant-plan-entitlement-dialog.component';
import { deleteUser, getUserDetail, revokePlanEntitlement } from '../users.services';
import { useConfig } from '@/modules/config/config.provider';

export const AdminUserDetailPage: Component = () => {
  const { t } = useI18n();
  const params = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm } = useConfirmModal();
  const { getErrorMessage } = useI18nApiErrors({ t });
  const { user: currentUser } = useCurrentUser();
  const { config } = useConfig();

  const [getIsGrantDialogOpen, setIsGrantDialogOpen] = createSignal(false);

  const query = useQuery(() => ({
    queryKey: ['admin', 'users', params.userId],
    queryFn: async () => getUserDetail({ userId: params.userId }),
  }));

  const handleRevokeEntitlement = async (planEntitlement: { id: string; type: string }) => {
    const confirmed = await confirm({
      title: t('admin.user-detail.plan-entitlements.revoke.confirm.title'),
      message: t('admin.user-detail.plan-entitlements.revoke.confirm.message'),
      confirmButton: {
        text: t('admin.user-detail.plan-entitlements.revoke.confirm.confirm-button'),
        variant: 'destructive',
      },
      cancelButton: {
        text: t('admin.user-detail.plan-entitlements.revoke.confirm.cancel-button'),
      },
    });

    if (!confirmed) {
      return;
    }

    const [, error] = await safely(
      revokePlanEntitlement({ userId: params.userId, planEntitlementId: planEntitlement.id }),
    );

    if (error) {
      createToast({ type: 'error', message: getErrorMessage({ error }) });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['admin', 'users', params.userId] });
    createToast({
      type: 'success',
      message: t('admin.user-detail.plan-entitlements.revoke.success'),
    });
  };

  const handleDelete = async (targetUser: { id: string; email: string }) => {
    const confirmed = await confirm({
      title: t('admin.user-detail.delete.confirm.title'),
      message: t('admin.user-detail.delete.confirm.message'),
      confirmButton: {
        text: t('admin.user-detail.delete.confirm.confirm-button'),
        variant: 'destructive',
      },
      cancelButton: {
        text: t('admin.user-detail.delete.confirm.cancel-button'),
      },
      shouldType: targetUser.email,
    });

    if (!confirmed) {
      return;
    }

    const [, error] = await safely(deleteUser({ userId: targetUser.id }));

    if (error) {
      createToast({ type: 'error', message: getErrorMessage({ error }) });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    createToast({ type: 'success', message: t('admin.user-detail.delete.success') });
    navigate('/admin/users');
  };

  return (
    <div class="p-6 max-w-screen-lg mx-auto mt-4">
      <div class="mb-6">
        <Button as={A} href="/admin/users" variant="ghost" size="sm" class="mb-4">
          <div class="i-tabler-arrow-left size-4 mr-2" />
          {t('admin.user-detail.back')}
        </Button>

        <Show
          when={!query.isLoading && query.data}
          fallback={
            <div class="text-center py-8 text-muted-foreground">
              {t('admin.user-detail.loading')}
            </div>
          }
        >
          {(data) => (
            <div class="space-y-6">
              <div class="border-b pb-4">
                <h1 class="text-2xl font-bold flex items-center gap-3">
                  {data().user.name || t('admin.user-detail.unnamed')}
                </h1>
                <p class="text-muted-foreground mt-1">{data().user.email}</p>
              </div>

              <div class="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.user-detail.basic-info.title')}</CardTitle>
                    <CardDescription>
                      {t('admin.user-detail.basic-info.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent class="space-y-3">
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">
                        {t('admin.user-detail.basic-info.user-id')}
                      </span>
                      <span class="font-mono text-xs">{data().user.id}</span>
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">
                        {t('admin.user-detail.basic-info.email')}
                      </span>
                      <span class="text-sm font-medium">{data().user.email}</span>
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">
                        {t('admin.user-detail.basic-info.name')}
                      </span>
                      <span class="text-sm">
                        {data().user.name || t('admin.user-detail.basic-info.name-empty')}
                      </span>
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">
                        {t('admin.user-detail.basic-info.email-verified')}
                      </span>
                      <Badge
                        variant={data().user.emailVerified ? 'default' : 'outline'}
                        class="text-xs"
                      >
                        {data().user.emailVerified
                          ? t('admin.user-detail.basic-info.email-verified.yes')
                          : t('admin.user-detail.basic-info.email-verified.no')}
                      </Badge>
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">
                        {t('admin.user-detail.basic-info.max-organizations')}
                      </span>
                      <span class="text-sm">
                        {data().user.maxOrganizationCount ??
                          t('admin.user-detail.basic-info.max-organizations.unlimited')}
                      </span>
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">
                        {t('admin.user-detail.basic-info.created')}
                      </span>
                      <RelativeTime class="text-sm" date={new Date(data().user.createdAt)} />
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">
                        {t('admin.user-detail.basic-info.updated')}
                      </span>
                      <RelativeTime class="text-sm" date={new Date(data().user.updatedAt)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.user-detail.roles.title')}</CardTitle>
                    <CardDescription>{t('admin.user-detail.roles.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Show
                      when={data().roles.length > 0}
                      fallback={
                        <p class="text-sm text-muted-foreground">
                          {t('admin.user-detail.roles.empty')}
                        </p>
                      }
                    >
                      <div class="flex flex-wrap gap-2">
                        <For each={data().roles}>
                          {(role) => (
                            <Badge variant="secondary" class="font-mono">
                              {role}
                            </Badge>
                          )}
                        </For>
                      </div>
                    </Show>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('admin.user-detail.organizations.title', {
                      count: data().organizations.length,
                    })}
                  </CardTitle>
                  <CardDescription>
                    {t('admin.user-detail.organizations.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Show
                    when={data().organizations.length > 0}
                    fallback={
                      <p class="text-sm text-muted-foreground">
                        {t('admin.user-detail.organizations.empty')}
                      </p>
                    }
                  >
                    <div class="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('admin.user-detail.organizations.table.id')}</TableHead>
                            <TableHead>{t('admin.user-detail.organizations.table.name')}</TableHead>
                            <TableHead>
                              {t('admin.user-detail.organizations.table.created')}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <For each={data().organizations}>
                            {(org) => (
                              <TableRow>
                                <TableCell>
                                  <A
                                    href={`/admin/organizations/${org.id}`}
                                    class="font-mono text-xs hover:underline text-primary"
                                  >
                                    {org.id}
                                  </A>
                                </TableCell>
                                <TableCell>
                                  <A
                                    href={`/admin/organizations/${org.id}`}
                                    class="font-medium hover:underline"
                                  >
                                    {org.name}
                                  </A>
                                </TableCell>
                                <TableCell>
                                  <RelativeTime
                                    class="text-muted-foreground text-sm"
                                    date={new Date(org.createdAt)}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </For>
                        </TableBody>
                      </Table>
                    </div>
                  </Show>
                </CardContent>
              </Card>

              {config.isSubscriptionsEnabled && (
                <Card>
                  <CardHeader class="flex-row items-start justify-between space-y-0 gap-4">
                    <div class="space-y-1.5">
                      <CardTitle>{t('admin.user-detail.plan-entitlements.title')}</CardTitle>
                      <CardDescription>
                        {t('admin.user-detail.plan-entitlements.description')}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      class="flex-shrink-0"
                      disabled={data().availablePlanEntitlementTypes.every((type) =>
                        data().planEntitlements.some((entitlement) => entitlement.type === type),
                      )}
                      onClick={() => setIsGrantDialogOpen(true)}
                    >
                      <div class="i-tabler-plus size-4 mr-2" />
                      {t('admin.user-detail.plan-entitlements.grant.button')}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Show
                      when={data().planEntitlements.length > 0}
                      fallback={
                        <p class="text-sm text-muted-foreground">
                          {t('admin.user-detail.plan-entitlements.empty')}
                        </p>
                      }
                    >
                      <div class="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                {t('admin.user-detail.plan-entitlements.table.type')}
                              </TableHead>
                              <TableHead>
                                {t('admin.user-detail.plan-entitlements.table.source')}
                              </TableHead>
                              <TableHead>
                                {t('admin.user-detail.plan-entitlements.table.granted')}
                              </TableHead>
                              <TableHead>
                                {t('admin.user-detail.plan-entitlements.table.expires')}
                              </TableHead>
                              <TableHead />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <For each={data().planEntitlements}>
                              {(entitlement) => (
                                <TableRow>
                                  <TableCell>
                                    <Badge variant="secondary" class="font-mono">
                                      {entitlement.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" class="font-mono">
                                      {entitlement.source}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <RelativeTime
                                      class="text-sm"
                                      date={new Date(entitlement.grantedAt)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Show
                                      when={entitlement.expiresAt}
                                      fallback={
                                        <span class="text-sm text-muted-foreground">
                                          {t('admin.user-detail.plan-entitlements.never-expires')}
                                        </span>
                                      }
                                    >
                                      {(getExpiresAt) => (
                                        <span class="flex items-center gap-2">
                                          <RelativeTime
                                            class="text-sm"
                                            date={new Date(getExpiresAt())}
                                          />
                                          <Show when={new Date(getExpiresAt()) < new Date()}>
                                            <Badge variant="destructive" class="text-xs">
                                              {t('admin.user-detail.plan-entitlements.expired')}
                                            </Badge>
                                          </Show>
                                        </span>
                                      )}
                                    </Show>
                                  </TableCell>
                                  <TableCell class="text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      class="text-destructive"
                                      onClick={async () => handleRevokeEntitlement(entitlement)}
                                    >
                                      {t('admin.user-detail.plan-entitlements.revoke.button')}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )}
                            </For>
                          </TableBody>
                        </Table>
                      </div>
                    </Show>
                  </CardContent>
                </Card>
              )}

              <GrantPlanEntitlementDialog
                userId={params.userId}
                availableTypes={data().availablePlanEntitlementTypes.filter(
                  (type) =>
                    !data().planEntitlements.some((entitlement) => entitlement.type === type),
                )}
                open={getIsGrantDialogOpen()}
                onOpenChange={setIsGrantDialogOpen}
              />

              <Card class="border-destructive">
                <CardHeader>
                  <CardTitle>{t('admin.user-detail.delete.title')}</CardTitle>
                  <CardDescription>{t('admin.user-detail.delete.description')}</CardDescription>
                </CardHeader>
                <CardFooter class="gap-4 flex-col items-start sm:flex-row sm:items-center">
                  <Button
                    variant="destructive"
                    class="flex-shrink-0"
                    disabled={data().user.id === currentUser.id}
                    onClick={async () => handleDelete(data().user)}
                  >
                    {t('admin.user-detail.delete.button')}
                  </Button>
                  <Show when={data().user.id === currentUser.id}>
                    <span class="text-xs text-muted-foreground">
                      {t('admin.user-detail.delete.self-warning')}
                    </span>
                  </Show>
                </CardFooter>
              </Card>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
};

export default AdminUserDetailPage;
