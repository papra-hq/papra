import type { ParentComponent } from 'solid-js';
import { A, Navigate } from '@solidjs/router';
import { Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { Sheet, SheetContent, SheetTrigger } from '@/modules/ui/components/sheet';
import { SideNav } from '@/modules/ui/components/sidenav';
import { useCurrentUser } from '@/modules/users/composables/useCurrentUser';

const AdminLayout: ParentComponent = (props) => {
  const { t } = useI18n();

  const getNavigationMenu = () => [
    {
      label: t('admin.layout.menu.analytics'),
      href: '/admin/analytics',
      icon: 'i-tabler-chart-bar',
    },
    {
      label: t('admin.layout.menu.users'),
      href: '/admin/users',
      icon: 'i-tabler-users',
    },
    {
      label: t('admin.layout.menu.organizations'),
      href: '/admin/organizations',
      icon: 'i-tabler-building-community',
    },
  ];

  const sidenav = () => (
    <SideNav
      header={() => (
        <A href="/admin" class="flex items-center gap-2 pl-6 h-14 w-260px">
          <div class="i-tabler-layout-dashboard text-primary size-7" />
          <div class="font-medium text-base">
            {t('admin.layout.header')}
          </div>
        </A>
      )}
      mainMenu={getNavigationMenu()}
      footer={() => (
        <div class="px-4 text-sm text-muted-foreground text-center">
          Papra &copy;
          {' '}
          {new Date().getFullYear()}
        </div>
      )}
    />
  );

  return (
    <div class="h-screen bg-card flex flex-row flex-1 min-h-0">
      <div class="w-280px flex-shrink-0 hidden md:block">
        {sidenav()}
      </div>
      <div class="flex-1 flex flex-col min-h-0">
        <header class="h-14 flex items-center px-4 justify-between">
          <Sheet>
            <SheetTrigger>
              <Button variant="ghost" size="icon" class="md:hidden mr-2">
                <div class="i-tabler-menu-2 size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" class="bg-card p-0!">
              {sidenav()}
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            as={A}
            href="/"
          >
            {t('admin.layout.back-to-app')}
          </Button>
        </header>

        <div class="flex-1 min-h-0 flex flex-col md:rounded-tl-lg md:border-l border-t bg-background">
          {props.children}
        </div>
      </div>
    </div>
  );
};

export const GuardedAdminLayout: ParentComponent = (props) => {
  const { hasPermission } = useCurrentUser();

  return (
    <Show
      when={hasPermission('bo:access')}
      fallback={<Navigate href="/" />}
    >
      <AdminLayout {...props} />
    </Show>
  );
};

export default GuardedAdminLayout;
