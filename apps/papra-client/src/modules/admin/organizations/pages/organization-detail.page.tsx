import type { Component } from 'solid-js';
import { formatBytes } from '@corentinth/chisels';
import { A, useNavigate, useParams } from '@solidjs/router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query';
import { For, Show, Suspense } from 'solid-js';
import { RelativeTime } from '@/modules/i18n/components/RelativeTime';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { isHttpErrorWithCode } from '@/modules/shared/http/http-errors';
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
import { UserListDetail } from '../../users/components/user-list-detail.component';
import {
  deleteOrganization,
  getOrganizationBasicInfo,
  getOrganizationIntakeEmails,
  getOrganizationMembers,
  getOrganizationStats,
  getOrganizationWebhooks,
} from '../organizations.services';

const OrganizationBasicInfo: Component<{ organizationId: string }> = (props) => {
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['admin', 'organizations', props.organizationId, 'basic'],
    queryFn: async () => getOrganizationBasicInfo({ organizationId: props.organizationId }),
  }));

  return (
    <Show when={query.data}>
      {(data) => (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.organization-detail.basic-info.title')}</CardTitle>
            <CardDescription>
              {t('admin.organization-detail.basic-info.description')}
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex justify-between items-start">
              <span class="text-sm text-muted-foreground">
                {t('admin.organization-detail.basic-info.id')}
              </span>
              <span class="font-mono text-xs">{data().organization.id}</span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-sm text-muted-foreground">
                {t('admin.organization-detail.basic-info.name')}
              </span>
              <span class="text-sm font-medium">{data().organization.name}</span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-sm text-muted-foreground">
                {t('admin.organization-detail.basic-info.created')}
              </span>
              <RelativeTime class="text-sm" date={new Date(data().organization.createdAt)} />
            </div>
            <div class="flex justify-between items-start">
              <span class="text-sm text-muted-foreground">
                {t('admin.organization-detail.basic-info.updated')}
              </span>
              <RelativeTime class="text-sm" date={new Date(data().organization.updatedAt)} />
            </div>
          </CardContent>
        </Card>
      )}
    </Show>
  );
};

const OrganizationMembers: Component<{ organizationId: string }> = (props) => {
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['admin', 'organizations', props.organizationId, 'members'],
    queryFn: async () => getOrganizationMembers({ organizationId: props.organizationId }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('admin.organization-detail.members.title', { count: query.data?.members.length ?? 0 })}
        </CardTitle>
        <CardDescription>{t('admin.organization-detail.members.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Show when={query.data}>
          {(data) => (
            <Show
              when={data().members.length > 0}
              fallback={
                <p class="text-sm text-muted-foreground">
                  {t('admin.organization-detail.members.empty')}
                </p>
              }
            >
              <div class="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.organization-detail.members.table.user')}</TableHead>
                      <TableHead>{t('admin.organization-detail.members.table.id')}</TableHead>
                      <TableHead>{t('admin.organization-detail.members.table.role')}</TableHead>
                      <TableHead>{t('admin.organization-detail.members.table.joined')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <For each={data().members}>
                      {(member) => (
                        <TableRow>
                          <TableCell>
                            <UserListDetail {...member.user} />
                          </TableCell>
                          <TableCell>
                            <A
                              href={`/admin/users/${member.userId}`}
                              class="font-mono hover:underline"
                            >
                              <div class="font-mono text-sm">{member.userId}</div>
                            </A>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" class="capitalize">
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <RelativeTime
                              class="text-muted-foreground text-sm"
                              date={new Date(member.createdAt)}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </Table>
              </div>
            </Show>
          )}
        </Show>
      </CardContent>
    </Card>
  );
};

const OrganizationIntakeEmails: Component<{ organizationId: string }> = (props) => {
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['admin', 'organizations', props.organizationId, 'intake-emails'],
    queryFn: async () => getOrganizationIntakeEmails({ organizationId: props.organizationId }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('admin.organization-detail.intake-emails.title', {
            count: query.data?.intakeEmails.length ?? 0,
          })}
        </CardTitle>
        <CardDescription>
          {t('admin.organization-detail.intake-emails.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Show when={query.data}>
          {(data) => (
            <Show
              when={data().intakeEmails.length > 0}
              fallback={
                <p class="text-sm text-muted-foreground">
                  {t('admin.organization-detail.intake-emails.empty')}
                </p>
              }
            >
              <div class="space-y-2">
                <For each={data().intakeEmails}>
                  {(email) => (
                    <div class="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <div class="font-mono text-sm">{email.emailAddress}</div>
                        <div class="text-xs text-muted-foreground mt-1">
                          {email.isEnabled
                            ? t('admin.organization-detail.intake-emails.status.enabled')
                            : t('admin.organization-detail.intake-emails.status.disabled')}
                        </div>
                      </div>
                      <Badge variant={email.isEnabled ? 'default' : 'outline'}>
                        {email.isEnabled
                          ? t('admin.organization-detail.intake-emails.badge.active')
                          : t('admin.organization-detail.intake-emails.badge.inactive')}
                      </Badge>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          )}
        </Show>
      </CardContent>
    </Card>
  );
};

const OrganizationWebhooks: Component<{ organizationId: string }> = (props) => {
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['admin', 'organizations', props.organizationId, 'webhooks'],
    queryFn: async () => getOrganizationWebhooks({ organizationId: props.organizationId }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('admin.organization-detail.webhooks.title', {
            count: query.data?.webhooks.length ?? 0,
          })}
        </CardTitle>
        <CardDescription>{t('admin.organization-detail.webhooks.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Show when={query.data}>
          {(data) => (
            <Show
              when={data().webhooks.length > 0}
              fallback={
                <p class="text-sm text-muted-foreground">
                  {t('admin.organization-detail.webhooks.empty')}
                </p>
              }
            >
              <div class="space-y-2">
                <For each={data().webhooks}>
                  {(webhook) => (
                    <div class="flex items-center justify-between p-3 border rounded-md">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm truncate">{webhook.name}</div>
                        <div class="font-mono text-xs text-muted-foreground truncate mt-1">
                          {webhook.url}
                        </div>
                      </div>
                      <Badge
                        variant={webhook.enabled ? 'default' : 'outline'}
                        class="ml-2 flex-shrink-0"
                      >
                        {webhook.enabled
                          ? t('admin.organization-detail.webhooks.badge.active')
                          : t('admin.organization-detail.webhooks.badge.inactive')}
                      </Badge>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          )}
        </Show>
      </CardContent>
    </Card>
  );
};

const OrganizationStats: Component<{ organizationId: string }> = (props) => {
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['admin', 'organizations', props.organizationId, 'stats'],
    queryFn: async () => getOrganizationStats({ organizationId: props.organizationId }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.organization-detail.stats.title')}</CardTitle>
        <CardDescription>{t('admin.organization-detail.stats.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Show when={query.data}>
          {(data) => (
            <div class="space-y-3">
              <div class="flex justify-between items-start">
                <span class="text-sm text-muted-foreground">
                  {t('admin.organization-detail.stats.active-documents')}
                </span>
                <span class="text-sm font-medium">{data().stats.documentsCount}</span>
              </div>
              <div class="flex justify-between items-start">
                <span class="text-sm text-muted-foreground">
                  {t('admin.organization-detail.stats.active-storage')}
                </span>
                <span class="text-sm font-medium">
                  {formatBytes({ bytes: data().stats.documentsSize, base: 1000 })}
                </span>
              </div>
              <div class="flex justify-between items-start">
                <span class="text-sm text-muted-foreground">
                  {t('admin.organization-detail.stats.deleted-documents')}
                </span>
                <span class="text-sm font-medium">{data().stats.deletedDocumentsCount}</span>
              </div>
              <div class="flex justify-between items-start">
                <span class="text-sm text-muted-foreground">
                  {t('admin.organization-detail.stats.deleted-storage')}
                </span>
                <span class="text-sm font-medium">
                  {formatBytes({ bytes: data().stats.deletedDocumentsSize, base: 1000 })}
                </span>
              </div>
              <div class="flex justify-between items-start pt-2 border-t">
                <span class="text-sm font-medium">
                  {t('admin.organization-detail.stats.total-documents')}
                </span>
                <span class="text-sm font-bold">{data().stats.totalDocumentsCount}</span>
              </div>
              <div class="flex justify-between items-start">
                <span class="text-sm font-medium">
                  {t('admin.organization-detail.stats.total-storage')}
                </span>
                <span class="text-sm font-bold">
                  {formatBytes({ bytes: data().stats.totalDocumentsSize, base: 1000 })}
                </span>
              </div>
            </div>
          )}
        </Show>
      </CardContent>
    </Card>
  );
};

const DeleteOrganizationCard: Component<{ organizationId: string }> = (props) => {
  const { t } = useI18n();
  const { confirm } = useConfirmModal();
  const { getErrorMessage } = useI18nApiErrors({ t });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery(() => ({
    queryKey: ['admin', 'organizations', props.organizationId, 'basic'],
    queryFn: async () => getOrganizationBasicInfo({ organizationId: props.organizationId }),
  }));

  const deleteMutation = useMutation(() => ({
    mutationFn: deleteOrganization,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
        queryClient.invalidateQueries({ queryKey: ['organizations'] }),
      ]);
      createToast({ type: 'success', message: t('admin.organization-detail.delete.success') });
      navigate('/admin/organizations');
    },
    onError: (error) => {
      createToast({
        type: 'error',
        message: isHttpErrorWithCode({ error, code: 'organization.has_active_subscription' })
          ? t('admin.organization-detail.delete.has-active-subscription')
          : getErrorMessage({ error }),
      });
    },
  }));

  const handleDelete = async () => {
    const organization = query.data?.organization;

    if (!organization || organization.deletedAt || deleteMutation.isPending) {
      return;
    }

    const confirmed = await confirm({
      title: t('admin.organization-detail.delete.confirm.title'),
      message: t('admin.organization-detail.delete.confirm.message', { name: organization.name }),
      confirmButton: {
        text: t('admin.organization-detail.delete.button'),
        variant: 'destructive',
      },
      cancelButton: {
        text: t('admin.organization-detail.delete.confirm.cancel-button'),
      },
    });

    if (confirmed) {
      deleteMutation.mutate({ organizationId: organization.id });
    }
  };

  return (
    <Show when={query.data?.organization && !query.data.organization.deletedAt}>
      <Card class="border-destructive">
        <CardHeader>
          <CardTitle>{t('admin.organization-detail.delete.title')}</CardTitle>
          <CardDescription>{t('admin.organization-detail.delete.description')}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="destructive" onClick={handleDelete} isLoading={deleteMutation.isPending}>
            {t('admin.organization-detail.delete.button')}
          </Button>
        </CardFooter>
      </Card>
    </Show>
  );
};

export const AdminOrganizationDetailPage: Component = () => {
  const { t } = useI18n();
  const params = useParams<{ organizationId: string }>();

  return (
    <div class="p-6 mt-4">
      <div class="mb-6">
        <Button as={A} href="/admin/organizations" variant="ghost" size="sm" class="mb-4">
          <div class="i-tabler-arrow-left size-4 mr-2" />
          {t('admin.organization-detail.back')}
        </Button>

        <h1 class="text-2xl font-bold mb-1">{t('admin.organization-detail.title')}</h1>
        <p class="text-muted-foreground">{params.organizationId}</p>
      </div>

      <div class="space-y-6">
        <div class="grid gap-6 md:grid-cols-2">
          <Suspense
            fallback={
              <div class="text-center py-4 text-muted-foreground">
                {t('admin.organization-detail.loading.info')}
              </div>
            }
          >
            <OrganizationBasicInfo organizationId={params.organizationId} />
          </Suspense>

          <Suspense
            fallback={
              <div class="text-center py-4 text-muted-foreground">
                {t('admin.organization-detail.loading.stats')}
              </div>
            }
          >
            <OrganizationStats organizationId={params.organizationId} />
          </Suspense>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <Suspense
            fallback={
              <div class="text-center py-4 text-muted-foreground">
                {t('admin.organization-detail.loading.intake-emails')}
              </div>
            }
          >
            <OrganizationIntakeEmails organizationId={params.organizationId} />
          </Suspense>

          <Suspense
            fallback={
              <div class="text-center py-4 text-muted-foreground">
                {t('admin.organization-detail.loading.webhooks')}
              </div>
            }
          >
            <OrganizationWebhooks organizationId={params.organizationId} />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div class="text-center py-4 text-muted-foreground">
              {t('admin.organization-detail.loading.members')}
            </div>
          }
        >
          <OrganizationMembers organizationId={params.organizationId} />
        </Suspense>

        <Suspense>
          <DeleteOrganizationCard organizationId={params.organizationId} />
        </Suspense>
      </div>
    </div>
  );
};

export default AdminOrganizationDetailPage;
