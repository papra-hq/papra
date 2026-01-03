import type { Component } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { For, Show } from 'solid-js';
import { RelativeTime } from '@/modules/i18n/components/RelativeTime';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Badge } from '@/modules/ui/components/badge';
import { Button } from '@/modules/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { getUserDetail } from '../users.services';

export const AdminUserDetailPage: Component = () => {
  const { t } = useI18n();
  const params = useParams<{ userId: string }>();

  const query = useQuery(() => ({
    queryKey: ['admin', 'users', params.userId],
    queryFn: () => getUserDetail({ userId: params.userId }),
  }));

  return (
    <div class="p-6 max-w-screen-lg mx-auto mt-4">
      <div class="mb-6">
        <Button as={A} href="/admin/users" variant="ghost" size="sm" class="mb-4">
          <div class="i-tabler-arrow-left size-4 mr-2" />
          {t('admin.user-detail.back')}
        </Button>

        <Show
          when={!query.isLoading && query.data}
          fallback={<div class="text-center py-8 text-muted-foreground">{t('admin.user-detail.loading')}</div>}
        >
          {data => (
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
                    <CardDescription>{t('admin.user-detail.basic-info.description')}</CardDescription>
                  </CardHeader>
                  <CardContent class="space-y-3">
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">{t('admin.user-detail.basic-info.user-id')}</span>
                      <span class="font-mono text-xs">{data().user.id}</span>
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">{t('admin.user-detail.basic-info.email')}</span>
                      <span class="text-sm font-medium">{data().user.email}</span>
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">{t('admin.user-detail.basic-info.name')}</span>
                      <span class="text-sm">{data().user.name || t('admin.user-detail.basic-info.name-empty')}</span>
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">{t('admin.user-detail.basic-info.email-verified')}</span>
                      <Badge variant={data().user.emailVerified ? 'default' : 'outline'} class="text-xs">
                        {data().user.emailVerified ? t('admin.user-detail.basic-info.email-verified.yes') : t('admin.user-detail.basic-info.email-verified.no')}
                      </Badge>
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">{t('admin.user-detail.basic-info.max-organizations')}</span>
                      <span class="text-sm">{data().user.maxOrganizationCount ?? t('admin.user-detail.basic-info.max-organizations.unlimited')}</span>
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">{t('admin.user-detail.basic-info.created')}</span>
                      <RelativeTime class="text-sm" date={new Date(data().user.createdAt)} />
                    </div>
                    <div class="flex justify-between items-start">
                      <span class="text-sm text-muted-foreground">{t('admin.user-detail.basic-info.updated')}</span>
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
                      fallback={<p class="text-sm text-muted-foreground">{t('admin.user-detail.roles.empty')}</p>}
                    >
                      <div class="flex flex-wrap gap-2">
                        <For each={data().roles}>
                          {role => (
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
                    {t('admin.user-detail.organizations.title', { count: data().organizations.length })}
                  </CardTitle>
                  <CardDescription>{t('admin.user-detail.organizations.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Show
                    when={data().organizations.length > 0}
                    fallback={<p class="text-sm text-muted-foreground">{t('admin.user-detail.organizations.empty')}</p>}
                  >
                    <div class="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('admin.user-detail.organizations.table.id')}</TableHead>
                            <TableHead>{t('admin.user-detail.organizations.table.name')}</TableHead>
                            <TableHead>{t('admin.user-detail.organizations.table.created')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <For each={data().organizations}>
                            {org => (
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
                                  <RelativeTime class="text-muted-foreground text-sm" date={new Date(org.createdAt)} />
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
            </div>
          )}
        </Show>
      </div>
    </div>
  );
};

export default AdminUserDetailPage;
