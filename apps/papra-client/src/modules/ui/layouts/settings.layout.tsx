import type { ParentComponent } from 'solid-js';
import { A } from '@solidjs/router';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '../components/button';
import { SideNav } from './sidenav.layout';

export const SettingsLayout: ParentComponent = (props) => {
  const { t } = useI18n();

  const getMainMenuItems = () => [
    {
      label: t('layout.menu.account'),
      icon: 'i-tabler-user',
      href: '/settings',
    },
    {
      label: t('layout.menu.api-keys'),
      icon: 'i-tabler-key',
      href: '/api-keys',
    },
    {
      label: t('layout.menu.invitations'),
      icon: 'i-tabler-mail',
      href: '/invitations',
    },
  ];

  return (
    <div class="flex flex-row h-screen min-h-0">
      <div class="w-350px border-r border-r-border  flex-shrink-0 hidden md:block bg-card">

        <SideNav
          mainMenu={getMainMenuItems()}
          header={() => (
            <div class="pl-6 py-3 border-b border-b-border flex items-center gap-1">
              <Button variant="ghost" size="icon" class="text-muted-foreground" as={A} href="/">
                <div class="i-tabler-arrow-left size-5"></div>
              </Button>
              <h1 class="text-lg font-bold">
                {t('layout.menu.settings')}
              </h1>
            </div>
          )}
        />

      </div>
      <div class="flex-1 min-h-0 flex flex-col">
        {props.children}
      </div>
    </div>
  );
};
